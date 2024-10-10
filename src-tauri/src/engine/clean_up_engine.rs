use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

pub fn clean_up(screenshots_dir: PathBuf) {
    clean_up_screenshots_before_today(screenshots_dir);
}

fn clean_up_screenshots_before_today(app_data_dir: PathBuf) {
    let screenshots_dir = app_data_dir.join("task-mining-resources").join("screenshots");
    if screenshots_dir.exists() {
        let current_timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("Failed to get current timestamp")
            .as_secs();
        let one_day_in_seconds = 24 * 60 * 60;
        let yesterday_timestamp = current_timestamp - one_day_in_seconds;

        for entry in fs::read_dir(&screenshots_dir).expect("Failed to read screenshots directory") {
            if let Ok(entry) = entry {
                let path = entry.path();
                if path.is_file() {
                    if let Ok(metadata) = fs::metadata(&path) {
                        if let Ok(created_time) = metadata.created() {
                            let created_timestamp = created_time
                                .duration_since(UNIX_EPOCH)
                                .expect("Failed to get file creation timestamp")
                                .as_secs();

                            if created_timestamp < yesterday_timestamp {
                                println!("Delete {:?}", path);
                                if let Err(err) = fs::remove_file(&path) {
                                    eprintln!("Failed to remove file {:?}: {}", path, err);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}