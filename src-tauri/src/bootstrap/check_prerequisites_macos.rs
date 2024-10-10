#![cfg(any(target_os = "macos"))]

use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::io::{self, Write};
use std::os::unix::fs::{PermissionsExt};
use log::info;

pub fn check_and_install_prerequisites(resources_data_dir: &str) {
    let tesseract_path = PathBuf::from("/opt/homebrew/bin/tesseract");

    info!("TESSERACT_IS_INSTALLED: {}", tesseract_path.exists());
    if !tesseract_path.exists() {
        let install_tesseract_script_path = format!("{}/resources/scripts/install-macos.sh",
                                                    resources_data_dir);
        fs::set_permissions(&install_tesseract_script_path, fs::Permissions::from_mode(0o770))
            .unwrap();

        let output = Command::new(&install_tesseract_script_path)
            .output()
            .expect("failed to execute process");
        info!("status: {}", output.status);
        io::stdout().write_all(&output.stdout).unwrap();
        io::stderr().write_all(&output.stderr).unwrap();
    }
}