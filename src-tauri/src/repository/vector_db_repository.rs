use std::error::Error;
use async_openai::{types::CreateEmbeddingRequestArgs, Client, config::OpenAIConfig};

// Correct async function for computing vector embeddings
pub async fn compute_vector_embedding(text: &str, api_key: &str) -> Result<Vec<f32>, Box<dyn Error>> {
    let config: OpenAIConfig = OpenAIConfig::new()
    .with_api_key(api_key);

    let client = Client::with_config(config);
    let request = CreateEmbeddingRequestArgs::default()
        .model("text-embedding-3-small")
        .input([text])
        .build()?;
    let response = client.embeddings().create(request).await?;
    Ok(response.data[0].embedding.clone())
}
