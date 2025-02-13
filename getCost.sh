#!/bin/bash

# Set the bucket name
BUCKET_NAME=$1

# Calculate the date 30 days ago (macOS-compatible)
THIRTY_DAYS_AGO=$(date -u -v-30d +"%Y-%m-%dT%H:%M:%SZ")

# Initialize variables
TOTAL_SIZE=0

echo "Analyzing object versions in bucket: $BUCKET_NAME"
echo "Checking for versions older than: $THIRTY_DAYS_AGO"
echo "---------------------------------------------"

# Use AWS CLI to list all versions
aws s3api list-object-versions --bucket "$BUCKET_NAME" --output json | jq -c '.Versions[]' | while read -r version; do
    # Extract key information
    Key=$(echo "$version" | jq -r '.Key')
    LastModified=$(echo "$version" | jq -r '.LastModified')
    Size=$(echo "$version" | jq -r '.Size')

    # Compare dates to check if the version is older than 30 days
    if [[ "$LastModified" < "$THIRTY_DAYS_AGO" ]]; then
        # Add the size to the total
        TOTAL_SIZE=$((TOTAL_SIZE + Size))
        echo "Key: $Key | Size: $Size bytes | LastModified: $LastModified"
    fi
done

# Convert the total size to GB
TOTAL_SIZE_GB=$(echo "scale=2; $TOTAL_SIZE / (1024 * 1024 * 1024)" | bc)

# Calculate cost savings (assuming $0.023 per GB for standard storage)
POTENTIAL_SAVINGS=$(echo "scale=2; $TOTAL_SIZE_GB * 0.023" | bc)

echo "---------------------------------------------"
echo "Total size of object versions older than 30 days: $TOTAL_SIZE_GB GB"
echo "Potential monthly savings (Standard Storage): \$$POTENTIAL_SAVINGS"
