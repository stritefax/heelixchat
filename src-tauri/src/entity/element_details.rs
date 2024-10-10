use serde::{Deserialize, Serialize};


#[derive(Debug, Deserialize, Serialize)]
pub struct ElementDetails {
    pub name: String,
    pub ctrl_typ: String,
    pub bounding_rect: String,
    pub value: String,
    pub text: String,
    pub childrens: Vec<ElementDetails>,
}

impl ElementDetails {
    pub fn clean_elements_tree(&mut self) {
        for child in &mut self.childrens {
            child.clean_elements_tree();
        }
        self.childrens.retain(|x| !x.text.is_empty() || !x.value.is_empty() || !x.childrens.is_empty());
    }
}
