$jsonContent = (aws sts assume-role --role-arn "arn:aws:iam::659050948501:role/OctDiagDeployWebsite" --role-session-name "Developer-Session") | Out-String
octdiag-$credentialsObject = $jsonContent | ConvertFrom-Json

Set-Item -Path Env:AWS_ACCESS_KEY_ID $credentialsObject.Credentials.AccessKeyId
Set-Item -Path Env:AWS_SECRET_ACCESS_KEY $credentialsObject.Credentials.SecretAccessKey
Set-Item -Path Env:AWS_SESSION_TOKEN $credentialsObject.Credentials.SessionToken

aws s3api create-bucket --bucket octdiag-website --region us-east-1
