#![cfg(any(target_os = "linux"))]

pub fn get_element_tree_by_process_id(process_id: &str) -> (String, String) {
    return ("/".to_string(), "/".to_string());
}