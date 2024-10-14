use rusqlite_from_row::FromRow;
use serde_derive::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, FromRow, Clone)]
pub struct Settings {
    pub is_dev_mode: bool,
    pub interval: String,
    pub auto_start: bool,
    pub api_choice: String,
    pub api_key_claude: String,
    pub api_key_open_ai: String,
}