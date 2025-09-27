#!/bin/bash

# Script to search for text in Word (.docx) files
# Usage: ./search-in-docx.sh "/path/to/folder" "search term"

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -lt 2 ]; then
    echo "Usage: $0 <folder_path> <search_term>"
    echo "Example: $0 /Users/Documents \"美国宪法之父\""
    exit 1
fi

SEARCH_PATH="$1"
SEARCH_TERM="$2"

# Check if path exists
if [ ! -d "$SEARCH_PATH" ]; then
    echo -e "${RED}Error: Directory '$SEARCH_PATH' does not exist${NC}"
    exit 1
fi

echo -e "${BLUE}=== Searching for '${SEARCH_TERM}' in Word files ===${NC}"
echo -e "${YELLOW}Search path: ${SEARCH_PATH}${NC}"
echo ""

# Counter for found files
FOUND_COUNT=0
TOTAL_COUNT=0

# Create temp directory for extraction
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Find all .docx files (excluding temporary files)
echo -e "${GREEN}Searching in .docx files...${NC}"

while IFS= read -r -d '' file; do
    # Skip temporary files that start with .~ or ~$
    basename=$(basename "$file")
    if [[ "$basename" == .~* ]] || [[ "$basename" == ~\$* ]]; then
        continue
    fi
    
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    
    # Show progress
    echo -ne "\rChecking file $TOTAL_COUNT: $(basename "$file")                    "
    
    # Extract and search in the docx file (with error handling)
    if unzip -p "$file" word/document.xml 2>/dev/null | grep -q "$SEARCH_TERM" 2>/dev/null; then
        FOUND_COUNT=$((FOUND_COUNT + 1))
        echo -e "\n${GREEN}✓ Found in:${NC} $file"
        
        # Extract context (optional - show surrounding text)
        echo -e "${YELLOW}  Context:${NC}"
        unzip -p "$file" word/document.xml 2>/dev/null | \
            sed 's/<[^>]*>/ /g' | \
            grep -o ".{0,50}${SEARCH_TERM}.{0,50}" 2>/dev/null | \
            head -3 | \
            while IFS= read -r line; do
                echo "    ...$line..."
            done
        echo ""
    fi
done < <(find "$SEARCH_PATH" -type f -name "*.docx" ! -name ".*" ! -name "~*" -print0)

echo -e "\n"
echo -e "${BLUE}=== Search Complete ===${NC}"
echo -e "${YELLOW}Total files checked: ${TOTAL_COUNT}${NC}"
echo -e "${GREEN}Files containing '${SEARCH_TERM}': ${FOUND_COUNT}${NC}"

# Also search in .doc files if available (requires antiword or textutil on Mac)
echo ""
echo -e "${GREEN}Searching in .doc files (if any)...${NC}"

DOC_COUNT=0
DOC_FOUND=0

# Check if textutil is available (Mac)
if command -v textutil &> /dev/null; then
    while IFS= read -r -d '' file; do
        DOC_COUNT=$((DOC_COUNT + 1))
        
        echo -ne "\rChecking file $DOC_COUNT: $(basename "$file")                    "
        
        # Convert to text and search
        if textutil -convert txt -stdout "$file" 2>/dev/null | grep -q "$SEARCH_TERM"; then
            DOC_FOUND=$((DOC_FOUND + 1))
            echo -e "\n${GREEN}✓ Found in:${NC} $file"
            
            # Show context
            echo -e "${YELLOW}  Context:${NC}"
            textutil -convert txt -stdout "$file" 2>/dev/null | \
                grep -o ".{0,50}${SEARCH_TERM}.{0,50}" | \
                head -3 | \
                while IFS= read -r line; do
                    echo "    ...$line..."
                done
            echo ""
        fi
    done < <(find "$SEARCH_PATH" -type f -name "*.doc" -print0)
    
    if [ $DOC_COUNT -gt 0 ]; then
        echo -e "\n${YELLOW}Total .doc files checked: ${DOC_COUNT}${NC}"
        echo -e "${GREEN}.doc files containing '${SEARCH_TERM}': ${DOC_FOUND}${NC}"
    fi
else
    echo -e "${YELLOW}Note: textutil not found. Cannot search .doc files.${NC}"
fi

# Final summary
echo ""
echo -e "${BLUE}=== Final Summary ===${NC}"
echo -e "Total Word files containing '${SEARCH_TERM}': $((FOUND_COUNT + DOC_FOUND))"