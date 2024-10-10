use serde::{Deserialize, Serialize};
use serde_json::Result;
use std::collections::{HashMap, HashSet};
use log::info;
use serde::de::Error;
use crate::entity::element_details::ElementDetails;

// Define a struct to represent each action indicator
#[derive(Serialize, Deserialize)]
struct ActionIndicator {
    keywords: Vec<String>,
    ctrl_typ: String,
    sections: Vec<String>,
}

pub fn action_detector(element_details: ElementDetails) -> Result<HashSet<String>> {
    // Simulate loading JSON data into the `element_details` variable
    //let data = &format!("{:#?}", element_details_tree);
    //let element_details: Vec<Element> = serde_json::from_str(data)?;

    // Assuming you have a JSON string for `action_indicators`
    let action_indicators_json = r#"
        {
            "Write Code": {"keywords": ["class", "void", "public", "private", "def", "function"], "ctrl_typ": "edit", "sections": ["Text Editor"]},
            "Debug Code": {"keywords": ["Debug.WriteLine", "Console.WriteLine", "breakpoint", "watch"], "ctrl_typ": "edit", "sections": ["Output", "Immediate Window"]},
            "Compile/Build": {"keywords": ["Build started", "Build succeeded", "Build failed"], "ctrl_typ": "edit", "sections": ["Output"]},
            "Deploy Applications": {"keywords": ["Deploy started", "Deploy succeeded", "Publish"], "ctrl_typ": "edit", "sections": ["Output"]},
            "Version Control": {"keywords": ["git commit", "git push", "pull request", "merge conflict"], "ctrl_typ": "edit", "sections": ["Team Explorer"]},
            "Manage Projects": {"keywords": [".sln", ".csproj", "Add Reference", "NuGet"], "ctrl_typ": "tree view", "sections": ["Solution Explorer"]},
            "Database Development": {"keywords": ["CREATE TABLE", "SELECT * FROM", "SQL Server Object Explorer"], "ctrl_typ": "edit", "sections": ["SQL Server Object Explorer", "Text Editor"]},
            "Web Development": {"keywords": ["HTML", "<div>", "CSS", "JavaScript"], "ctrl_typ": "edit", "sections": ["Text Editor"]},
            "Mobile Development": {"keywords": ["Xamarin", "iOS SDK", "Android SDK"], "ctrl_typ": "edit", "sections": ["Text Editor"]},
            "Cloud Integration": {"keywords": ["Azure", "AWS", "cloud service", "deploy"], "ctrl_typ": "edit", "sections": ["Cloud Explorer", "Server Explorer"]},
            "Extend IDE": {"keywords": ["extension", "VSIX", "Visual Studio Marketplace"], "ctrl_typ": "edit", "sections": ["Extensions and Updates"]},
            "Collaborate": {"keywords": ["Live Share", "code review", "comment"], "ctrl_typ": "edit", "sections": ["Team Explorer", "Live Share"]},
            "Test Code": {"keywords": ["unit test", "test case", "[Test]", "Assert."], "ctrl_typ": "edit", "sections": ["Test Explorer", "Text Editor"]},
            "Profile Performance": {"keywords": ["Diagnostic Tools", "performance", "CPU usage", "memory usage"], "ctrl_typ": "edit", "sections": ["Diagnostic Tools"]},
            "Design UI": {"keywords": ["XAML", "UI designer", "layout", "control"], "ctrl_typ": "edit", "sections": ["XAML Designer", "Text Editor"]}
        }
    "#;
    let action_indicators: std::collections::HashMap<String, ActionIndicator> =
        serde_json::from_str(action_indicators_json)?;

    /*
    // Example: Populating the action indicators with change_type
    action_indicators.insert("Write Code", ActionIndicator {
        keywords: vec!["class", "void", "public", "private", "def", "function"],
        ctrl_typ: "edit",
        sections: vec!["Text Editor"],
        change_type: "added", // Indicates new code being written
    });
     */

    // Analyze the structured output
    let detected_actions = analyze_structured_output(&element_details, &action_indicators);

    info!("Detected actions: {:?}", detected_actions);
    Ok(detected_actions)
}

fn find_actions_in_element(element: &ElementDetails, parent_name: &str, action_indicators: &std::collections::HashMap<String, ActionIndicator>) -> Vec<String> {
    let mut detected_actions = Vec::new();
    let name = &element.name;
    let ctrl_typ = &element.ctrl_typ;
    let text = &element.text;
    let childrens = &element.childrens;

    for (action, indicators) in action_indicators {
        if *ctrl_typ == indicators.ctrl_typ && indicators.sections.iter().any(|section| parent_name.contains(section)) {
            if indicators.keywords.iter().any(|keyword| text.contains(keyword)) {
                detected_actions.push(action.clone());
            }
        }
    }

    for child in childrens {
        detected_actions.extend(find_actions_in_element(child, if name.is_empty() { parent_name } else { name }, action_indicators));
    }

    detected_actions
}

fn analyze_structured_output(structured_output: &ElementDetails, action_indicators: &std::collections::HashMap<String, ActionIndicator>) -> HashSet<String> {
    let mut detected_actions = HashSet::new();
    let actions = find_actions_in_element(structured_output, "", action_indicators);
    for action in actions {
        detected_actions.insert(action);
    }
    detected_actions
}
