use std::ffi::OsString;
use std::fs;
use std::path::PathBuf;
use log::info;

pub fn setup_dirs(add_data_dir_string: &str) -> Result<(), std::io::Error> {
    info!("app_data: {add_data_dir_string}");
    let mut app_data_dir = OsString::from(add_data_dir_string);
    app_data_dir.push("/task-mining-resources");
    let home_dir_path = PathBuf::from(app_data_dir);

    if !home_dir_path.exists() {
        fs::create_dir(&home_dir_path)?;
    }
    let screenshots_dir = home_dir_path.join("screenshots");
    if !screenshots_dir.exists() {
        fs::create_dir(&screenshots_dir)?;
    }
    info!("Directories created successfully.");
    Ok(())
}
