use futures::StreamExt;
use log::{debug, error, info};
use reqwest::{Client, Response};
use serde::{Deserialize, Serialize};
use serde_json;
use std::collections::HashSet;
use std::time::Duration;
use tauri::{AppHandle, Manager};

use crate::configuration::state::ServiceAccess;
use crate::database;
use crate::engine::similarity_search_engine::TOPK;
use crate::repository::activity_log_repository::get_activity_full_text_by_id;
use crate::repository::activity_log_repository::get_additional_ids_from_sql_db;
use crate::repository::settings_repository::get_setting;

#[derive(Serialize)]
struct ClaudeRequest {
    model: String,
    max_tokens: usize,
    messages: Vec<Message>,
    system: String,
    stream: bool,
}

#[derive(Serialize, Deserialize)]
pub struct Message {
    role: String,
    content: String,
}

#[derive(Deserialize)]
struct ClaudeResponse {
    content: Vec<Content>,
    usage: Usage,
}

#[derive(Deserialize)]
struct Usage {
    input_tokens: u32,
    output_tokens: u32,
}

#[derive(Deserialize)]
struct Content {
    text: String,
}

const ANTHROPIC_URL: &str = "https://api.anthropic.com/v1/messages";
const ANTRHOPIC_MODEL: &str = "claude-3-haiku-20240307";
const ANTRHOPIC_MAIN_MODEL: &str = "claude-3-5-sonnet-20241022";
const ANTRHOPIC_MODEL_CHEAP: &str = "claude-3-5-haiku-20241022";

#[tauri::command]
pub async fn send_prompt_to_llm(
    app_handle: tauri::AppHandle,
    conversation_history: Vec<Message>,
    is_first_message: bool,
    combined_activity_text: String,
) -> Result<(), String> {
    let setting =
        app_handle.db(|db| get_setting(db, "api_key_claude").expect("Failed on api_key_claude"));
    let setting_openai =
        app_handle.db(|db| get_setting(db, "api_key_open_ai").expect("Failed on api_key_open_ai"));

    // Configure client with keep-alive and proper timeouts
    let client = Client::builder()
        .timeout(Duration::from_secs(180))  // Increased timeout
        .tcp_keepalive(Duration::from_secs(60))  // Keep connection alive for 60 seconds
        .pool_idle_timeout(Duration::from_secs(90))  // Allow connections to stay in pool
        .pool_max_idle_per_host(2)  // Keep up to 2 idle connections per host
        .connect_timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Failed to create client: {}", e))?;

    let mut filtered_context = String::new();
    let mut window_titles = Vec::new();
    debug!("Combined activity text: {}", combined_activity_text);

    if is_first_message {
        let user_prompt = conversation_history
            .last()
            .map(|msg| msg.content.clone())
            .unwrap_or_default();
        info!("User Prompt: {}", user_prompt);
        
        let relevant_keywords =
            match identify_relevant_keywords(&user_prompt, &setting.setting_value).await {
                Ok(keywords) => keywords,
                Err(err) => {
                    error!(
                        "Keyword extraction failed: {}. Using the entire prompt as fallback keywords.",
                        err
                    );
                    vec![user_prompt.clone()]
                }
            };

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
            .top_k(&user_prompt, top_k, &setting_openai.setting_value)
            .await
            .map_err(|e| format!("Similarity search failed: {}", e))?;

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
        debug!("Additional IDs: {:?}", additional_ids);

        let mut all_ids_set = HashSet::new();
        all_ids_set.extend(similar_ids);
        all_ids_set.extend(additional_ids);

        let mut context = String::new();

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
                context.push_str(&format!(
                    "Document ID: {}\nContent:\n{}\n\n",
                    document_id, text
                ));
            }
        }

        if context.is_empty() {
            context.push_str("No relevant documents found.\n\n");
        }

        info!("Relevant Keywords: {:?}", relevant_keywords);

        let relevance_system_prompt = format!( "The user's prompt is: {}\n\n. You are an intelligent and logical personal assistant. Your task is to carefully review the content of provided documents and output solely a maximum of four numerical IDs of the documents that are directly related to the user prompt and are highly likely to help in answering the user's prompt (corresponding to the Document ID at the beginning of each document). If an individual document is not extremely relevant to the user prompt and the user prompt can be successfully answered without that document, do not include it in the list of returned documents.

        Examples of relevant and irrelevant documents in different business scenarios:
        If a document is virtually identical to another one, just include one of them in the list of returned documents.
        
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

        let relevance_request_body = ClaudeRequest {
            model: ANTRHOPIC_MODEL.to_string(),
            max_tokens: 100,
            messages: vec![Message {
                role: "user".to_string(),
                content: context,
            }],
            system: relevance_system_prompt,
            stream: false,
        };

        let relevance_response = client
            .post(ANTHROPIC_URL)
            .header("Content-Type", "application/json")
            .header("x-api-key", &setting.setting_value)
            .header("anthropic-version", "2023-06-01")
            .header("Connection", "keep-alive")  // Added keep-alive header
            .json(&relevance_request_body)
            .send()
            .await
            .map_err(|e| format!("Relevance filtering request failed: {}", e))?;

        debug!("Relevance filtering response: {:?}", relevance_response);

        if relevance_response.status().is_success() {
            let relevance_result: ClaudeResponse = relevance_response
                .json()
                .await
                .map_err(|e| format!("Failed to parse relevance filtering response: {}", e))?;

            info!(
                "Relevance filtering token usage - Input: {}, Output: {}",
                relevance_result.usage.input_tokens, relevance_result.usage.output_tokens
            );

            let relevant_document_ids: Vec<i64> = relevance_result
                .content
                .first()
                .map(|content| {
                    let text = &content.text;
                    let numbers: Vec<i64> = text
                        .split(|c: char| !c.is_numeric())
                        .filter_map(|s| s.parse().ok())
                        .collect();
                    numbers
                })
                .unwrap_or_default();

            debug!("Relevant document IDs: {:?}", relevant_document_ids);

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
        } else {
            let error_message = relevance_response
                .text()
                .await
                .map_err(|e| format!("Failed to read error message: {}", e))?;
            info!(
                "Error from Claude API during relevance filtering: {}",
                error_message
            );
            return Err(format!(
                "Error from Claude API during relevance filtering: {}",
                error_message
            ));
        }
    }

    let conversation_history_content = conversation_history
        .iter()
        .rev()
        .skip(1)
        .rev()
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

    let system_prompt = format!("You are Heelix chat app that is powered by Anthropic LLM. Heelix chat is developed by Heelix Technologies. Only identify yourself as such. Provide answer in markdown format. The following documents were retrieved from the user's device and may help in answering the prompt. Review them carefully to decide if they are relevant, if they are - using them to answer the query, but if they are not relevant to query, ignore them completely when responding, respond as if they were not there without mentioning having received them at all.{}\n\n
Attached is the conversation history for context only. When answering, only give a single assistant response, do not also continue the conversation with a user answer.):
{}\n\n", filtered_context, conversation_history_content);

    debug!("Sending final response generation request to Claude API...");
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

    let request_body = ClaudeRequest {
        model: ANTRHOPIC_MAIN_MODEL.to_string(),
        max_tokens: 2500,
        messages: vec![Message {
            role: "user".to_string(),
            content: user_message,
        }],
        system: system_prompt,
        stream: true,
    };

    let mut attempt = 0;
    let max_retries = 3;
    let mut delay = Duration::from_secs(1);

    loop {
        let response = client
            .post(ANTHROPIC_URL)
            .header("Content-Type", "application/json")
            .header("x-api-key", &setting.setting_value)
            .header("anthropic-version", "2023-06-01")
            .header("Connection", "keep-alive")
            .json(&request_body)
            .send()
            .await;

        match response {
            Ok(resp) => {
                return handle_success_response(resp, app_handle, window_titles.clone()).await;
            }
            Err(e) => {
                if attempt < max_retries {
                    attempt += 1;
                    error!(
                        "Request to Claude API failed: {}. Retrying... (Attempt {}/{})",
                        e, attempt, max_retries
                    );
                    tokio::time::sleep(delay).await;
                    delay *= 2;  // Exponential backoff
                } else {
                    let error_message =
                        "Apologies, Claude API appears to be down right now - please try again later or switch to OpenAI for the time being";
                    error!("Request failed after {} attempts: {}", max_retries, e);
                    app_handle
                        .get_window("main")
                        .expect("Failed to get main window")
                        .emit("llm_response", error_message.to_string())
                        .map_err(|emit_err| {
                            format!("Failed to emit error message: {}", emit_err)
                        })?;
                    return Err(error_message.to_string());
                }
            }
        }
    }
}

async fn handle_success_response(
    response: Response,
    app_handle: AppHandle,
    window_titles: Vec<String>,
) -> Result<(), String> {
    if response.status().is_success() {
        let mut stream = response.bytes_stream();
        let mut completion = String::new();
        let mut input_tokens = 0;
        let mut output_tokens = 0;
        let mut buffer: Vec<u8> = Vec::new();  // Explicitly specify Vec<u8> for byte storage

        while let Some(chunk) = stream.next().await {
            let chunk = chunk.map_err(|e| format!("Failed to read chunk: {}", e))?;
            let text = String::from_utf8_lossy(&chunk);

            for line in text.lines() {
                if !line.starts_with("data: ") {
                    continue;
                }
                
                let data = line[6..].trim();
                
                // Skip empty data lines
                if data.is_empty() {
                    continue;
                }

                // Handle ping events - these keep the connection alive
                if data == "{\"type\": \"ping\"}" {
                    debug!("Received ping event");
                    continue;
                }

                // Parse the event data
                let json_data: serde_json::Value = match serde_json::from_str(data) {
                    Ok(data) => data,
                    Err(e) => {
                        error!("Failed to parse event data: {}", e);
                        continue;
                    }
                };

                // Handle error events
                if let Some("error") = json_data["type"].as_str() {
                    if let Some(error) = json_data["error"].as_object() {
                        let error_type = error["type"].as_str().unwrap_or("unknown");
                        let error_message = error["message"].as_str().unwrap_or("Unknown error");
                        
                        error!("Received error event: {} - {}", error_type, error_message);
                        
                        match error_type {
                            "overloaded_error" => {
                                return Err("Service is currently overloaded. Please try again later.".to_string());
                            }
                            _ => {
                                return Err(format!("Stream error: {}", error_message));
                            }
                        }
                    }
                }

                // Handle different event types
                match json_data["type"].as_str() {
                    Some("message_start") => {
                        if let Some(usage) = json_data["message"]["usage"].as_object() {
                            input_tokens = usage["input_tokens"].as_u64().unwrap_or(0) as u32;
                            output_tokens = usage["output_tokens"].as_u64().unwrap_or(0) as u32;
                        }
                    }
                    Some("content_block_delta") => {
                        if let Some(delta) = json_data["delta"]["text"].as_str() {
                            completion.push_str(delta);
                            
                            // Emit updates to frontend more frequently
                            app_handle
                                .get_window("main")
                                .expect("Failed to get main window")
                                .emit("llm_response", completion.clone())
                                .map_err(|e| format!("Failed to emit response: {}", e))?;
                        }
                    }
                    Some("message_delta") => {
                        if let Some(usage) = json_data["usage"].as_object() {
                            output_tokens = usage["output_tokens"].as_u64().unwrap_or(0) as u32;
                        }
                    }
                    Some("message_stop") => {
                        // Final emission of window titles and completion
                        app_handle
                            .get_window("main")
                            .expect("Failed to get main window")
                            .emit(
                                "window_titles",
                                serde_json::to_string(&window_titles).unwrap(),
                            )
                            .map_err(|e| format!("Failed to emit window titles: {}", e))?;

                        app_handle
                            .get_window("main")
                            .expect("Failed to get main window")
                            .emit("output_tokens", output_tokens)
                            .map_err(|e| format!("Failed to emit output tokens: {}", e))?;
                    }
                    _ => {} // Ignore unknown event types
                }
            }
        }

        info!(
            "Final response token usage - Input: {}, Output: {}",
            input_tokens, output_tokens
        );
        info!("Result from Claude: {}", completion);
        Ok(())
    } else {
        let error_message = response
            .text()
            .await
            .map_err(|e| format!("Failed to read error message: {}", e))?;
        info!("Error from Claude API: {}", error_message);
        Err(format!("Error from Claude API: {}", error_message))
    }
}

#[tauri::command]
pub async fn name_conversation(
    app_handle: tauri::AppHandle,
    user_input: String,
) -> Result<String, String> {
    let setting =
        app_handle.db(|db| get_setting(db, "api_key_claude").expect("Failed on api_key_claude"));

    // Use the same client configuration for consistency
    let client = Client::builder()
        .timeout(Duration::from_secs(180))
        .tcp_keepalive(Duration::from_secs(60))
        .pool_idle_timeout(Duration::from_secs(90))
        .pool_max_idle_per_host(2)
        .build()
        .map_err(|e| format!("Failed to create client: {}", e))?;

    let system_prompt = format!(
        "Name the conversation based on the user input. Use a total of 18 characters or less, without quotation marks. Use proper English, don't skip spaces between words. You only need to answer with the name. The following is the user input: \n\n{}\n\n.:",
        user_input
    );
    let request_body = ClaudeRequest {
        model: ANTRHOPIC_MODEL_CHEAP.to_string(),
        max_tokens: 20,
        messages: vec![Message {
            role: "user".to_string(),
            content: "Please generate a concise name for the conversation based on the user input."
                .to_string(),
        }],
        system: system_prompt,
        stream: false,
    };

    let response = client
        .post(ANTHROPIC_URL)
        .header("Content-Type", "application/json")
        .header("x-api-key", &setting.setting_value)
        .header("anthropic-version", "2023-06-01")
        .header("Connection", "keep-alive")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if response.status().is_success() {
        let response_body: ClaudeResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;
        let generated_name = response_body.content[0].text.trim().to_string();
        Ok(generated_name)
    } else {
        let error_message = response
            .text()
            .await
            .map_err(|e| format!("Failed to read error message: {}", e))?;
        Err(format!("Error from Claude API: {}", error_message))
    }
}

pub async fn identify_relevant_keywords(
    prompt: &str,
    api_key: &str,
) -> Result<Vec<String>, String> {
    let client = Client::builder()
        .timeout(Duration::from_secs(180))
        .tcp_keepalive(Duration::from_secs(60))
        .pool_idle_timeout(Duration::from_secs(90))
        .pool_max_idle_per_host(2)
        .build()
        .map_err(|e| format!("Failed to create client: {}", e))?;

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

    let request_body = ClaudeRequest {
        model: ANTRHOPIC_MODEL_CHEAP.to_string(),
        max_tokens: 150,
        messages: vec![Message {
            role: "user".to_string(),
            content: user_prompt,
        }],
        system: system_prompt.to_string(),
        stream: false,
    };

    let mut attempt = 0;
    let max_retries = 1;
    let mut delay = Duration::from_secs(1);

    loop {
        let response = client
            .post(ANTHROPIC_URL)
            .header("Content-Type", "application/json")
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .header("Connection", "keep-alive")
            .json(&request_body)
            .send()
            .await;

        match response {
            Ok(res) => {
                if res.status().is_success() {
                    let result: ClaudeResponse = res.json().await.map_err(|e| {
                        format!("Failed to parse keyword identification response: {}", e)
                    })?;

                    info!(
                        "Keyword identification token usage - Input: {}, Output: {}",
                        result.usage.input_tokens, result.usage.output_tokens
                    );

                    let keywords: Vec<String> = result
                        .content
                        .first()
                        .map(|content| serde_json::from_str(&content.text).unwrap_or_default())
                        .unwrap_or_default();

                    info!("Identified keywords: {:?}", keywords);
                    return Ok(keywords);
                } else if res.status() == 529 && attempt < max_retries {
                    error!(
                        "Received 529 Too Many Requests response. Retrying after delay... (Attempt {}/{})",
                        attempt + 1,
                        max_retries
                    );
                    tokio::time::sleep(delay).await;
                    attempt += 1;
                    delay *= 2;
                } else {
                    let error_message = res
                        .text()
                        .await
                        .map_err(|e| format!("Failed to read error message: {}", e))?;
                    return Err(format!("Error from Claude API: {}", error_message));
                }
            }
            Err(e) => {
                error!("Request failed: {}", e);
                if attempt < max_retries {
                    error!(
                        "Retrying request due to error... (Attempt {}/{})",
                        attempt + 1,
                        max_retries
                    );
                    tokio::time::sleep(delay).await;
                    attempt += 1;
                    delay *= 2;
                } else {
                    return Err("Apologies, Claude API appears to be down right now - please try again later or switch to OpenAI for the time being".to_string());
                }
            }
        }
    }
}