#![cfg(any(target_os = "windows"))]
use std::{thread::sleep, time::Duration};

use crate::window_details_collector::windows::windows_accessibility_engine::by_pid;

pub fn get_element_tree_by_process_id(process_id: &str) -> (String, String) {
    let mut retry_count = 0;
    loop {
        let result = by_pid(process_id);
        if result.len() >= 200 || retry_count >= 3 {
            return (by_pid(&process_id.to_string()), "".to_string());
        }
        retry_count += 1;
        sleep(Duration::new(2, 0));
    }
}