#![cfg(any(target_os = "windows"))]
#![allow(unused)]
use heelix::window_details_collector::windows::v2::screen_reader_flag::get_system_screen_reader_flag;
use heelix::window_details_collector::windows::v2::screen_reader_flag::toggle_on_screen_reader_property;
use heelix::window_details_collector::windows::v2::windows_accessibility_engine_v2::observe;
use heelix::window_details_collector::windows::v2::{
    catch_event_system_alert::win_hook, uiautomation_print::print_all_elements,
};
use heelix::window_details_collector::windows::windows_accessibility_engine::by_pid;
use std::thread;
use std::thread::sleep;
use std::time::Duration;

use active_win_pos_rs::get_active_window;
use heelix::window_details_collector::windows::window_details_collector_windows::get_element_tree_by_process_id;
// use heelix::permissions::permissions_engine_windows::init_permissions;


#[cfg(test)]
#[test]
fn test_windows_screen_reader() {
    toggle_on_screen_reader_property();
    loop {
        println!(
            "Test: {:#?}",
            get_element_tree_by_process_id(
                format!("{}", get_active_window().unwrap().process_id).as_str()
            )
        );
        sleep(Duration::from_secs(5));
    }
}

// #[cfg(test)]
// #[test]
// fn test_windows_app_list() {
//     let apps = init_permissions();
//     println!("Apps: {:?}", apps);
// }


