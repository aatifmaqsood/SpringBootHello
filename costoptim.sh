#!/bin/bash

# Set the bucket name
BUCKET_NAME=$1

# Check if bucket name is provided
if [ -z "$BUCKET_NAME" ]; then
    echo "Error: Please provide the bucket name as an argument."
    echo "Usage: $0 <bucket-name>"
    exit 1
fi

# Calculate the date 30 days ago (macOS-compatible)
THIRTY_DAYS_AGO=$(date -u -v-30d +"%Y-%m-%dT%H:%M:%SZ")

# Initialize variables
OUTPUT_FILE="s3_versions.json"
ANALYSIS_FILE="older_versions.json"

# Fetch all versions (handle pagination)
echo "Fetching object versions from bucket: $BUCKET_NAME..."
aws s3api list-object-versions --bucket "$BUCKET_NAME" --output json > "$OUTPUT_FILE"

if [[ $? -ne 0 ]]; then
    echo "Error: Failed to fetch object versions from bucket."
    exit 1
fi

echo "Data saved to $OUTPUT_FILE."
echo "Analyzing object versions older than: $THIRTY_DAYS_AGO"
echo "---------------------------------------------"

# Filter and analyze versions using jq
jq --arg cutoff "$THIRTY_DAYS_AGO" '
    .Versions[] | 
    select(.LastModified < $cutoff) |
    {Key: .Key, Size: .Size, LastModified: .LastModified}
' "$OUTPUT_FILE" > "$ANALYSIS_FILE"

# Calculate total size and savings
TOTAL_SIZE=$(jq '[.Size | tonumber] | add' "$ANALYSIS_FILE")
TOTAL_SIZE_GB=$(echo "scale=2; $TOTAL_SIZE / (1024 * 1024 * 1024)" | bc)
POTENTIAL_SAVINGS=$(echo "scale=2; $TOTAL_SIZE_GB * 0.023" | bc)

echo "---------------------------------------------"
echo "Analysis saved to: $ANALYSIS_FILE"
echo "Total size of object versions older than 30 days: $TOTAL_SIZE_GB GB"
echo "Potential monthly savings (Standard Storage): \$$POTENTIAL_SAVINGS"
