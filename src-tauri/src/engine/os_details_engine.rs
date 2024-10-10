use log::info;
use sysinfo::System;

pub fn get_os_and_version() -> String {
    let mut system = System::new_all();
    system.refresh_all();
    let os_version = System::long_os_version().unwrap_or("Unknown OS".to_string());
    info!("OS Version: {}", os_version);
    return os_version;
}
