extern crate dissimilar;

pub fn merge_texts(left: &str, right: &str) -> String {
    let chunks = dissimilar::diff(left, right);
    let mut result = String::new();

    for chunk in chunks {
        match chunk {
            dissimilar::Chunk::Equal(text) => {
                result.push_str(text);
            }
            dissimilar::Chunk::Delete(text) => {
                result.push_str(text);
            }
            dissimilar::Chunk::Insert(text) => {
                result.push_str(text);
            }
        }
    }

    result
}