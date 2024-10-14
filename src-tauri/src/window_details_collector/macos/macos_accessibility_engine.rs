#![cfg(any(target_os = "macos"))]

use std::collections::VecDeque;
use std::ffi::c_void;
use std::ptr;

use crate::entity::macos_element_details::ElementDetails;
use accessibility::AXAttribute;
use accessibility::AXUIElement;
use accessibility_sys::{
    kAXAnnouncementRequestedNotification, kAXCreatedNotification, kAXFocusedApplicationAttribute,
    kAXFocusedUIElementChangedNotification, kAXTrustedCheckOptionPrompt,
    kAXUIElementDestroyedNotification, kAXValueChangedNotification, AXIsProcessTrustedWithOptions,
    AXObserverAddNotification, AXObserverCreateWithInfoCallback, AXObserverGetRunLoopSource,
    AXObserverRef, AXUIElementCopyAttributeValue, AXUIElementCreateApplication, AXUIElementRef,
    AXUIElementSetAttributeValue, AXUIElementSetMessagingTimeout,
};
use core_foundation::array::CFArray;
use core_foundation::base::{Boolean, TCFType};
use core_foundation::boolean::CFBoolean;
use core_foundation::dictionary::{CFDictionary, CFDictionaryRef};
use core_foundation::runloop::{
    kCFRunLoopDefaultMode, CFRunLoopAddSource, CFRunLoopGetCurrent, CFRunLoopRunInMode,
};
use core_foundation::string::{CFString, CFStringRef};
use log::{debug, info};

pub fn by_pid(pid: &str) -> String {
    //unsafe { prompt_for_accessibility_permissions() };
    let pid = pid.parse::<i32>().unwrap();
    let application = AXUIElement::application(pid);
    let all_window_element_trees = scan_windows(&application);
    return all_window_element_trees;
}

pub fn observe_by_pid(pid: &str) -> () {
    let pid = pid.parse::<i32>().unwrap();

    match setup_notifications(pid) {
        Ok(()) => debug!("Setup successful."),
        Err(e) => debug!("Error setting up notifications: {}", e),
    }

    unsafe {
        CFRunLoopRunInMode(kCFRunLoopDefaultMode, 1.0, Boolean::from(false));
    }
}

fn scan_windows(application: &AXUIElement) -> String {
    let mut contents = String::new();

    let windows: CFArray<AXUIElement> = application
        .attribute(&AXAttribute::windows())
        .unwrap_or(CFArray::from_CFTypes(&[]));

    for window in windows.iter() {
        let elem_contents = walk_elements(&window);
        contents.push_str(&elem_contents);
    }

    contents
}

fn walk_elements(element: &AXUIElement) -> String {
    let mut contents = String::new();
    let mut stack = VecDeque::new();
    stack.push_back(element.clone());

    while let Some(current_element) = stack.pop_front() {
        let element_details = get_element_properties(&current_element);
        if !element_details.value.is_empty() {
            contents.push_str(&element_details.value);
            contents.push(' ');
        }

        let children: CFArray<AXUIElement> = current_element
            .attribute(&AXAttribute::children())
            .unwrap_or_else(|_| CFArray::from_CFTypes(&[]));

        for child in children.iter() {
            stack.push_back(child.clone());
        }
    }
    contents
}

fn get_element_properties(element: &AXUIElement) -> ElementDetails {
    let mut value = String::new();

    if let Ok(val) = element.attribute(&AXAttribute::value()) {
        let value_str = format!("{:?}", val);
        if value_str.contains("Private") || value_str.contains("Incognito") {
            value = "Private Browsing".to_string();
        } else if value_str.contains("contents = ") {
            let start_index = value_str.find("contents = ").unwrap() + 12;
            let end_index = value_str.len() - 3;
            value = value_str[start_index..end_index].to_string();
            value = value.replace("\\\"", "");
        }
    }

    ElementDetails { value }
}

fn setup_notifications(pid: i32) -> Result<(), String> {
    unsafe {
        //prompt_for_accessibility_permissions();
        let mut observer_ref: AXObserverRef = ptr::null_mut();
        let result = AXObserverCreateWithInfoCallback(pid, observer_callback, &mut observer_ref);
        if result != 0 {
            return Err(format!("Failed to create observer: {result}"));
        }

        let application = AXUIElementCreateApplication(pid);
        configure_application(application);
        add_notification_types_to_observer(observer_ref, application);

        let run_loop_source = AXObserverGetRunLoopSource(observer_ref);
        if run_loop_source.is_null() {
            return Err("Failed to get run loop source".to_string());
        }
        CFRunLoopAddSource(
            CFRunLoopGetCurrent(),
            run_loop_source,
            kCFRunLoopDefaultMode,
        );
    }
    Ok(())
}

unsafe fn configure_application(application: AXUIElementRef) {
    AXUIElementSetMessagingTimeout(application, 5.0);
    AXUIElementCopyAttributeValue(
        application,
        CFString::new(kAXFocusedApplicationAttribute).as_concrete_TypeRef(),
        ptr::null_mut(),
    );
    let _ = AXUIElementSetAttributeValue(
        application,
        CFString::new("AXInspectorEnabled").as_concrete_TypeRef(),
        CFBoolean::true_value().as_CFTypeRef(),
    );
    let _ = AXUIElementSetAttributeValue(
        application,
        CFString::new("AXEnhancedUserInterface").as_concrete_TypeRef(),
        CFBoolean::true_value().as_CFTypeRef(),
    );
    let _ = AXUIElementSetAttributeValue(
        application,
        CFString::new("AXManualAccessibility").as_concrete_TypeRef(),
        CFBoolean::true_value().as_CFTypeRef(),
    );
}

unsafe fn add_notification_types_to_observer(
    observer_ref: AXObserverRef,
    application: AXUIElementRef,
) {
    let element_did_announce = CFString::new(kAXAnnouncementRequestedNotification);
    let element_did_disappear = CFString::new(kAXUIElementDestroyedNotification);
    let element_did_get_focus = CFString::new(kAXFocusedUIElementChangedNotification);
    let element_did_appear = CFString::new(kAXCreatedNotification);
    let value_changed_notification = CFString::new(kAXValueChangedNotification);

    let _ = AXObserverAddNotification(
        observer_ref,
        application,
        element_did_disappear.as_concrete_TypeRef(),
        ptr::null_mut(),
    );
    let _ = AXObserverAddNotification(
        observer_ref,
        application,
        element_did_get_focus.as_concrete_TypeRef(),
        ptr::null_mut(),
    );
    let _ = AXObserverAddNotification(
        observer_ref,
        application,
        element_did_announce.as_concrete_TypeRef(),
        ptr::null_mut(),
    );
    let _ = AXObserverAddNotification(
        observer_ref,
        application,
        element_did_appear.as_concrete_TypeRef(),
        ptr::null_mut(),
    );
    let _ = AXObserverAddNotification(
        observer_ref,
        application,
        value_changed_notification.as_concrete_TypeRef(),
        ptr::null_mut(),
    );
}

extern "C" fn observer_callback(
    _observer: AXObserverRef,
    element_ref: AXUIElementRef,
    _notification_ref: CFStringRef,
    _info_ref: CFDictionaryRef,
    _refcon: *mut c_void,
) {
    unsafe {
        AXUIElementSetMessagingTimeout(element_ref, 5.0);
        AXUIElementCopyAttributeValue(
            element_ref,
            CFString::new(kAXFocusedApplicationAttribute).as_concrete_TypeRef(),
            ptr::null_mut(),
        );
    }
}

pub unsafe fn prompt_for_accessibility_permissions() {
    let options = CFDictionary::from_CFType_pairs(&[(
        cf_string_ref_to_cf_string_safe(kAXTrustedCheckOptionPrompt),
        CFBoolean::true_value(),
    )]);

    let trusted = unsafe { AXIsProcessTrustedWithOptions(options.as_concrete_TypeRef()) };

    if !trusted {
        info!("User did not grant accessibility permissions.");
    } else {
        info!("Accessibility permissions granted.");
    }
}

fn cf_string_ref_to_cf_string_safe(cf_string_ref: CFStringRef) -> CFString {
    if cf_string_ref.is_null() {
        CFString::new("")
    } else {
        unsafe { CFString::wrap_under_create_rule(cf_string_ref) }
    }
}
