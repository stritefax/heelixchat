use std::fs::create_dir_all;
use std::sync::Arc;

use anyhow::{anyhow, bail, Error, Result};
use hnsw_rs::prelude::*;
use log::{debug, error, info};
use tokio::sync::mpsc::{Receiver, Sender};
use tokio::sync::Mutex;

use crate::repository::vector_db_repository::compute_vector_embedding;

pub const TOPK: usize = 10;
pub const MAX_NB_CONNECTION: usize = TOPK;
pub const MAX_ELEMENTS: usize = 100_000;
pub const MAX_LAYERS: usize = 24;
pub const EF_CONSTRUCTION: usize = 400;

pub const MAX_INFLIGHT_COMMANDS: usize = 100;

fn get_db<'a>() -> Hnsw<'a, f32, DistCosine> {
    Hnsw::new(
        MAX_NB_CONNECTION,
        MAX_ELEMENTS,
        MAX_LAYERS,
        EF_CONSTRUCTION,
        DistCosine,
    )
}

enum HnswCommand {
    Save,
    Add(Vec<f32>, usize),
    Lookup(Vec<f32>, usize, Sender<Result<Vec<(usize, f32)>, Error>>),
    Shutdown,
}

async fn hnsw_thread_worker(
    db_path: &str,
    collection_name: &str,
    mut command_reader: Receiver<HnswCommand>,
) -> Result<()> {
    let mut reloader = HnswIo::new(std::path::Path::new(db_path), collection_name);
    let db_res = reloader.load_hnsw::<f32, DistCosine>();
    let db = match db_res {
        Ok(db) => db,
        Err(_) => get_db(),
    };

    loop {
        let command = command_reader.recv().await.ok_or(anyhow!(
            "Failed to receive command, probably the remote peer is no longer  available"
        ))?;
        match command {
            HnswCommand::Save => {
                let resulting_name = format!("{}_new", collection_name);
                let save_res = db.file_dump(std::path::Path::new(db_path), &resulting_name);
                if let Err(e) = save_res {
                    error!(
                        "Failed to save HNSW index to path={}, collection={}: {}",
                        db_path, collection_name, e
                    );
                    return Err(e.into());
                }
                let actual_resulting_name = save_res.unwrap();

                let saved_data_file_name = format!("{}.hnsw.data", actual_resulting_name);
                let saved_graph_file_name = format!("{}.hnsw.graph", actual_resulting_name);

                let save_data_path = std::path::Path::new(db_path).join(saved_data_file_name);
                let save_graph_path = std::path::Path::new(db_path).join(saved_graph_file_name);

                let new_data_file_name = format!("{}_new.hnsw.data", collection_name);
                let new_graph_file_name = format!("{}_new.hnsw.graph", collection_name);

                let new_data_path = std::path::Path::new(db_path).join(new_data_file_name);
                let new_graph_path = std::path::Path::new(db_path).join(new_graph_file_name);

                std::fs::rename(&save_data_path, &new_data_path)?;
                std::fs::rename(&save_graph_path, &new_graph_path)?;
            }
            HnswCommand::Add(vector, id) => {
                // trace!("Adding vector to HNSW index.");
                db.insert((&vector, id));
            }
            HnswCommand::Lookup(vector, top_k, sender) => {
                let results = db.search(&vector, top_k, MAX_NB_CONNECTION);
                let candidates = results
                    .iter()
                    .map(|result| (result.d_id, result.distance))
                    .collect::<Vec<_>>();
                sender.send(Ok(candidates)).await?;
            }
            HnswCommand::Shutdown => {
                info!("Shutting down HNSW thread worker");
                break;
            }
        }
    }
    Ok(())
}

pub struct SimilaritySearch(
    Option<tokio::task::JoinHandle<()>>,
    Option<Sender<HnswCommand>>,
);

unsafe impl Send for SimilaritySearch {}
unsafe impl Sync for SimilaritySearch {}

impl Drop for SimilaritySearch {
    fn drop(&mut self) {
        info!("Dropping SimilaritySearch instance");
        let thread_handle = self.0.take();
        let sender_channel = self.1.take();
        if let (Some(t_handle), Some(sc)) = (thread_handle, sender_channel) {
            match tokio::runtime::Handle::try_current() {
                Ok(handle) => {
                    handle.spawn(async move {
                        if let Err(e) = sc.send(HnswCommand::Save).await {
                            error!("Failed to send HnswCommand::Save: {}", e);
                        }
                        if let Err(e) = sc.send(HnswCommand::Shutdown).await {
                            error!("Failed to send HnswCommand::Shutdown: {}", e);
                        }
                        if let Err(e) = t_handle.await {
                            error!("Failed to await thread handle: {}", e);
                        }
                    });
                }
                Err(e) => {
                    error!("Failed to get Tokio runtime handle: {}", e);
                }
            }
        }
    }
}

pub type SyncSimilaritySearch = Arc<Mutex<Option<SimilaritySearch>>>;

const IS_TEST: bool = cfg!(test);

const MAX_CHARS: usize = 7900;

async fn get_embedding(text: &str, api_key: &str) -> Result<Vec<f32>> {
    if IS_TEST {
        return Ok(vec![0.0; 512]);
    }

    let truncated_text = if text.len() > MAX_CHARS {
        &text[..MAX_CHARS]
    } else {
        text
    };

    compute_vector_embedding(truncated_text, api_key)
        .await
        .map_err(|e| anyhow!("{}", e))
}

impl SimilaritySearch {
    pub fn open(db_path: &str, collection_name: &str) -> Result<Self> {
        info!(
            "Opening HNSW instance: {}, collection: {}",
            db_path, collection_name
        );
        let dir_path = std::path::Path::new(db_path);

        if !dir_path.exists() {
            create_dir_all(dir_path)?;
        }

        // if exist 'collection_name_new.hnsw.{data, graph}' rename them to 'collection_name.hnsw.{data, graph}'
        let new_data_path = format!("{}_new.hnsw.data", collection_name);
        let new_graph_path = format!("{}_new.hnsw.graph", collection_name);

        let data_path = format!("{}.hnsw.data", collection_name);
        let graph_path = format!("{}.hnsw.graph", collection_name);

        let new_data_path = dir_path.join(new_data_path);
        let new_graph_path = dir_path.join(new_graph_path);

        let data_path = dir_path.join(data_path);
        let graph_path = dir_path.join(graph_path);

        if new_data_path.exists() {
            std::fs::rename(&new_data_path, &data_path)?;
        }

        if new_graph_path.exists() {
            std::fs::rename(&new_graph_path, &graph_path)?;
        }

        let (command_sender, command_receiver) = tokio::sync::mpsc::channel(MAX_INFLIGHT_COMMANDS);
        async fn worker(
            db_path: String,
            collection_name: String,
            command_receiver: Receiver<HnswCommand>,
        ) {
            let res = hnsw_thread_worker(&db_path, &collection_name, command_receiver).await;
            if let Err(e) = res {
                panic!("HNSW thread worker failed: {}", e);
            }
        }

        let db = tokio::spawn(worker(
            db_path.to_string(),
            collection_name.to_string(),
            command_receiver,
        ));

        Ok(SimilaritySearch(Some(db), Some(command_sender)))
    }

    pub async fn sync(&self) -> Result<()> {
        info!("Sending HnswCommand::Save");
        self.1.as_ref().unwrap().send(HnswCommand::Save).await?;
        info!("Waiting for HnswCommand::Save");
        Ok(())
    }

    pub async fn add(&self, id: i64, text: &str, api_key: &str) -> Result<()> {
        let vector_res = get_embedding(text, api_key).await;
        let vector = match vector_res {
            Ok(v) => v,
            Err(e) => {
                error!("Failed to compute vector embedding: {}", e);
                return Err(anyhow!("Failed to compute vector embedding: {}", e));
            }
        };

        match &self.1 {
            Some(sender) => {
                if let Err(e) = sender.send(HnswCommand::Add(vector, id as usize)).await {
                    error!("Failed to send HnswCommand::Add: {}", e);
                    return Err(anyhow!("Failed to send HnswCommand::Add: {}", e));
                }
                Ok(())
            }
            None => {
                error!("Command sender is None");
                Err(anyhow!("Command sender is None"))
            }
        }
    }

    pub async fn top_k(
        &self,
        query_text: &str,
        top_k: usize,
        api_key: &str,
    ) -> Result<Vec<(usize, f32)>> {
        info!(
            "Performing similarity search in HNSW Index: Query={}",
            query_text
        );
        let query_vector_res = get_embedding(query_text, api_key).await;
        let query_vector = match query_vector_res {
            Ok(v) => v,
            Err(e) => {
                error!("Failed to compute query vector embedding: {}", e);
                bail!("Failed to compute query vector embedding: {}", e);
            }
        };
        debug!("Computed query vector embedding: {:?}", query_vector);

        if top_k > MAX_NB_CONNECTION {
            bail!("top_k exceeds MAX_NB_CONNECTION");
        }

        let (sender, mut receiver) = tokio::sync::mpsc::channel(1);
        self.1
            .as_ref()
            .unwrap()
            .send(HnswCommand::Lookup(query_vector, top_k, sender))
            .await?;
        let candidates_res = receiver.recv().await.ok_or(anyhow!(
            "Failed to receive candidates, probably the remote peer is no longer available"
        ))?;

        let candidates = candidates_res?;

        info!(
            "Similarity search completed. Retrieved {} similar documents",
            candidates.len()
        );
        debug!("Similar document IDs with distances: {:?}", candidates);

        Ok(candidates)
    }
}

#[cfg(test)]
mod tests {
    use anyhow::Result;

    use super::SimilaritySearch;

    #[tokio::test]
    async fn test_similarity_search() -> Result<()> {
        let temp_dir = tempfile::tempdir()?;
        let db_path = temp_dir.path().join("test.db");
        let collection_name = "test_collection";
        let mut index = SimilaritySearch::open(db_path.to_str().unwrap(), collection_name)?;
        index.add(1, "hello world", "").await?;
        let candidates = index.top_k("hello world", 1, "").await?;
        assert_eq!(candidates, vec![(1, 0.0)]);
        index.close().await?;
        drop(index);
        let index = SimilaritySearch::open(db_path.to_str().unwrap(), collection_name)?;
        let candidates = index.top_k("hello world", 1, "").await?;
        assert_eq!(candidates, vec![(1, 0.0)]);
        Ok(())
    }
}
