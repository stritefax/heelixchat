use rusqlite_from_row::FromRow;
use serde_derive::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, FromRow, Clone)]
pub struct Settings {
    pub isDevMode: bool,
    pub useTrelloPoc: bool,
    pub interval: String,
    pub autoStart: bool,
    pub apiChoice: String,
    pub apiKey: String,
}