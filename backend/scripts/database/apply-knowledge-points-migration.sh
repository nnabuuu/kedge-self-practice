#!/bin/bash

# Script to apply the knowledge points migration to the remote database
# This will insert 505 knowledge points and standardize volume names

echo "Applying knowledge points migration to remote database..."
echo "Database: kedge_db at pgm-bp10tol2zf3i95f68o.pg.rds.aliyuncs.com"

# Set environment variables for remote database
export HASURA_ENDPOINT="http://47.99.175.26:28717"
export HASURA_SECRET="hasura"

# Navigate to the schema directory
cd packages/dev/database/schema

# Apply the migration
echo "Running: hasura migrate apply --version 2000000000013 --skip-execution"
hasura migrate apply --version 2000000000013 --skip-execution --endpoint "$HASURA_ENDPOINT" --admin-secret "$HASURA_SECRET"

echo ""
echo "Migration applied. You can verify the knowledge points with:"
echo "curl -s http://47.99.175.26:8718/v1/knowledge-points/all | jq '.knowledgePoints | length'"
echo ""
echo "Expected result: 505 knowledge points"