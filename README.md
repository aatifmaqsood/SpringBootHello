Step 1: Update S3 Bucket Policy (By Team A)
The S3 bucket policy needs to be updated to allow team B to read and write to the bucket. Replace ACCOUNT_ID_B with the AWS account ID of team B, and TeamBRole with the IAM role or user for team B.

"""
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowReadWriteAccessForTeamB",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::ACCOUNT_ID_B:role/TeamBRole"
            },
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::awsCustomDataBucket",
                "arn:aws:s3:::awsCustomDataBucket/*"
            ]
        }
    ]
}
"""
Step 2: Update KMS Key Policy (By Team A)
The KMS key policy must be updated to allow team B to use the KMS key for encrypting and decrypting objects in the S3 bucket. Replace ACCOUNT_ID_B with the AWS account ID of team B, TeamBRole with the IAM role or user for team B, and KMS_KEY_ID with the ID of your KMS key.

"""
{
    "Version": "2012-10-17",
    "Id": "key-policy",
    "Statement": [
        {
            "Sid": "AllowTeamBUseOfKey",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::ACCOUNT_ID_B:role/TeamBRole"
            },
            "Action": [
                "kms:Encrypt",
                "kms:Decrypt",
                "kms:ReEncrypt*",
                "kms:GenerateDataKey*",
                "kms:DescribeKey"
            ],
            "Resource": "*"
        },
        {
            "Sid": "AllowS3BucketUseOfKey",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::ACCOUNT_ID_B:role/TeamBRole"
            },
            "Action": [
                "kms:Encrypt",
                "kms:Decrypt",
                "kms:ReEncrypt*",
                "kms:GenerateDataKey*",
                "kms:DescribeKey"
            ],
            "Resource": "*",
            "Condition": {
                "StringEquals": {
                    "kms:ViaService": "s3.YOUR_REGION.amazonaws.com",
                    "kms:CallerAccount": "ACCOUNT_ID_A"
                }
            }
        }
    ]
}
"""
Step 3: Define IAM Policy for Team B
Attach an IAM policy to the role or user for team B that allows them to perform the required S3 and KMS operations. Replace awsCustomDataBucket, ACCOUNT_ID_A, and KMS_KEY_ID with the appropriate values.

"""
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::awsCustomDataBucket",
                "arn:aws:s3:::awsCustomDataBucket/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "kms:Encrypt",
                "kms:Decrypt",
                "kms:ReEncrypt*",
                "kms:GenerateDataKey*",
                "kms:DescribeKey"
            ],
            "Resource": "arn:aws:kms:YOUR_REGION:ACCOUNT_ID_A:key/KMS_KEY_ID"
        }
    ]
}
"""
Summary
Bucket Policy: Update by team A to grant read/write access to the S3 bucket for team B's IAM role/user.
KMS Key Policy: Update by team A to allow team B's IAM role/user to use the KMS key.
IAM Policy for Team B: Define by admin to grant the necessary permissions for both S3 and KMS operations.
These policies ensure that team B has the required permissions to read from and write to the S3 bucket and to use the KMS key for encryption and decryption.
