#![cfg(any(target_os = "windows"))]

use winapi::um::winuser::{SystemParametersInfoW, SPI_SETSCREENREADER, SPI_GETSCREENREADER, SPIF_UPDATEINIFILE, SPIF_SENDCHANGE};
use winapi::shared::minwindef::BOOL;

pub fn toggle_on_screen_reader_property() {
    unsafe {
        let flag = 1;
        SystemParametersInfoW(
            SPI_SETSCREENREADER,
            flag as u32,
            std::ptr::null_mut(),
            SPIF_UPDATEINIFILE | SPIF_SENDCHANGE,
        );
    }
}

pub fn get_system_screen_reader_flag() -> bool {
    unsafe {
        let mut flag: BOOL = 0;
        let result = SystemParametersInfoW(
            SPI_GETSCREENREADER,
            0,
            &mut flag as *mut BOOL as *mut std::ffi::c_void,
            0,
        );
        result != 0 && flag != 0
    }
}