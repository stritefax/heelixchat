use tauri::AppHandle;
use crate::permissions::*;

pub fn init_permissions(handle: AppHandle) {
    #[cfg(any(target_os = "macos"))]
    permissions_engine_macos::init_permissions(handle);

    #[cfg(any(target_os = "windows"))]
    permissions_engine_windows::init_permissions(handle);

    #[cfg(any(target_os = "linux"))]
    permissions_engine_linux::init_permissions(handle);
}