#!/bin/bash

# Define the output CSV file
OUTPUT_CSV="bucket_analysis.csv"

# Write the CSV header
echo "bucketName,Size in GB,Costing" > "$OUTPUT_CSV"

# List all buckets and filter buckets containing "data" in the name
BUCKETS=$(aws s3api list-buckets --query "Buckets[?contains(Name, 'data-bucket')].Name" --output text)

# Check if any buckets are found
if [ -z "$BUCKETS" ]; then
    echo "Error: No buckets found containing 'data' in their name."
    exit 1
fi

# Iterate through each bucket
for BUCKET_NAME in $BUCKETS; do
    echo "Analyzing bucket: $BUCKET_NAME"

    # Calculate the date 30 days ago (macOS-compatible)
    THIRTY_DAYS_AGO=$(date -u -v-30d +"%Y-%m-%dT%H:%M:%SZ")

    # Initialize variables
    OUTPUT_FILE="s3_versions_${BUCKET_NAME}.json"
    ANALYSIS_FILE="older_versions_${BUCKET_NAME}.json"

    # Fetch all versions (handle pagination)
    echo "Fetching object versions from bucket: $BUCKET_NAME..."
    aws s3api list-object-versions --bucket "$BUCKET_NAME" --output json > "$OUTPUT_FILE"

    if [[ $? -ne 0 ]]; then
        echo "Error: Failed to fetch object versions from bucket $BUCKET_NAME."
        continue
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

    # Calculate total size
    TOTAL_SIZE=$(cat "$ANALYSIS_FILE" | grep '"Size":' | awk -F': ' '{sum += $2} END {print sum}')

    # Convert size to GB
    TOTAL_SIZE_GB=$(echo "scale=4; $TOTAL_SIZE / (1024 * 1024 * 1024)" | bc)

    # Calculate potential savings (assuming $0.023 per GB for Standard Storage)
    POTENTIAL_SAVINGS=$(echo "scale=4; $TOTAL_SIZE_GB * 0.023" | bc)

    # Output the result to the CSV file
    echo "$BUCKET_NAME,$TOTAL_SIZE_GB,$POTENTIAL_SAVINGS" >> "$OUTPUT_CSV"

    echo "---------------------------------------------"
    echo "Analysis for bucket $BUCKET_NAME saved to $ANALYSIS_FILE"
    echo "Total size of object versions older than 30 days: $TOTAL_SIZE_GB GB"
    echo "Potential monthly savings (Standard Storage): \$$POTENTIAL_SAVINGS"
    echo "---------------------------------------------"
done

echo "Analysis complete. Results saved to $OUTPUT_CSV."
