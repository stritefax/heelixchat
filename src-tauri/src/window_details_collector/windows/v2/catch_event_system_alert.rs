#![cfg(any(target_os = "windows"))]

use std::ptr::null_mut;
use windows::Win32::Foundation::{BOOL, FALSE, HMODULE, HWND, LPARAM, S_FALSE, TRUE, WPARAM};
use windows::Win32::System::Ole::GetActiveObject;
use windows::Win32::UI::Accessibility::{
    AccessibleObjectFromEvent, LresultFromObject, SetWinEventHook, HWINEVENTHOOK,
};
use windows::Win32::UI::WindowsAndMessaging::{
    DispatchMessageW, EnumWindows, GetMessageW, GetWindow, GetWindowThreadProcessId,
    IsWindowVisible, SendMessageTimeoutW, SendMessageW, TranslateMessage, EVENT_SYSTEM_ALERT,
    GW_OWNER, MSG, SMTO_ABORTIFHUNG, WINEVENT_OUTOFCONTEXT, WM_GETOBJECT,
};
use windows_core::{Error, VARIANT};

use active_win_pos_rs::ActiveWindow;
use log::info;

unsafe extern "system" fn event_proc(
    _h_winevent_hook: HWINEVENTHOOK,
    event: u32,
    hwnd: HWND,
    id_object: i32,
    id_child: i32,
    _id_event_thread: u32,
    _dwms_event_time: u32,
) {
    if event == EVENT_SYSTEM_ALERT {
        println!(
            "EVENT_SYSTEM_ALERT received. id_object: {}, id_child: {}",
            id_object, id_child
        );
        // let active_window = get_active_window();
        // let pid = active_window.process_id.to_string().parse::<u32>().unwrap();
        // OBJID_CLIENT
        scan_windows(hwnd, id_object, id_child);

        // UnhookWinEvent(_h_winevent_hook);
    }
}

// HWINEVENTHOOK hook = SetWinEventHook(EVENT_SYSTEM_ALERT, EVENT_SYSTEM_ALERT,NULL, WinEventProc, 0, 0, WINEVENT_OUTOFCONTEXT)

pub fn win_hook() {
    unsafe {
        let hook = SetWinEventHook(
            EVENT_SYSTEM_ALERT,
            EVENT_SYSTEM_ALERT,
            HMODULE(0),
            Some(event_proc),
            0,
            0,
            WINEVENT_OUTOFCONTEXT,
        );

        if hook.is_invalid() {
            println!("Failed to set hook");
            return;
        }

        println!("win_hook");

        let mut msg = MSG::default();
        while GetMessageW(&mut msg, HWND(0), 0, 0).as_bool() {
            println!("GetMessageW: {:?}", msg);
            TranslateMessage(&msg).unwrap();
            DispatchMessageW(&msg);
            break;
        }
    }
}

pub fn from_event(h_wnd: HWND, id: i32, child_id: i32) {
    info!("HWND: {:?}", h_wnd);
    let acc = unsafe {
        let mut p_acc = std::mem::zeroed();
        let mut var = std::mem::zeroed();
        const OBJID_CLIENT: u32 = 0xFFFFFFFC;

        if let Err(e) =
            AccessibleObjectFromEvent(h_wnd, id as u32,  child_id as u32, &mut p_acc, &mut var)
        {
            println!("Error at AccessibleObjectFromEvent: {:?}", e);
        }
        match p_acc {
            None => {
                println!(
                    "Error: {:?}",
                    Error::new(
                        S_FALSE,
                        &format!(
                            "Can't obtain the accessible object, the h_wnd is {}.",
                            h_wnd.0
                        ),
                    )
                );
            }
            Some(r) => {
                let res = (r, i32::try_from(&var).unwrap_or(0));
                let result = res.0.accFocus().unwrap();
            }
        }
    };
    // println!("{:?}, {:?}, {:?}", acc.0, acc.1, acc.1);
}
unsafe extern "system" fn enum_window(window: HWND, lparam: LPARAM) -> BOOL {
    let handle_info = &mut *(lparam.0 as *mut ProcWindow);
    let mut win_proc_id: u32 = 0;
    GetWindowThreadProcessId(window, Some(&mut win_proc_id));
    if handle_info.pid == win_proc_id && is_main_window(window) {
        handle_info.add(window);
    }
    TRUE
}

unsafe fn is_main_window(window: HWND) -> bool {
    return GetWindow(window, GW_OWNER) == HWND(0 as isize) && IsWindowVisible(window) != FALSE;
}

struct ProcWindow {
    pid: u32,
    vec_hwnd: Vec<HWND>,
}

impl ProcWindow {
    fn new(pid: u32) -> ProcWindow {
        ProcWindow {
            pid: pid,
            vec_hwnd: Vec::new(),
        }
    }

    fn add(&mut self, hwnd: HWND) {
        self.vec_hwnd.push(hwnd);
    }
}

fn scan_windows(mut hwnd: HWND, id_object: i32, id_child: i32) {
    unsafe {
        // let result = null_mut();

        if (id_object == 1) {
            let send_result = SendMessageW(
                hwnd,
                WM_GETOBJECT,
                WPARAM(0),
                LPARAM(1),
            );

            println!("send_result: {:?}", send_result);
            from_event(hwnd, id_object, id_child);
        }
    }
}

pub fn get_active_window() -> ActiveWindow {
    match active_win_pos_rs::get_active_window() {
        Ok(active_window) => active_window,
        Err(()) => {
            info!("error occurred while getting the active window");
            ActiveWindow::default()
        }
    }
}
