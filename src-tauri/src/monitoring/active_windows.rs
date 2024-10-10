use active_win_pos_rs::ActiveWindow;
use log::info;

pub fn get_active_window() -> ActiveWindow {
    match active_win_pos_rs::get_active_window() {
        Ok(active_window) => {
            active_window
        },
        Err(()) => {
            info!("error occurred while getting the active window");
            ActiveWindow::default()
        }
    }
}

