use rusqlite_from_row::FromRow;
use serde_derive::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, FromRow, Clone)]
pub struct Permission {
    pub app_path: String,
    pub app_name: String,
    pub icon_path: String,
    pub allow: bool,
}
