use std::env;
use log::info;

pub fn append_to_path(path_to_append: &str) {
    if let Some(current_path) = env::var_os("PATH") {
        let new_path = format!("{}:{}", current_path.to_string_lossy(), path_to_append);
        env::set_var("PATH", &new_path);
        info!("Updated PATH: {}", env::var("PATH").unwrap());
    } else {
        info!("Failed to get the current PATH variable");
    }
}







