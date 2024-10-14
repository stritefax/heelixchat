use crate::configuration::state::ServiceAccess;
use crate::database;
use crate::engine::similarity_search_engine::TOPK;
use crate::repository::activity_log_repository::get_activity_full_text_by_id;
use crate::repository::activity_log_repository::get_additional_ids_from_sql_db;
use crate::repository::settings_repository::get_setting;
use async_openai::{
    config::OpenAIConfig,
    types::{
        ChatCompletionRequestSystemMessageArgs, ChatCompletionRequestUserMessageArgs,
        CreateChatCompletionRequestArgs,
    },
    Client as OpenAIClient,
};
use futures::StreamExt;
use log::{debug, error, info};
use serde::{Deserialize, Serialize};
use serde_json;
use std::collections::HashSet;
use tauri::Manager;

const MODEL_FAST: &str = "gpt-3.5-turbo";
const MODEL_CHEAP: &str = "gpt-4";
const MODEL_MAIN: &str = "gpt-4o";

#[derive(Serialize, Deserialize)]
pub struct Message {
    role: String,
    content: String,
}

#[tauri::command]
pub async fn send_prompt_to_openai(
    app_handle: tauri::AppHandle,
    conversation_history: Vec<Message>,
    is_first_message: bool,
    combined_activity_text: String,
) -> Result<(), String> {
    let setting =
        app_handle.db(|db| get_setting(db, "api_key_open_ai").expect("Failed on api_key_open_ai"));

    let relevance_client =
        OpenAIClient::with_config(OpenAIConfig::new().with_api_key(&setting.setting_value));
    let mut filtered_context = String::new();
    let mut window_titles = Vec::new();

    if is_first_message {
        // Perform similarity search and relevance filtering only for the first message
        let user_prompt = conversation_history
            .last()
            .map(|msg| msg.content.clone())
            .unwrap_or_default();
        info!("User_prompt: {}", user_prompt);

        let relevant_keywords =
            identify_relevant_keywords_gpt4(&user_prompt, &setting.setting_value).await?;

        // Perform similarity search in OasysDB
        info!("Getting database instance");

        let hnsw_bind = database::get_vector_db(&app_handle)
            .await
            .expect("Database initialization failed!");
        let top_k = TOPK;
        let hnsw_guard = hnsw_bind.lock().await;
        info!("Setting up database lock");
        let db = hnsw_guard.as_ref().expect("HNSW database not initialized!");
        info!("Initiating similarity search...");

        let similar_ids_with_distances = db
            .top_k(&user_prompt, top_k, &setting.setting_value)
            .await
            .map_err(|e| format!("Similarity search failed: {}", e))?;

        // Collect the results into a vector that we can use multiple times
        let similar_ids_vec: Vec<(i64, f32)> = similar_ids_with_distances
            .into_iter()
            .map(|(id, distance)| (id as i64, distance))
            .collect();

        let similar_ids: Vec<i64> = similar_ids_vec.iter().map(|(id, _)| *id).collect();

        let additional_ids = app_handle
            .db(|db| {
                let result = get_additional_ids_from_sql_db(db, 3, &relevant_keywords);
                return result;
            })
            .map_err(|e| format!("Failed to retrieve additional IDs from SQL database: {}", e))?;

        let mut all_ids_set = HashSet::new();
        all_ids_set.extend(similar_ids);
        all_ids_set.extend(additional_ids);

        // Retrieve the corresponding documents from the SQL database
        let mut context = String::new(); // Assuming context is initialized earlier

        for (index, document_id) in all_ids_set.iter().enumerate() {
            let result: Option<(String, String)> = app_handle
                .db(|db| get_activity_full_text_by_id(db, *document_id, Some(1000)))
                .map_err(|e| {
                    format!(
                        "Failed to retrieve edited full text for ID {}: {}",
                        document_id, e
                    )
                })
                .unwrap_or_else(|err| {
                    error!("{}", err);
                    None
                });

            if let Some((_window_title, text)) = result {
                debug!("Document {}: ID: {}", index + 1, document_id);
                debug!("Document {}: Content: {}", index + 1, text);
                context.push_str(&format!(
                    "Document ID: {}\nContent:\n{}\n\n",
                    document_id, text
                ));
            }
        }

        if context.is_empty() {
            context.push_str("No relevant documents found.\n\n");
        }
        // Continue with any further processing that requires the context

        // Send the documents to the OpenAI model for relevance filtering
        let relevance_system_prompt = format!(
            "The user's prompt is: {}\n\n. You are an intelligent and logical personal assistant. Your task is to carefully review the content of provided documents and output solely a maximum of four numerical IDs of the documents that are directly related to the user prompt and are highly likely to help in answering the user's prompt (corresponding to the Document ID at the beginning of each document). If an individual document is not extremely relevant to the user prompt and the user prompt can be successfully answered without that document, do not include it in the list of returned documents.

            Examples of relevant and irrelevant documents in different business scenarios:
        
            Example 1: The user prompt is to outline effective marketing strategies for social media.
            - Relevant document:
                Document ID: 55
                Content: This document details various social media marketing strategies, which is directly relevant to the user's prompt.
            - Irrelevant document:
                Document ID: 78
                Content: This document describes traditional print advertising methods, which is not relevant to social media marketing strategies.
        
            Example 2: The user prompt is researching the best programming practices for AI development.
            - Relevant document:
                Document ID: 33
                Content: This document provides best practices for AI development, which is directly relevant to the user's prompt.
            - Irrelevant document:
                Document ID: 47
                Content: This document discusses basic HTML and CSS programming, which is not relevant to the user's prompt about AI development.
        
            Example 3: The user prompt asks for recommended books on investment strategies.
            - Relevant documents:
                Document ID: 17
                Content: This document lists top-rated books on investment strategies, highly relevant to the user's prompt.
                Document ID: 106
                Content: This document summarizes famous investment strategies, which is also relevant to the user's prompt.
                Document ID: 204
                Content: This document contains interviews with successful investors discussing their strategies, directly relevant to the user's prompt.
                Document ID: 345
                Content: This document reviews recent books on future investment trends, relevant to the user's prompt.
            - Irrelevant document:
                Document ID: 88
                Content: This document covers general finance tips, which may not be directly relevant to specific investment strategies.
        
            Example 4: The user prompt is to find best practices for remote team management.
            - Relevant document:
                Document ID: 99
                Content: This document covers best practices for managing remote teams, directly relevant to the user's prompt.
            - Irrelevant document:
                Document ID: 65
                Content: This document discusses in-office team-building activities, which are not relevant to managing remote teams.
        
            Example 5: The user prompt is about analyzing the latest trends in cybersecurity.
            - Relevant documents:
                Document ID: 120
                Content: This document provides a detailed analysis of the latest cybersecurity trends, directly relevant to the user's prompt.
                Document ID: 150
                Content: This document includes recent cybersecurity reports and data, relevant to understanding current trends.
            - Irrelevant document:
                Document ID: 88
                Content: This document outlines historical cybersecurity breaches, which may not be directly relevant to analyzing current trends.
                Document ID: 200
                Content: This document focuses on outdated cybersecurity practices, which are not relevant to the latest trends.
        
            Example 6: The user prompt asks for guidelines on creating an investment portfolio.
            - Relevant document:
                Document ID: 300
                Content: This document provides detailed guidelines on how to create and manage an investment portfolio, highly relevant to the user's prompt.
            - Irrelevant document:
                Document ID: 77
                Content: This document discusses corporate investment strategies, which may not be directly applicable to individual investment portfolios.
        
            Example 7: The user prompt asks for something not covered by any provided document.
            - User prompt: Strategies for eco-friendly business operations.
            - No documents: None of the documents provided contain information about eco-friendly business operations, so no documents should be returned.
        
            The user's prompt is: {}\n\nOutput the relevant document IDs as a comma-separated list of numbers only or an empty list, with absolutely no other additional text or explanations. For example: 123,456,789 or an empty list.",
            user_prompt, user_prompt
        );

        let relevance_request = CreateChatCompletionRequestArgs::default()
            .model(MODEL_FAST)
            .messages([
                ChatCompletionRequestSystemMessageArgs::default()
                    .content(relevance_system_prompt)
                    .build()
                    .map_err(|e| format!("Failed to build system message: {}", e))?
                    .into(),
                ChatCompletionRequestUserMessageArgs::default()
                    .content(context)
                    .build()
                    .map_err(|e| format!("Failed to build user message: {}", e))?
                    .into(),
            ])
            .build()
            .map_err(|e| format!("Failed to build request: {}", e))?;

        let relevance_response = relevance_client
            .chat()
            .create(relevance_request)
            .await
            .map_err(|e| format!("Relevance filtering request failed: {}", e))?;

        debug!("Relevance filtering response: {:?}", relevance_response);

        if let Some(relevance_result) = relevance_response.choices.first() {
            let relevant_document_ids: Vec<i64> = relevance_result
                .message
                .content
                .as_ref()
                .unwrap_or(&String::new())
                .split(|c: char| !c.is_numeric())
                .filter_map(|s| s.parse().ok())
                .collect();

            debug!("Relevant document IDs: {:?}", relevant_document_ids);

            // Retrieve the full text of the highly relevant documents
            for document_id in relevant_document_ids {
                let result: Option<(String, String)> = app_handle
                    .db(|db| get_activity_full_text_by_id(db, document_id, Some(10000)))
                    .map_err(|e| format!("Failed to retrieve edited full text: {}", e))?;

                if let Some((window_title, text)) = result {
                    filtered_context.push_str(&format!(
                        "Document ID: {}\nContent:\n{}\n\n",
                        document_id, text
                    ));
                    window_titles.push(window_title);
                }
            }

            debug!(
                "Filtered context for final response generation: {}",
                filtered_context
            );
        }
    }

    // Prepare the conversation history for the OpenAI API
    let conversation_history_content = conversation_history
        .iter()
        .rev() // Reverse the order of messages
        .skip(1) // Skip the last user message
        .rev() // Reverse the order back to original
        .map(|message| {
            let role = if message.role == "user" {
                "User"
            } else {
                "Assistant"
            };
            format!("{}: {}", role, message.content)
        })
        .collect::<Vec<String>>()
        .join("\n");

    let system_prompt = format!(
            "You are Heelix chat app that is powered by OpenAI LLM. Heelix chat is developed by Heelix Technologies. Only identify yourself as such.

            The following documents were retrieved from the user's device and may help in answering the prompt. Review them carefully to decide if they are relevant. If they are, use them to answer the query. If they are not relevant to the query, ignore them completely when responding and respond as if they were not there without mentioning having received them at all.\n\n{}\n\nAttached is the conversation history for context only. When answering, only give a single assistant response; do not continue the conversation with a user answer:\n{}\n\n",
            filtered_context, conversation_history_content
        );

    let mut user_message = conversation_history
        .last()
        .map(|msg| msg.content.clone())
        .unwrap_or_default();

    if !combined_activity_text.is_empty() {
        user_message = format!(
            "{}The following is additional context from selected activities:\n{}",
            user_message, combined_activity_text
        );
    }
    let request = CreateChatCompletionRequestArgs::default()
        .model(MODEL_MAIN)
        .messages([
            ChatCompletionRequestSystemMessageArgs::default()
                .content(system_prompt)
                .build()
                .unwrap()
                .into(),
            ChatCompletionRequestUserMessageArgs::default()
                .content(user_message)
                .build()
                .unwrap()
                .into(),
        ])
        .build()
        .map_err(|e| format!("Failed to build request: {}", e))?;

    let response_client =
        OpenAIClient::with_config(OpenAIConfig::new().with_api_key(&setting.setting_value));
    let mut stream = response_client
        .chat()
        .create_stream(request)
        .await
        .map_err(|e| format!("Failed to create chat completion stream: {}", e))?;

    let mut completion = String::new();

    while let Some(result) = stream.next().await {
        match result {
            Ok(response) => {
                if let Some(choice) = response.choices.first() {
                    if let Some(content) = &choice.delta.content {
                        completion.push_str(content);
                    }
                }
            }
            Err(e) => {
                return Err(format!("Error while streaming response: {}", e));
            }
        }

        app_handle
            .get_window("main")
            .expect("Failed to get main window")
            .emit("llm_response", completion.clone())
            .map_err(|e| format!("Failed to emit response: {}", e))?;

        app_handle
            .get_window("main")
            .expect("Failed to get main window")
            .emit(
                "window_titles",
                serde_json::to_string(&window_titles).unwrap(),
            )
            .map_err(|e| format!("Failed to emit window titles: {}", e))?;
    }

    // Estimate token usage based on word count
    let word_count = completion.split_whitespace().count();
    let output_tokens = (word_count as f64 * 0.75) as i64;

    info!("Estimated tokens used: {}", output_tokens);

    // Emit the estimated token usage to the frontend
    app_handle
        .get_window("main")
        .expect("Failed to get main window")
        .emit("output_tokens", output_tokens)
        .map_err(|e| format!("Failed to emit estimated tokens: {}", e))?;

    info!("Result from OpenAI: {}", completion);
    Ok(())
}

pub async fn identify_relevant_keywords_gpt4(
    prompt: &str,
    api_key: &str,
) -> Result<Vec<String>, String> {
    let client = OpenAIClient::with_config(OpenAIConfig::new().with_api_key(api_key));
    let system_prompt = r#"You are a Keyword Extraction Specialist. Your task is to extract only the keywords that MUST be present in the relevant file based on the user search, including file names, proper names (client names, correspondent names), function names. These keywords should be as close as possible to the user's original words and should not include any additional or expanded terms. Your output should consist of a list of three or fewer prioritized keywords in JSON format, closely following user semantics.
Examples:
User prompt: "Update the risk assessment document for Project Delta with the latest compliance regulations."
Expected output: ["Delta", "risk"]
User prompt: "Draft an email to Jackson about improvements in Project ABC main.tsx file and login.tsx files."
Expected output: ["Jackson", "main.tsx", "login.tsx"]
User prompt: "Improve the performance of the data processing script data_processor.py in the analytics module."
Expected output: ["data_processor.py"]
User prompt: "Investigate the bug reported by Sarah in the user authentication flow in auth.js, specifically in the loginUser function."
Expected output: ["auth.js","loginUser"]
User prompt: "Refactor the getProduct Details function in the product.js file to optimize database queries."
Expected output: ["product.js", "getProductDetails","getProduct_Details"]
User prompt: "Compare the features and pricing plans of Zoom and Microsoft Teams for our team's video conferencing needs."
Expected output: []
User prompt: "Summarize the key points from the Q3 financial report for the upcoming board meeting."
Expected output: []
Output the relevant keywords as a JSON array of strings, with absolutely no other additional text or explanations."#;

    let user_prompt = format!(
        r#"Extract only the keywords that must be present in the file based on the following user search, including file names and function names:
{}"#,
        prompt
    );

    let request = CreateChatCompletionRequestArgs::default()
        .model(MODEL_CHEAP)
        .messages([
            ChatCompletionRequestSystemMessageArgs::default()
                .content(system_prompt)
                .build()
                .unwrap()
                .into(),
            ChatCompletionRequestUserMessageArgs::default()
                .content(user_prompt)
                .build()
                .unwrap()
                .into(),
        ])
        .build()
        .map_err(|e| format!("Failed to build request: {}", e))?;

    let response = client
        .chat()
        .create(request)
        .await
        .map_err(|e| format!("Failed to send request: {}", e))?;

    if let Some(choice) = response.choices.first() {
        if let Some(content) = &choice.message.content {
            let keywords: Vec<String> = serde_json::from_str(content)
                .map_err(|e| format!("Failed to parse keyword identification response: {}", e))?;

            debug!("Identified keywords: {:?}", keywords);
            Ok(keywords)
        } else {
            Err("No content in the response".to_string())
        }
    } else {
        Err("No choices in the response".to_string())
    }
}
