use serde_derive::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Project {
    pub id: i64,
    pub name: String,
    pub activities: Vec<i64>,
    pub activity_ids: Vec<Option<i64>>,
    pub activity_names: Vec<String>,
    pub created_at: String,
}