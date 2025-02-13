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
TOTAL_SIZE=0
OUTPUT_FILE="s3_versions.json"
ANALYSIS_FILE="older_versions.json"

# Fetch all versions and save them to a file
echo "Fetching object versions from bucket: $BUCKET_NAME..."
aws s3api list-object-versions --bucket "$BUCKET_NAME" --output json > "$OUTPUT_FILE"

if [[ $? -ne 0 ]]; then
    echo "Error: Failed to fetch object versions from bucket."
    exit 1
fi

echo "Data saved to $OUTPUT_FILE."
echo "Analyzing object versions older than: $THIRTY_DAYS_AGO"
echo "---------------------------------------------"

# Process the file to analyze versions
jq -c '.Versions[]' "$OUTPUT_FILE" | while read -r version; do
    # Extract key information
    Key=$(echo "$version" | jq -r '.Key')
    LastModified=$(echo "$version" | jq -r '.LastModified')
    Size=$(echo "$version" | jq -r '.Size')

    # Compare dates to check if the version is older than 30 days
    if [[ "$LastModified" < "$THIRTY_DAYS_AGO" ]]; then
        # Add the size to the total
        TOTAL_SIZE=$((TOTAL_SIZE + Size))
        echo "Key: $Key | Size: $Size bytes | LastModified: $LastModified" >> "$ANALYSIS_FILE"
        echo "Key: $Key | Size: $Size bytes | LastModified: $LastModified"
    fi
done

# Convert the total size to GB
TOTAL_SIZE_GB=$(echo "scale=2; $TOTAL_SIZE / (1024 * 1024 * 1024)" | bc)

# Calculate cost savings (assuming $0.023 per GB for standard storage)
POTENTIAL_SAVINGS=$(echo "scale=2; $TOTAL_SIZE_GB * 0.023" | bc)

echo "---------------------------------------------"
echo "Analysis saved to: $ANALYSIS_FILE"
echo "Total size of object versions older than 30 days: $TOTAL_SIZE_GB GB"
echo "Potential monthly savings (Standard Storage): \$$POTENTIAL_SAVINGS"
