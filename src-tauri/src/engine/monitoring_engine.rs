use crate::configuration::state::ServiceAccess;
use crate::engine::combined_text_engine;
use crate::engine::os_details_engine::get_os_and_version;
use crate::engine::text_recognition_engine;
use chrono::Local;
use log::info;
use std::path::Path;
use std::path::PathBuf;
use std::time::Instant;
use strsim::normalized_levenshtein;
use tauri::AppHandle;

use crate::entity::activity_item::ActivityItem;
use crate::monitoring::{active_windows, take_screenshot};
use crate::repository::activity_log_repository::{
    get_empty_activity_item, get_latest_activity_log_item,
    get_latest_activity_log_item_with_same_window,
};
//use crate::repository::keypress_log_repository::{clean_older_keypress_logs, get_count_of_keypress_on_last_interval};
use crate::repository::permissions_repository::get_permission_by_app_name;
use crate::window_details_collector::window_details_collector::get_element_tree_by_window_app_name;

pub async fn start_a_monitoring_cycle(handle: AppHandle, app_data_dir: &str) -> ActivityItem {
    let start = Instant::now();
    info!("A cycle of monitoring started at {:?}!", start);
    let mut active_window = active_windows::get_active_window();
    info!("window_title: {}", active_window.title);
    info!("app_name: {}", active_window.app_name);
    let is_app_allowed = handle
        .db(|db| get_permission_by_app_name(&db, &active_window.app_name).unwrap())
        .allow;
    if !is_app_allowed {
        return get_empty_activity_item();
    }
    let (element_tree_dump, detected_actions): (String, String) =
        get_element_tree_by_window_app_name(&active_window.process_id.to_string());
    let is_editing_mode = active_window.title != "ChatGPT" && active_window.title != "Claude";
    // If the app_name is Safari or Chrome and the window_title is missing, assign the first text up to blank character in element_tree_dump to window_title
    if ((active_window.app_name == "Safari" || active_window.app_name == "Google Chrome")
        && active_window.title.is_empty())
        || (active_window.title == "ChatGPT" || active_window.title == "Claude")
    {
        if let Some(first_text) = element_tree_dump.split_whitespace().next() {
            active_window.title = first_text.to_string();
        }
    } else {
        let first_20_chars = element_tree_dump.chars().take(20).collect::<String>();
        for website in POPULAR_WEBSITES {
            if first_20_chars.contains(website) {
                active_window.app_name = website.to_string();
                break;
            }
        }
    }
    let screenshot_path = PathBuf::from(app_data_dir)
        .join("task-mining-resources")
        .join("screenshots");

    info!("SCREENSHOTS_PATH: {}", screenshot_path.clone().display());
    let timestamp = Local::now();
    take_screenshot::take_screenshot(screenshot_path.clone(), timestamp);

    let mut ocr_text = text_recognition_engine::get_text_from_image(Path::new(
        format!(
            "{}.png",
            screenshot_path
                .clone()
                .join(timestamp.format("%Y-%m-%d_%H-%M-%S").to_string())
                .display()
        )
        .as_str(),
    ));

    let activity_log_item = handle
        .db(|database| {
            let activity_log_item = get_latest_activity_log_item(database);
            return activity_log_item;
        })
        .unwrap();

    //let keypress = handle.db(|database| {
    //    let keypress_count = get_count_of_keypress_on_last_interval(database, timestamp.to_rfc3339());
    //    return keypress_count;
    // }).unwrap();

    // let _ = handle.db(|database| {
    //     let rows_deleted = clean_older_keypress_logs(database, Local::now().to_rfc3339());
    //     return rows_deleted;
    // }).unwrap();

    let recent_activity_item_option = handle
        .db(|database| {
            get_latest_activity_log_item_with_same_window(
                database,
                &active_window.title,
                &active_window.app_name,
            )
        })
        .unwrap();

    let combined_text = if let Some(ref recent_activity_item) = recent_activity_item_option {
        combined_text_engine::merge_texts(&recent_activity_item.full_activity_text, &ocr_text)
    } else {
        ocr_text.clone()
    };
    let combined_text_length = combined_text.len();
    let fraction_of_combined_text = (combined_text_length as f64 * 0.2) as usize; // Using element_tree dump if combined_text is too short

    let full_activity_text = if active_window.app_name == "Heelix Chat" {
        "Heelix monitoring engine".to_string()
    } else if element_tree_dump.len() > fraction_of_combined_text {
        element_tree_dump.clone()
    } else {
        combined_text.clone()
    };
    // Check if the first 100 characters of element_tree_dump contain "Private Browsing" and the app is a browser
    if element_tree_dump
        .chars()
        .take(300)
        .collect::<String>()
        .contains("Private Browsing")
        && (active_window.app_name == "Google Chrome"
            || active_window.app_name == "Safari"
            || active_window.app_name == "Chrome"
            || active_window.app_name == "Firefox")
    {
        return get_empty_activity_item();
    }
    // Adjust ocr_text if the app is PyCharm and element_tree_dump is significantly longer than combined_text
    // Adjust ocr_text based on the app and content
    if active_window.app_name != "Microsoft PowerPoint"
        && active_window.app_name != "Heelix Chat"
        && active_window.app_name != "DataGrip"
    {
        if element_tree_dump.len() > fraction_of_combined_text {
            ocr_text = element_tree_dump.clone(); // Overwrite OCR text with element tree dump
        }
        // Otherwise, keep ocr_text as is
    } else {
        // For PowerPoint, Heelix, and DataGrip, use ocr_text as is
    }
    let score =
        normalized_levenshtein(activity_log_item.ocr_text.as_str(), ocr_text.as_str()) * 100.0;
    // this way we're not comparing the OCR to the element tree. Now something to consider is limit the size of the text passed along to the LLM for analysis for 1000 tokens max, probably enough for classification
    let editing_mode_str = if !is_editing_mode || active_window.app_name == "Heelix Chat" {
        "false".to_string()
    } else if score > 50.0 {
        "true".to_string()
    } else if let Some(ref recent_activity_item) = recent_activity_item_option {
        // Assuming recent_activity_item.editing_mode is a String that represents a boolean value.
        if recent_activity_item.editing_mode == "true" && score > 90.0 {
            "true".to_string()
        } else {
            "false".to_string()
        }
    } else {
        "false".to_string()
    };

    let original_ocr_text = if editing_mode_str == "false" {
        ocr_text.clone()
    } else {
        recent_activity_item_option
            .as_ref()
            .map(|item| item.original_ocr_text.clone())
            .unwrap_or_else(|| ocr_text.clone())
    };

    return ActivityItem {
       // id: activity_log_item.id,
        timestamp: timestamp.to_rfc3339(),
        ocr_text,
        full_activity_text,
        editing_mode: editing_mode_str,
        original_ocr_text,
        window_title: active_window.title,
        window_app_name: active_window.app_name,
        user_id: "".to_string(),
        os_details: get_os_and_version(),
        similarity_percentage_to_previous_ocr_text: format!("{:.1$}", score, 2),
        interval_length: 0,
        keypress_count: 0,
        element_tree_dump,
        detected_actions,
    };
}
const POPULAR_WEBSITES: &[&str] = &[
    "github",
    "stackoverflow",
    "developer.mozilla",
    "medium",
    "dev.to",
    "news.ycombinator",
    "trello",
    "jira",
    "atlassian",
    "analytics.google",
    "ads.google",
    "moz",
    "ahrefs",
    "semrush",
    "hubspot",
    "mailchimp",
    "salesforce",
    "zendesk",
    "intercom",
    "slack",
    "hootsuite",
    "buffer",
    "sproutsocial",
    "buzzsumo",
    "canva",
    "adobe/creative-cloud",
    "adobe/photoshop",
    "adobe/illustrator",
    "adobe/indesign",
    "figma",
    "sketch",
    "invision",
    "zeplin",
    "hotjar",
    "optimizely",
    "crazyegg",
    "unbounce",
    "leadpages",
    "clickfunnels",
];
