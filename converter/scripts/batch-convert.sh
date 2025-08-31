#!/bin/bash

# Batch convert with parallel processing
# Usage: ./scripts/batch-convert.sh [pattern] [parallel-count]

PATTERN=${1:-"**/*.{doc,docx}"}
PARALLEL=${2:-4}
OUTPUT_DIR="./output/batch-$(date +%Y%m%d-%H%M%S)"

echo "Batch Converting Files"
echo "====================="
echo "Pattern: $PATTERN"
echo "Parallel: $PARALLEL workers"
echo "Output: $OUTPUT_DIR"
echo ""

# Build if needed
if [ ! -d "dist" ]; then
    echo "Building converter..."
    npm run build
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Run batch conversion
npm run convert -- batch "$PATTERN" \
    --parallel "$PARALLEL" \
    --output "$OUTPUT_DIR" \
    --doc-to-docx \
    --verbose

echo ""
echo "Batch conversion complete!"
echo "Results saved to: $OUTPUT_DIR"

# Show statistics
echo ""
echo "Statistics:"
echo "-----------"
find "$OUTPUT_DIR" -name "*.docx" | wc -l | xargs echo "Files converted:"
du -sh "$OUTPUT_DIR" | cut -f1 | xargs echo "Total size:"