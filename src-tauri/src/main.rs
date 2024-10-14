// Prevents additional console window on Windows in release!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use std::sync::Arc;

use lazy_static::lazy_static;
use log::info;
use rusqlite::Connection;
use serde_derive::Serialize;
use tauri::utils::config::AppUrl;
use tauri::SystemTray;
use tauri::{AppHandle, Manager, State, SystemTrayEvent, WindowUrl};
use tauri::{CustomMenuItem, SystemTrayMenu};
use tauri_plugin_log::LogTarget;
use tokio::sync::Mutex;

use configuration::settings::Settings;

use crate::bootstrap::{fix_path_env, prerequisites, setup_directories};
use crate::configuration::database;
use crate::configuration::database::drop_database_handle;
use crate::configuration::state::{AppState, ServiceAccess};
use crate::engine::chat_engine::{name_conversation, send_prompt_to_llm};
use crate::engine::chat_engine_openai::send_prompt_to_openai;
use crate::engine::clean_up_engine::clean_up;
use crate::engine::monitoring_engine;
use crate::engine::similarity_search_engine::SyncSimilaritySearch;
use crate::entity::activity_item::ActivityItem;
use crate::entity::chat_item::{Chat, StoredMessage};
use crate::entity::permission::Permission;
use crate::entity::setting::Setting;
use crate::permissions::permission_engine::init_permissions;
use crate::repository::activity_log_repository;
use crate::repository::chat_db_repository;
use crate::repository::permissions_repository::{get_permissions, update_permission};
use crate::repository::settings_repository::{get_setting, get_settings, insert_or_update_setting};
use tauri_plugin_autostart::MacosLauncher;

mod bootstrap;
mod configuration;
mod engine;
mod entity;
mod monitoring;
pub mod permissions;
mod repository;
pub mod window_details_collector;

#[derive(Clone, Serialize)]
struct Payload {
    data: bool,
}

#[cfg(debug_assertions)]
const USE_LOCALHOST_SERVER: bool = false;
#[cfg(not(debug_assertions))]
const USE_LOCALHOST_SERVER: bool = true;

lazy_static! {
    static ref HNSW: SyncSimilaritySearch = Arc::new(Mutex::new(None));
}

//#[cfg(any(target_os = "macos"))]
//static ACCESSIBILITY_PERMISSIONS_GRANTED: AtomicBool = AtomicBool::new(false);

#[tokio::main]
async fn main() {
    let port = 5173;
    let mut builder = tauri::Builder::default().plugin(tauri_plugin_oauth::init());

    fix_path_env::fix_all_vars().expect("Failed to load env");
    let tray = build_system_tray();

    let mut context = tauri::generate_context!();

    let url = format!("http://localhost:{}", port).parse().unwrap();
    let window_url = WindowUrl::External(url);

    if USE_LOCALHOST_SERVER == true {
        context.config_mut().build.dist_dir = AppUrl::Url(window_url.clone());
        context.config_mut().build.dev_path = AppUrl::Url(window_url.clone());
        builder = builder.plugin(tauri_plugin_localhost::Builder::new(port).build());
    }

    builder
        .plugin(
            tauri_plugin_log::Builder::default()
                .targets([LogTarget::Stdout, LogTarget::Webview])
                .build(),
        )
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .plugin(tauri_plugin_oauth::init())
        .plugin(tauri_plugin_positioner::init())
        .system_tray(tray)
        .on_system_tray_event(|app, event| match event {
            // Ensure the window is toggled when the tray icon is clicked
            SystemTrayEvent::LeftClick { .. } => {
                let window = app.get_window("main").unwrap();
                if window.is_visible().unwrap() {
                    window.hide().unwrap();
                } else {
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "start_stop_recording" => {
                    let wrapped_window = app.get_window("main");
                    if let Some(window) = wrapped_window {
                        window
                            .emit("toggle_recording", Payload { data: true })
                            .unwrap();
                    }
                }
                "quit" => {
                    std::process::exit(0);
                }
                _ => {}
            },
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            refresh_activity_log,
            update_settings,
            get_latest_settings,
            send_prompt_to_llm,
            send_prompt_to_openai,
            record_single_activity,
            name_conversation,
            create_chat,
            get_all_chats,
            create_message,
            get_messages_by_chat_id,
            update_chat_name,
            update_app_permissions,
            get_app_permissions,
            delete_chat,
            prompt_for_accessibility_permissions,
            get_activity_history,
            delete_activity,
            get_activity_full_text_by_id,
        ])
        .manage(AppState {
            db: Default::default(),
        })
        .on_window_event(|event| match event.event() {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                api.prevent_close();
                event.window().hide().unwrap(); // Hide window on close
            }
            _ => {}
        })
        .setup(move |app| {
            let args: Vec<String> = env::args().collect();
            let should_start_minimized = args.contains(&"--minimized".to_string());

            let window = app.get_window("main").unwrap();

            if should_start_minimized {
                window.hide().unwrap();
            } else {
                window.show().unwrap();
            }

            let app_handle = app.handle();
            let _ = setup_directories::setup_dirs(
                app_handle
                    .path_resolver()
                    .app_data_dir()
                    .unwrap()
                    .to_str()
                    .unwrap(),
            );
            prerequisites::check_and_install_prerequisites(
                app_handle
                    .path_resolver()
                    .resource_dir()
                    .unwrap()
                    .to_str()
                    .unwrap(),
            );
            clean_up(app_handle.path_resolver().app_data_dir().unwrap());
            setup_keypress_listener(&app_handle);
            init_app_permissions(app_handle);
            Ok(())
        })
        .run(context)
        .expect("error while running tauri application");
    drop_database_handle().await;
}

fn build_system_tray() -> SystemTray {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let start_stop_recording =
        CustomMenuItem::new("start_stop_recording".to_string(), "Start/Stop");
    let tray_menu = SystemTrayMenu::new()
        .add_item(start_stop_recording)
        .add_item(quit);
    SystemTray::new().with_menu(tray_menu)
}

fn setup_keypress_listener(app_handle: &AppHandle) {
    let app_state: State<AppState> = app_handle.state();

    let db: Connection =
        database::initialize_database(&app_handle).expect("Database initialization failed!");
    *app_state.db.lock().unwrap() = Some(db);
}

#[tauri::command]
fn refresh_activity_log(app_handle: AppHandle, _action: &str) -> Result<Vec<ActivityItem>, ()> {
    return Ok(get_latest_activity_log(app_handle.clone()));
}

#[tauri::command]
fn get_latest_settings(app_handle: AppHandle) -> Result<Vec<Setting>, ()> {
    let settings = app_handle.db(|db| get_settings(db).unwrap());
    return Ok(settings);
}

#[tauri::command]
async fn update_settings(app_handle: AppHandle, settings: Settings) {
    info!("update_settings: {:?}", settings);
    app_handle.db(|db| {
        insert_or_update_setting(
            db,
            Setting {
                setting_key: String::from("interval"),
                setting_value: format!("{}", settings.interval),
            },
        )
        .unwrap();
        insert_or_update_setting(
            db,
            Setting {
                setting_key: String::from("is_dev_mode"),
                setting_value: format!("{}", settings.is_dev_mode),
            },
        )
        .unwrap();
        insert_or_update_setting(
            db,
            Setting {
                setting_key: String::from("auto_start"),
                setting_value: format!("{}", settings.auto_start),
            },
        )
        .unwrap();
        insert_or_update_setting(
            db,
            Setting {
                setting_key: String::from("api_choice"),
                setting_value: format!("{}", settings.api_choice),
            },
        )
        .unwrap();
        insert_or_update_setting(
            db,
            Setting {
                setting_key: String::from("api_key_claude"),
                setting_value: format!("{}", settings.api_key_claude),
            },
        )
        .unwrap();
        insert_or_update_setting(
            db,
            Setting {
                setting_key: String::from("api_key_open_ai"),
                setting_value: format!("{}", settings.api_key_open_ai),
            },
        )
        .unwrap();
    });
}

#[tauri::command]
fn init_app_permissions(app_handle: AppHandle) {
    init_permissions(app_handle);
}

#[tauri::command]
fn update_app_permissions(app_handle: AppHandle, app_path: String, allow: bool) {
    app_handle.db(|database| {
        update_permission(database, app_path, allow).expect("Failed to update permission");
    })
}

#[tauri::command]
fn get_app_permissions(app_handle: AppHandle) -> Result<Vec<Permission>, ()> {
    let permissions = app_handle.db(|database| get_permissions(database).unwrap());
    return Ok(permissions);
}

#[tauri::command]
async fn record_single_activity(
    app_handle: AppHandle,
    user: &str,
) -> Result<Vec<ActivityItem>, ()> {
    if user.is_empty() {
        return Ok(vec![]);
    }

    let mut activity_item = monitoring_engine::start_a_monitoring_cycle(
        app_handle.clone(),
        app_handle
            .path_resolver()
            .app_data_dir()
            .unwrap()
            .to_str()
            .unwrap(),
    )
    .await;
    activity_item.user_id = String::from(user);
    app_handle.db(|db| {
        let setting = get_setting(db, "interval").expect("Failed on interval");
        activity_item.interval_length = setting.setting_value.parse().unwrap_or(20);
    });
    info!("USER_ID: {}", activity_item.user_id);
    app_handle
        .db(|db| activity_log_repository::save_activity_item(&activity_item.clone(), db))
        .expect("Failed to save activity log");
    let last_insert_rowid = app_handle
        .db(|db| activity_log_repository::save_activity_full_text(&activity_item.clone(), db))
        .expect("Failed to save activity full text");

    let settings =   app_handle.db(|db| get_setting(db, "api_key_open_ai").expect("Failed on api_key_open_ai"));
    match last_insert_rowid {
        Some(rowid) => {
            info!("Getting ready to add record to OasysDB, row={}", rowid);
            let mut oasys_db = database::get_vector_db(&app_handle)
                .await
                .expect("Database initialization failed!");
            activity_log_repository::save_activity_full_text_into_vector_db(
                &mut oasys_db,
                &activity_item,
                rowid,
                &settings.setting_value
            )
            .await
            .unwrap_or(());
        }
        None => info!("No last insert rowid available"),
    }

    return Ok(get_latest_activity_log(app_handle.clone()));
}

fn get_latest_activity_log(app_handle: AppHandle) -> Vec<ActivityItem> {
    return app_handle
        .db(|db| activity_log_repository::get_all_activity_logs(db))
        .unwrap();
}

#[tauri::command]
fn create_chat(app_handle: AppHandle, name: &str) -> Result<i64, String> {
    app_handle
        .db(|db| chat_db_repository::create_chat(db, name))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_all_chats(app_handle: AppHandle) -> Result<Vec<Chat>, String> {
    app_handle
        .db(|db| chat_db_repository::get_all_chats(db))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn create_message(
    app_handle: AppHandle,
    chat_id: i64,
    role: &str,
    content: &str,
) -> Result<i64, String> {
    app_handle
        .db(|db| chat_db_repository::create_message(db, chat_id, role, content))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_messages_by_chat_id(
    app_handle: AppHandle,
    chat_id: i64,
) -> Result<Vec<StoredMessage>, String> {
    app_handle
        .db(|db| chat_db_repository::get_messages_by_chat_id(db, chat_id))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn update_chat_name(app_handle: AppHandle, chat_id: i64, name: &str) -> Result<bool, String> {
    app_handle
        .db(|db| chat_db_repository::update_chat(db, chat_id, name))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_chat(app_handle: AppHandle, chat_id: i64) -> Result<bool, String> {
    app_handle
        .db(|db| chat_db_repository::delete_chat(db, chat_id))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_activity_history(
    app_handle: AppHandle,
    offset: usize,
    limit: usize,
) -> Result<Vec<(i64, String, String)>, String> {
    app_handle
        .db(|db: &Connection| {
            crate::activity_log_repository::get_activity_history(db, offset, limit)
        })
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_activity(app_handle: AppHandle, id: i64) -> Result<bool, String> {
    app_handle
        .db(|db: &Connection| crate::activity_log_repository::delete_activity(db, id))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_activity_full_text_by_id(
    app_handle: tauri::AppHandle,
    id: i64,
) -> Result<Option<(String, String)>, String> {
    app_handle
        .db(|db| crate::activity_log_repository::get_activity_full_text_by_id(db, id, None))
        .map_err(|e| e.to_string())
}

#[cfg(target_os = "macos")]
#[tauri::command]
fn prompt_for_accessibility_permissions() {
    unsafe {
        crate::window_details_collector::macos::macos_accessibility_engine::prompt_for_accessibility_permissions();
    }
}

#[cfg(not(target_os = "macos"))]
#[tauri::command]
fn prompt_for_accessibility_permissions() {
    // No-op for non-macOS platforms
}
