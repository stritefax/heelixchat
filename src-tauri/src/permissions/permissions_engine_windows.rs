#![cfg(any(target_os = "windows"))]

use tauri::AppHandle;

use winreg::enums::*;
use winreg::RegKey;
use winreg::HKEY;

use crate::entity::permission::Permission;
use crate::configuration::state::ServiceAccess;
use crate::repository::permissions_repository::insert_permission;

#[derive(Debug)]
pub struct App {
    pub app_name: String,
    pub icon_path: Option<String>,
    pub app_path: Option<String>,
}

pub fn init_permissions(handle: AppHandle) {
    let hklm_current_version_key: String = "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall".to_string();
    let hkcu_current_version_key: String = "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall".to_string();
    let hklm_wow64_current_version_key: String = "Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall".to_string();

    let mut installed_apps: Vec<App> = vec![];
    let installed_apps_hklm: Vec<App> = get_installed_apps(HKEY_LOCAL_MACHINE, hklm_current_version_key.clone());
    let installed_apps_hkcu: Vec<App> = get_installed_apps(HKEY_CURRENT_USER, hkcu_current_version_key.clone());
    let installed_apps_hklm_wow64: Vec<App> = get_installed_apps(HKEY_LOCAL_MACHINE, hklm_wow64_current_version_key.clone());
    installed_apps.extend(installed_apps_hklm);
    installed_apps.extend(installed_apps_hkcu);
    installed_apps.extend(installed_apps_hklm_wow64);

    let permissions: Vec<Permission> = map_apps_to_permissions(installed_apps);
    handle.db(|database| {
        for permission in permissions {
            let result = insert_permission(database, permission);
            result.expect("Failed to insert permission");
        }
    })
}
pub fn get_installed_apps(hkey: HKEY, key: String) -> Vec<App> {
    let hklm = RegKey::predef(hkey);
    let uninstall = hklm
        .open_subkey_with_flags(
            key,
            KEY_READ,
        )
        .unwrap();

    let mut apps = Vec::new();

    for app in uninstall.enum_keys().map(|x| x.unwrap()) {
        let app_key = uninstall.open_subkey_with_flags(&app, KEY_READ).unwrap();
        let mut app = App {
            app_name: "".to_string(),
            icon_path: Some("".to_string()),
            app_path: Some("".to_string()),
        };
        if let Ok(display_name) = app_key.get_value::<String, &str>("DisplayName") {
            app.app_name = display_name;
        }

        if let Ok(display_icon) = app_key.get_value::<String, &str>("DisplayIcon") {
            app.icon_path = Some(display_icon.clone());
            app.app_path = Some(display_icon.clone());
        }
        if app.app_name != "" {
            apps.push(app);
        }
    }

    return apps;
}

fn map_apps_to_permissions(apps: Vec<App>) -> Vec<Permission> {
    apps.into_iter()
        .map(|app| Permission {
            app_path: app
                .app_path
                .map_or_else(|| "".to_string(), |p| p.to_string()),
            app_name: app.app_name,
            icon_path: app
                .icon_path
                .map_or_else(|| "".to_string(), |p| p.to_string()),
            allow: true, // Set default value for `allow`
        })
        .collect()
}
