use rusqlite_from_row::FromRow;
use serde_derive::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, FromRow, Clone)]
pub struct ActivityItem {
    pub timestamp: String,
    pub user_id: String,
    pub window_title: String,
    pub window_app_name: String,
    pub ocr_text: String,
    pub original_ocr_text: String,
    pub interval_length: u32,
    pub os_details: String,
    pub similarity_percentage_to_previous_ocr_text: String,
    pub full_activity_text: String,
    pub editing_mode: String,
    pub keypress_count: u32,
    pub element_tree_dump: String,
    pub detected_actions: String,
}