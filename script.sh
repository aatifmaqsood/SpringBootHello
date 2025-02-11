#!/bin/bash
# Check if bucket name is passed
if [ -z "$1" ]; then
    echo "Usage: $0 <s3-bucket-name>"
    exit 1
fi
BUCKET_NAME=$1
POLICY_FILE="policy.json"
UPDATED_POLICY_FILE="updated_policy.json"
# Get total object versions count in the bucket
echo "Fetching total object versions count in bucket: $BUCKET_NAME..."
TOTAL_VERSIONS=$(aws s3api list-object-versions --bucket "$BUCKET_NAME" --query "length(Versions)" --output text 2>/dev/null)
if [ "$TOTAL_VERSIONS" == "None" ]; then
    TOTAL_VERSIONS=0
fi
echo "🔢 Total Object Versions in $BUCKET_NAME: $TOTAL_VERSIONS"
# Get current lifecycle policy
echo "Fetching current lifecycle policy for bucket: $BUCKET_NAME..."
aws s3api get-bucket-lifecycle-configuration --bucket "$BUCKET_NAME" > "$POLICY_FILE" 2>/dev/null
# Check if policy exists
if [ ! -s "$POLICY_FILE" ]; then
    echo "No existing lifecycle policy found."
else
    echo "Updating existing lifecycle policy..."
    jq '.Rules |= map(
    .Expiration |= {"Days": 30} |  # Ensure Expiration has 30 days
    . + (if has("NoncurrentVersionExpiration") then {} else {"NoncurrentVersionExpiration": {"NoncurrentDays": 0}} end)  # Add NoncurrentVersionExpiration separately
    )' "$POLICY_FILE" > "$UPDATED_POLICY_FILE"
fi
# Apply the updated policy
echo "Applying updated lifecycle policy to bucket: $BUCKET_NAME..."
aws s3api put-bucket-lifecycle-configuration --bucket "$BUCKET_NAME" --lifecycle-configuration file://"$UPDATED_POLICY_FILE"
echo "✅ Lifecycle policy updated successfully!"
# Cleanup
rm -f "$POLICY_FILE" "$UPDATED_POLICY_FILE"

# List all object versions
aws s3api list-object-versions --bucket "$BUCKET_NAME" --query 'Versions[*].[Key, VersionId, LastModified]' --output json > versions.json

# Parse JSON and delete versions older than 30 days
cat versions.json | jq -c '.[]' | while read -r version; do
    OBJECT_KEY=$(echo $version | jq -r '.[0]')
    VERSION_ID=$(echo $version | jq -r '.[1]')
    LAST_MODIFIED=$(echo $version | jq -r '.[2]')
    
    # Convert last modified date to epoch
    LAST_MODIFIED_EPOCH=$(date -d "$LAST_MODIFIED" +%s)
    
    # Calculate age in days
    AGE_DAYS=$(( (CURRENT_DATE - LAST_MODIFIED_EPOCH) / 86400 ))

    # Delete if older than 30 days
    if [ "$AGE_DAYS" -gt 30 ]; then
        echo "Deleting old version: $OBJECT_KEY (Version: $VERSION_ID, Age: $AGE_DAYS days)"
        aws s3api delete-object --bucket "$BUCKET_NAME" --key "$OBJECT_KEY" --version-id "$VERSION_ID"
    fi
done
rm -f versions.json
echo "Old versions deleted manually."
