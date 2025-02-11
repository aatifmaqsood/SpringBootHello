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
        .Expiration |= {"Days": 30} +
        (if .NoncurrentVersionExpiration then {} else {"NoncurrentVersionExpiration": {"NoncurrentDays": 30}} end)
    )' "$POLICY_FILE" > "$UPDATED_POLICY_FILE"
fi

# Apply the updated policy
echo "Applying updated lifecycle policy to bucket: $BUCKET_NAME..."
aws s3api put-bucket-lifecycle-configuration --bucket "$BUCKET_NAME" --lifecycle-configuration file://"$UPDATED_POLICY_FILE"

echo "✅ Lifecycle policy updated successfully!"

# Cleanup
rm -f "$POLICY_FILE" "$UPDATED_POLICY_FILE"
