#[cfg(any(target_os = "macos"))]
use crate::window_details_collector::macos::window_details_collector_macos;

#[cfg(any(target_os = "linux"))]
use crate::window_details_collector::linux::window_details_collector_linux;

#[cfg(any(target_os = "windows"))]
use crate::window_details_collector::windows::window_details_collector_windows;

pub fn get_element_tree_by_window_app_name(process_id: &str) -> (String, String) {
    #[cfg(any(target_os = "macos"))]
    return window_details_collector_macos::get_element_tree_by_process_id(process_id);

    #[cfg(any(target_os = "windows"))]
    return window_details_collector_windows::get_element_tree_by_process_id(process_id);

    // Not implemented yet
    #[cfg(any(target_os = "linux"))]
    return window_details_collector_linux::get_element_tree_by_process_id("");
}