#!/bin/bash

echo "Installing EMF/WMF Conversion Tools"
echo "==================================="
echo ""

# Detect OS
OS="Unknown"
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="Linux"
fi

echo "Detected OS: $OS"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check and install tools based on OS
if [[ "$OS" == "macOS" ]]; then
    echo "Checking for Homebrew..."
    if ! command_exists brew; then
        echo "Homebrew not found. Please install it first:"
        echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
    
    echo "Installing tools for macOS..."
    echo ""
    
    # ImageMagick with librsvg for better SVG support
    if ! command_exists magick; then
        echo "Installing ImageMagick..."
        brew install imagemagick
    else
        echo "✓ ImageMagick already installed"
    fi
    
    # LibreOffice for EMF/WMF conversion
    if ! command_exists soffice && [ ! -d "/Applications/LibreOffice.app" ]; then
        echo "Installing LibreOffice..."
        brew install --cask libreoffice
    else
        echo "✓ LibreOffice already installed"
    fi
    
    # Inkscape for EMF/WMF conversion (optional but recommended)
    if ! command_exists inkscape && [ ! -d "/Applications/Inkscape.app" ]; then
        echo ""
        echo "Optional: Install Inkscape for better EMF/WMF support?"
        echo "This provides an additional conversion method."
        read -p "Install Inkscape? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            brew install --cask inkscape
        fi
    else
        echo "✓ Inkscape already installed"
    fi
    
    # libwmf for WMF support
    if ! brew list libwmf &>/dev/null; then
        echo ""
        echo "Installing libwmf for better WMF support..."
        brew install libwmf
    else
        echo "✓ libwmf already installed"
    fi
    
elif [[ "$OS" == "Linux" ]]; then
    echo "Installing tools for Linux..."
    echo "Please run with sudo if needed."
    echo ""
    
    # Update package list
    sudo apt-get update
    
    # ImageMagick
    if ! command_exists convert && ! command_exists magick; then
        echo "Installing ImageMagick..."
        sudo apt-get install -y imagemagick
    else
        echo "✓ ImageMagick already installed"
    fi
    
    # LibreOffice
    if ! command_exists libreoffice && ! command_exists soffice; then
        echo "Installing LibreOffice..."
        sudo apt-get install -y libreoffice
    else
        echo "✓ LibreOffice already installed"
    fi
    
    # Inkscape (optional)
    if ! command_exists inkscape; then
        echo ""
        echo "Optional: Install Inkscape for better EMF/WMF support?"
        read -p "Install Inkscape? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            sudo apt-get install -y inkscape
        fi
    else
        echo "✓ Inkscape already installed"
    fi
    
    # libwmf
    echo "Installing libwmf for WMF support..."
    sudo apt-get install -y libwmf-bin
    
else
    echo "Unsupported OS. Please install the following manually:"
    echo "  - ImageMagick"
    echo "  - LibreOffice"
    echo "  - Inkscape (optional)"
    echo "  - libwmf (for WMF support)"
fi

echo ""
echo "Installation complete!"
echo ""
echo "Testing installations..."
echo "========================"

# Test ImageMagick
if command_exists magick || command_exists convert; then
    echo "✓ ImageMagick: $(magick -version 2>/dev/null | head -1 || convert -version | head -1)"
else
    echo "✗ ImageMagick: Not found"
fi

# Test LibreOffice
if command_exists soffice || command_exists libreoffice || [ -d "/Applications/LibreOffice.app" ]; then
    echo "✓ LibreOffice: Installed"
else
    echo "✗ LibreOffice: Not found"
fi

# Test Inkscape
if command_exists inkscape || [ -d "/Applications/Inkscape.app" ]; then
    echo "✓ Inkscape: Installed"
else
    echo "⚠ Inkscape: Not found (optional)"
fi

echo ""
echo "You can now run the converter with:"
echo "  npm run convert -- convert <file.docx>"