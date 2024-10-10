#!/bin/bash
install_tesseract() {
    echo "Homebrew is already installed."
    # Install Tesseract
    if ! command -v tesseract &>/dev/null; then
        echo "Tesseract is not installed. Installing..."

        # Install Tesseract
        brew install tesseract
        brew install tesseract-lang

        # Check if installation was successful
        if [ $? -eq 0 ]; then
            echo "Tesseract has been installed successfully."
        else
            echo "Error: Tesseract installation failed."
            exit 1
        fi
    else
        echo "Tesseract is already installed."
    fi
}

# Check if Homebrew is installed
if ! command -v brew &>/dev/null; then
    echo "Homebrew is not installed. Installing..."

    # Install Homebrew
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Check if installation was successful
    if [ $? -eq 0 ]; then
        echo "Homebrew has been installed successfully."
        install_tesseract
    else
        echo "Error: Homebrew installation failed."
        exit 1
    fi
else
    install_tesseract
fi
