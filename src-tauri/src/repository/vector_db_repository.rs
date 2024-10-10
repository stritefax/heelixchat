use std::error::Error;
use std::fmt;
use crate::repository::settings_repository::{get_setting};
use async_openai::{types::CreateEmbeddingRequestArgs, Client, config::OpenAIConfig};

const API_KEY_OPENAI: &str = "";
// Correct async function for computing vector embeddings
pub async fn compute_vector_embedding(text: &str) -> Result<Vec<f32>, Box<dyn Error>> {
    let config = OpenAIConfig::new()
    .with_api_key(API_KEY_OPENAI);

    let client = Client::with_config(config);
    let request = CreateEmbeddingRequestArgs::default()
        .model("text-embedding-3-small")
        .input([text])
        .build()?;
    let response = client.embeddings().create(request).await?;
    Ok(response.data[0].embedding.clone())
}
