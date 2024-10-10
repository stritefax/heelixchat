#![cfg(any(target_os = "windows"))]

use std::collections::VecDeque;

use windows::{
    core::*,
    Win32::System::Com::*,
    Win32::UI::WindowsAndMessaging::*,
    Win32::{Foundation::*, UI::Accessibility::*},
};
use crate::entity::macos_element_details::ElementDetails;

pub fn by_pid(pid: &str) -> String {
    let pid = pid.parse::<u32>().unwrap();
    let handle_info = ProcWindow::new(pid);
    let all_window_element_trees = scan_windows(handle_info);
    return all_window_element_trees;
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

fn scan_windows(mut handle_info: ProcWindow) -> String {
    unsafe {
        let _ = EnumWindows(
            Some(enum_window),
            LPARAM(&mut handle_info as *mut ProcWindow as isize),
        );
        let mut contents = String::new();
        for hwnd in &handle_info.vec_hwnd {
            let automation = create_automation().unwrap();
            let element = get_automation_element(&automation, *hwnd).unwrap();
            let elem_contents = walk_elements(&automation, &element);
            contents.push_str(&elem_contents);
        }
        return contents;
    }
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

fn create_automation() -> Result<IUIAutomation> {
    unsafe {
        let co_init_result = CoInitializeEx(None, COINIT_MULTITHREADED);
        let automation: IUIAutomation = CoCreateInstance(&CUIAutomation, None, CLSCTX_ALL)?;
        Ok(automation)
    }
}

unsafe fn get_automation_element(
    automation: &IUIAutomation,
    hwnd: HWND,
) -> Result<IUIAutomationElement> {
    let element: IUIAutomationElement = automation.ElementFromHandle(hwnd)?;
    let node = get_top_level_window(&automation, &element)?;
    Ok(node)
}

fn get_top_level_window(
    automation: &IUIAutomation,
    element: &IUIAutomationElement,
) -> Result<IUIAutomationElement> {
    unsafe {
        let walker: IUIAutomationTreeWalker = automation.ControlViewWalker()?;
        let mut node: IUIAutomationElement = element.clone();
        let desktop = automation.GetRootElement().unwrap();

        loop {
            let element_parent = walker.GetParentElement(&node).ok();
            if automation
                .CompareElements(element_parent.as_ref(), &desktop)
                .is_ok()
            {
                break;
            } else {
                if element_parent == None {
                    break;
                }
                node = element_parent.unwrap();
            }
        }

        Ok(node)
    }
}

fn walk_elements(automation: &IUIAutomation, element: &IUIAutomationElement) -> String {
    let mut contents = String::new();
    let mut stack = VecDeque::new();
    stack.push_back(element.clone());

    while let Some(current_element) = stack.pop_front() {
        let element_details = get_element_properties(&current_element);
        if !element_details.value.is_empty() {
            contents.push_str(&element_details.value);
            contents.push(' ');
        }

        unsafe {
            let walker: IUIAutomationTreeWalker = automation.RawViewWalker().unwrap();
            if let Ok(child_element) = walker.GetFirstChildElement(&current_element) {
                stack.push_back(child_element.clone());
                let mut sibling = child_element.clone();
                while let Ok(next_sibling) = walker.GetNextSiblingElement(&sibling) {
                    stack.push_back(next_sibling.clone());
                    sibling = next_sibling;
                }
            }
        }
    }

    contents
}

fn get_element_properties(element: &IUIAutomationElement) -> ElementDetails {
    unsafe {
        let pattern_obj = element.GetCurrentPattern(UIA_ValuePatternId);
        let mut value: String = String::new();
        if pattern_obj.is_ok() {
            let value_pattern: IUIAutomationValuePattern = pattern_obj.unwrap().cast().unwrap();
            value = value_pattern.CurrentValue().unwrap().to_string();
        }

        let pattern_obj = element.GetCurrentPattern(UIA_TextPatternId);
        if pattern_obj.is_ok() {
            let value_pattern: IUIAutomationTextPattern = pattern_obj.unwrap().cast().unwrap();
            value = value_pattern
                .DocumentRange()
                .unwrap()
                .GetText(-1)
                .unwrap_or(Default::default())
                .to_string();
        }

        ElementDetails { value: value }
    }
}
