use chrono::{DateTime, Local};
use screenshots::Screen;
use std::path::Path;
use std::path::PathBuf;
use log::info;

pub fn take_screenshot(screenshots_path: PathBuf, timestamp: DateTime<Local>) {
    let screens = Screen::all().unwrap();

    let primary_screen = screens
        .iter()
        .find(|&&screen| screen.display_info.is_primary == true)
        .expect("No primary screen");

    info!("capturer {primary_screen:?}");

    let image = primary_screen.capture().unwrap();

    image.save(Path::new( format!(
        "{}/{}.png",
        screenshots_path.display(),
        timestamp.format("%Y-%m-%d_%H-%M-%S").to_string(),
    ).as_str()))
        .expect("Failed to save screenshot!");
}
