#!/bin/bash
# Merge .envrc and .envrc.override into .env
# Priority: .envrc.override > .envrc

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ENVRC_FILE="$SCRIPT_DIR/.envrc"
OVERRIDE_FILE="$SCRIPT_DIR/.envrc.override"
OUTPUT_FILE="$SCRIPT_DIR/.env"

echo "=== Merging environment files ==="

# Check if .envrc exists
if [ ! -f "$ENVRC_FILE" ]; then
  echo "❌ Error: .envrc not found at $ENVRC_FILE"
  exit 1
fi

# Create temporary files
TMP_BASE=$(mktemp)
TMP_OVERRIDE=$(mktemp)
TMP_MERGED=$(mktemp)
trap "rm -f $TMP_BASE $TMP_OVERRIDE $TMP_MERGED" EXIT

# Function to extract export statements and convert to .env format
extract_vars() {
  local file=$1
  # Extract lines starting with 'export', remove 'export ', handle quotes
  grep -E '^export [A-Z_]' "$file" 2>/dev/null | sed 's/^export //' || true
}

# Start with base .envrc
echo "📄 Reading $ENVRC_FILE..."
extract_vars "$ENVRC_FILE" > "$TMP_BASE"

# If .envrc.override exists, merge it (overriding existing vars)
if [ -f "$OVERRIDE_FILE" ]; then
  echo "📄 Reading $OVERRIDE_FILE (overrides)..."
  extract_vars "$OVERRIDE_FILE" > "$TMP_OVERRIDE"

  # Use awk to merge: override takes priority
  awk -F= '
    NR==FNR { base[$1]=$0; next }  # Store base file
    { override[$1]=$0 }            # Store override file
    END {
      # First output all base variables
      for (key in base) {
        if (!(key in override)) {
          print base[key]
        }
      }
      # Then output all override variables (these take priority)
      for (key in override) {
        print override[key]
      }
    }
  ' "$TMP_BASE" "$TMP_OVERRIDE" | sort > "$TMP_MERGED"
else
  echo "ℹ️  No .envrc.override found, using .envrc only"
  sort "$TMP_BASE" > "$TMP_MERGED"
fi

# Backup existing .env if it exists
if [ -f "$OUTPUT_FILE" ]; then
  BACKUP_FILE="$OUTPUT_FILE.backup.$(date +%Y%m%d_%H%M%S)"
  echo "💾 Backing up existing .env to $BACKUP_FILE"
  cp "$OUTPUT_FILE" "$BACKUP_FILE"
fi

# Write final output
cp "$TMP_MERGED" "$OUTPUT_FILE"

echo "✅ Successfully created $OUTPUT_FILE"
echo ""
echo "Variables merged:"
wc -l < "$OUTPUT_FILE" | xargs echo "  Total:"

# Show which variables were overridden
if [ -f "$OVERRIDE_FILE" ]; then
  echo ""
  echo "🔄 Overridden variables from .envrc.override:"
  extract_vars "$OVERRIDE_FILE" | cut -d'=' -f1 | while read -r var; do
    echo "  - $var"
  done
fi

echo ""
echo "📝 You can now use: source $OUTPUT_FILE"
