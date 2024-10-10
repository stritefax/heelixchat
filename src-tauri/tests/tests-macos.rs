#![cfg(any(target_os = "macos"))]
#![allow(unused)]

use std::thread;
use std::thread::sleep;
use std::time::Duration;
use active_win_pos_rs::get_active_window;
use heelix::window_details_collector::macos::macos_accessibility_engine::observe_by_pid;
use heelix::window_details_collector::macos::window_details_collector_macos::get_element_tree_by_process_id;

#[cfg(test)]
#[test]
fn test_macos_screen_reader() {
    let process_id = format!("{}", get_active_window().unwrap().process_id);
    let content = observe_by_pid(process_id.as_str());
    get_element_tree_by_process_id(process_id.as_str());
}
