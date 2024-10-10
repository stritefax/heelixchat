use image::{DynamicImage, GrayImage};
use image::io::Reader as ImageReader;
use imageproc::contrast::adaptive_threshold;
use rusty_tesseract::{Args, Image, image_to_data};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use log::info;
use regex::Regex;

// overall we need to implement custom machine learning algo to achieve the following improvements to OCR: reduce tab text, accuracy, and identifying the relevant elements
// the other element is to just focus on the main working area. Element tree may be helpful, separation of UI lines, deep learning.
pub fn get_text_from_image(path: &Path) -> String {
    let mut text_results = Vec::new(); // Use a Vec to collect texts
    let min_confidence: f32 = 65.0; // Hardcoded minimum confidence threshold

    match fs::metadata(path) {
        Ok(_) => {
            let dynamic_image = ImageReader::open(path).unwrap().decode().unwrap();
            let image: DynamicImage = preprocess_image(&dynamic_image);
            let tesseract_image = Image::from_dynamic_image(&image).unwrap();

            let my_args = Args {
                lang: "eng".to_owned(),
                config_variables: HashMap::from([]),
                dpi: Some(300),
                oem: Some(3),
                psm: Some(3),
            };

            if let Ok(data_output) = image_to_data(&tesseract_image, &my_args) {
                for data in &data_output.data {
                    if !data.text.trim().is_empty() && data.conf > min_confidence {
                        let text = data.text.trim();
                        text_results.push(text.to_string());
                    }
                }
            }
        }
        Err(error) => {
            info!("File does not exist. {error}");
            return String::new();
        }
    };

    let combined_text = text_results.join(" ");
    let cleaned_text = remove_unwanted_pattern(&combined_text,50);
    cleaned_text
}

fn preprocess_image(image: &DynamicImage) -> DynamicImage {
    let grayscale_image = image.to_luma8(); // Convert to grayscale
    let block_radius = 15; // Adjust the block radius as needed
    let inverted_image = invert_image(&grayscale_image); // Invert the grayscale image
    let adaptive_threshold_image = adaptive_threshold(&inverted_image, block_radius); // Apply adaptive thresholding

    let processed_image = DynamicImage::ImageLuma8(adaptive_threshold_image);
    processed_image
}

fn invert_image(image: &GrayImage) -> GrayImage {
    let mut inverted_image = image.clone();
    for pixel in inverted_image.pixels_mut() {
        let current_value = pixel.0[0];
        pixel.0[0] = 255 - current_value;
    }
    inverted_image
}

// this function removes the first four tabs from the OCR dealing specifically with browser tabs
fn remove_unwanted_pattern(text: &str, n: usize) -> String {
    let pattern = r"^.*?\|.*?\|.*?\|";
    let re = Regex::new(pattern).unwrap();

    if let Some(truncated_text) = text.get(..n) {
        if re.is_match(truncated_text) {
            let last_vertical_line_index = truncated_text.rfind('|').unwrap_or(0);
            let remaining_text = text.get(last_vertical_line_index + 1..).unwrap_or("");
            remaining_text.trim().to_string()
        } else {
            text.to_string()
        }
    } else {
        text.to_string()
    }
}



