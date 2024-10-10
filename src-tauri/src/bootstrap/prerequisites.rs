#[cfg(any(target_os = "windows"))]
use crate::bootstrap::{check_prerequisites_windows};

#[cfg(any(target_os = "macos"))]
use crate::bootstrap::{check_prerequisites_macos};

#[cfg(any(target_os = "linux"))]
use crate::bootstrap::{check_prerequisites_linux};

pub fn check_and_install_prerequisites(resources_data_dir: &str) {

    #[cfg(any(target_os = "macos"))]
    check_prerequisites_macos::check_and_install_prerequisites(resources_data_dir);

    #[cfg(any(target_os = "windows"))]
    check_prerequisites_windows::check_and_install_prerequisites(resources_data_dir);

    #[cfg(any(target_os = "linux"))]
    check_prerequisites_linux::check_and_install_prerequisites(resources_data_dir);
}