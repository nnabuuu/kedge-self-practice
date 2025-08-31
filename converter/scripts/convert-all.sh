#!/bin/bash

# Convert all DOC/DOCX files with EMF/WMF to modern DOCX with PNG
# Usage: ./scripts/convert-all.sh [input-directory] [output-directory]

INPUT_DIR=${1:-"./documents"}
OUTPUT_DIR=${2:-"./output"}

echo "Converting all documents in $INPUT_DIR to $OUTPUT_DIR"
echo "==========================================="

# Build the converter if needed
if [ ! -d "dist" ]; then
    echo "Building converter..."
    npm run build
fi

# Check dependencies
echo "Checking dependencies..."
npm run convert -- check

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Convert all files recursively
echo ""
echo "Starting conversion..."
npm run convert -- convert "$INPUT_DIR" \
    --recursive \
    --doc-to-docx \
    --output "$OUTPUT_DIR" \
    --verbose \
    --quality 95 \
    --dpi 150

echo ""
echo "Conversion complete!"
echo "Output files are in: $OUTPUT_DIR"