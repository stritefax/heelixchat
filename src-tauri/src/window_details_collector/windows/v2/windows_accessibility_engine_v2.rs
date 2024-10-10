#![cfg(any(target_os = "windows"))]
use winapi::um::winuser::{EVENT_SYSTEM_ALERT, OBJID_ALERT};
use windows::{
    core::*,
    Win32::{
        Foundation::HWND,
        System::Com::*,
        UI::{
            Accessibility::*,
            WindowsAndMessaging::{DispatchMessageA,DispatchMessageW,GetMessageW, GetMessageA, TranslateMessage, MSG},
        },
    },
};
use crate::entity::macos_element_details::ElementDetails;
use std::collections::VecDeque;
use log::info;

// Define the event handler struct
#[implement(IUIAutomationEventHandler)]
struct MyUIAutomationEventHandler {}

impl IUIAutomationEventHandler_Impl for MyUIAutomationEventHandler {
    fn HandleAutomationEvent(
        &self,
        sender: Option<&IUIAutomationElement>,
        eventid: UIA_EVENT_ID,
    ) -> windows_core::Result<()> {
        return self.HandleAutomationEvent(sender, eventid);
    }
}

// Implement the IUnknown interface for the event handler
impl MyUIAutomationEventHandler {
    pub fn new() -> Self {
        Self {}
    }

    pub fn HandleAutomationEvent(
        &self,
        sender: Option<&IUIAutomationElement>,
        event_id: UIA_EVENT_ID,
    ) -> Result<()> {
        info!(
            "Event received: sender={:?}, event_id={:?}",
            sender, event_id
        );
        unsafe {
            let ui_automation: IUIAutomation =
                CoCreateInstance(&CUIAutomation8, None, CLSCTX_INPROC_SERVER).unwrap();
        }
        Ok(())
    }
}

pub fn observe() -> Result<()> {
    unsafe { CoInitializeEx(Some(std::ptr::null_mut()), COINIT_APARTMENTTHREADED).unwrap() };

    unsafe {
        let ui_automation: IUIAutomation =
            CoCreateInstance(&CUIAutomation8, None, CLSCTX_INPROC_SERVER).unwrap();

        let handler = MyUIAutomationEventHandler::new();
        let handler: IUIAutomationEventHandler = handler.into();

        ui_automation
            .AddAutomationEventHandler(
                UIA_SystemAlertEventId,
                &ui_automation.GetFocusedElement().unwrap(),
                TreeScope_Subtree,
                None,
                &handler,
            )
            .unwrap();

        /* ui_automation.AddFocusChangedEventHandler(
            None, // Add any property condition if necessary
            &handler,
        ).unwrap(); */

    }

    // Run a message loop to keep the application alive
    let mut msg = MSG::default();
    unsafe {
        let mut msg = MSG::default();
        while GetMessageW(&mut msg, HWND(0), 0, 0).as_bool() {
            TranslateMessage(&msg);
            DispatchMessageW(&msg);
        }
    }

    // Uninitialize COM library
    unsafe { CoUninitialize() };

    Ok(())
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
