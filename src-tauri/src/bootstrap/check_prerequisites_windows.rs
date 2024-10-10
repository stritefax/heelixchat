#![cfg(any(target_os = "windows"))]

use std::path::PathBuf;
use std::process::Command;
use log::info;
use crate::bootstrap::path_env_util;

pub fn check_and_install_prerequisites(resources_data_dir: &str) {
    install_tesseract(resources_data_dir);
    path_env_util::append_to_path(r"C:\Program Files\Tesseract-OCR\");
}

fn install_tesseract(resources_data_dir: &str) {
    let tesseract_path = PathBuf::from("C:\\Program Files\\Tesseract-OCR\\tesseract.exe");

    info!("TESSERACT_IS_INSTALLED: {}", tesseract_path.exists());
    if !tesseract_path.exists() {
        info!("{}\\resources\\tesseract-ocr-w64-setup-5.3.1.20230401.exe", resources_data_dir);
        let _ = Command::new("cmd.exe")
            .args(["/C", format!("{}\\resources\\tesseract-ocr-w64-setup-5.3.1.20230401.exe", &resources_data_dir[4..]).as_str()])
            .spawn()
            .expect("failed to execute process");
    }
}