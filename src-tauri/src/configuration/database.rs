use std::error::Error;
use std::fmt;
use std::fs;
use std::sync::Arc;

use diesel::sqlite::SqliteConnection;
use diesel::Connection;
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use log::info;
use tauri::AppHandle;
use tokio::sync::Mutex;

use crate::engine::similarity_search_engine::{SimilaritySearch, SyncSimilaritySearch};
use crate::HNSW;

pub type SyncVectorDatabase = Arc<Mutex<Option<SimilaritySearch>>>;

const MIGRATIONS: EmbeddedMigrations = embed_migrations!();

pub fn initialize_database(
    app_handle: &AppHandle,
) -> Result<rusqlite::Connection, Box<dyn std::error::Error>> {
    let app_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .expect("The app data directory should exist.");
    fs::create_dir_all(&app_dir).expect("The app data directory should be created.");
    let sqlite_path = app_dir.join("heelixchat.sqlite");
    info!("SQLITE_PATH: {}", sqlite_path.display());
    let db = rusqlite::Connection::open(sqlite_path.clone())?;
    let user_pragma = db.prepare("PRAGMA user_version")?;
    drop(user_pragma);
    let mut connection_diesel =
        SqliteConnection::establish(sqlite_path.display().to_string().as_str())
            .unwrap_or_else(|_| panic!("Error connecting to {}", "database"));
    connection_diesel
        .run_pending_migrations(MIGRATIONS)
        .unwrap();
    Ok(db)
}

pub async fn drop_database_handle() {
    let mut db = HNSW.lock().await;
    *db = None;
}

pub async fn get_vector_db(
    app_handle: &AppHandle,
) -> Result<SyncSimilaritySearch, Box<dyn std::error::Error>> {
    info!("Getting HNSW instance");
    let mut db = HNSW.lock().await;
    if let Some(_) = db.as_ref() {
        info!("Retrieving existing instance of HNSW");
        Ok(HNSW.clone())
    } else {
        info!("Initializing new instance of HNSW");
        let hnsw = initialize_vector_database(app_handle)?;
        *db = Some(hnsw);
        Ok(HNSW.clone())
    }
}

fn initialize_vector_database<'a>(
    app_handle: &AppHandle,
) -> Result<SimilaritySearch, Box<dyn std::error::Error>> {
    let app_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .expect("The app data directory should exist.");
    let hnsw_db_path = app_dir.join("hnsw");
    let collection_name = "activity_vectors";
    let hnsw = SimilaritySearch::open(hnsw_db_path.to_str().unwrap(), collection_name)?;
    Ok(hnsw)
}
