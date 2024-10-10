#![cfg(any(target_os = "macos"))]

use applications::{App, AppInfo, AppInfoContext};
use tauri::AppHandle;

use crate::configuration::state::ServiceAccess;
use crate::entity::permission::Permission;
use crate::repository::permissions_repository::insert_permission;

fn map_apps_to_permissions(apps: Vec<App>) -> Vec<Permission> {
    apps.into_iter()
        .map(|app| Permission {
            app_path: app
                .app_path_exe
                .map_or_else(|| "".to_string(), |p| p.to_string_lossy().into_owned()),
            app_name: app.name,
            icon_path: app
                .icon_path
                .map_or_else(|| "".to_string(), |p| p.to_string_lossy().into_owned()),
            allow: true, // Set default value for `allow`
        })
        .collect()
}

pub fn init_permissions(handle: AppHandle) {
    let installed_apps: Vec<App> = get_installed_apps();
    let permissions: Vec<Permission> = map_apps_to_permissions(installed_apps);
    handle.db(|database| {
        for permission in permissions {
            let result = insert_permission(database, permission);
            result.expect("Failed to insert permission");
        }
    })
}

pub fn get_installed_apps() -> Vec<App> {
    let mut ctx = AppInfoContext::new();
    ctx.refresh_apps().unwrap();
    let apps = ctx.get_all_apps();

    let filtered_apps: Vec<App> = apps
        .into_iter()
        .filter(|app| {
            !app.app_desktop_path
                .to_str()
                .map_or(false, |path| path.contains("/System/Library"))
        })
        .collect();
    return filtered_apps;
}