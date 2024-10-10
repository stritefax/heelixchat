#![cfg(any(target_os = "macos"))]

use std::thread::sleep;
use std::time::Duration;
use crate::window_details_collector::macos::macos_accessibility_engine::{by_pid, observe_by_pid};

pub fn get_element_tree_by_process_id(process_id: &str) -> (String, String) {
    observe_by_pid(process_id);
    let mut retry_count = 0;
    loop {
        let result = by_pid(process_id);
        if result.len() >= 200 || retry_count >= 3 {
            return (result.to_string(), "/".to_string());
        }
        retry_count += 1;
        sleep(Duration::new(2, 0));
    }
}