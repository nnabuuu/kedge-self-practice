#!/bin/bash

echo "Building DOCX/EMF Converter Docker Image"
echo "========================================"

# Build the Docker image
docker build -t docx-emf-converter:latest .

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Docker image built successfully!"
    echo ""
    echo "Usage:"
    echo "------"
    echo "1. Single file conversion:"
    echo "   docker run -v \$(pwd)/input:/app/input -v \$(pwd)/output:/app/output docx-emf-converter:latest convert /app/input/document.docx"
    echo ""
    echo "2. Batch conversion:"
    echo "   docker-compose up converter"
    echo ""
    echo "3. Interactive shell:"
    echo "   docker run -it --entrypoint /bin/bash docx-emf-converter:latest"
else
    echo "✗ Failed to build Docker image"
    exit 1
fi