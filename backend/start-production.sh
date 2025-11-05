#!/bin/bash
# Production start script - loads .env and runs built application

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Load environment variables
set -a
source "$DIR/.env"
set +a

# Run the built application
exec node "$DIR/dist/packages/apps/api-server/main.js"
