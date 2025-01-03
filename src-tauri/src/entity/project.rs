use serde_derive::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Project {
    pub id: i64,
    pub name: String,
    pub created_at: String,
    pub activity_ids: Vec<i64>,            // activity IDs from activities database
    pub activities: Vec<i64>,              // Keep original activity IDs
    pub activity_names: Vec<String>,       // Add new vector for document names
}