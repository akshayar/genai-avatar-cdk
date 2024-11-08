#!/bin/bash

npx cdk bootstrap
npx cdk deploy AvatarBackendStack --require-approval=never
npx cdk deploy AvatarFrontendStack --require-approval=never

# Get the apiOutput from the AvatarBackendStack
BACKEND_STACK_NAME="AvatarBackendStack"
OUTPUT_KEY="apiOutput"
API_OUTPUT=$(aws cloudformation describe-stacks --region ap-south-1 --stack-name $BACKEND_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='$OUTPUT_KEY'].OutputValue" --output text)
OUTPUT_KEY="identityPoolOutput"
IDENTITY_OUTPUT=$(aws cloudformation describe-stacks --region ap-south-1 --stack-name $BACKEND_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='$OUTPUT_KEY'].OutputValue" --output text)
echo $API_OUTPUT
echo $IDENTITY_OUTPUT

cd frontend/
FILE_PATH="src/demo-credentials.js"

# Check if apiEndPoint variable exists
if ! grep -q "export const apiEndPoint" "$FILE_PATH"; then
    VARIABLE_DECLARATION="export const apiEndPoint='$API_OUTPUT';"
    echo "$VARIABLE_DECLARATION" >> "$FILE_PATH"
fi

# Check if cognitoIdentityPoolId variable exists
if ! grep -q "export const cognitoIdentityPoolId" "$FILE_PATH"; then
    IDENTITY_POOL_DECLARATION="export const cognitoIdentityPoolId='$IDENTITY_OUTPUT';"
    echo "$IDENTITY_POOL_DECLARATION" >> "$FILE_PATH"
fi

aws configure set region ap-south-1
git config --global credential.helper '!aws codecommit credential-helper $@'
git config --global credential.UseHttpPath true


git init
git checkout -b master
git add .
git commit -m 'first commit'
FRONTEND_STACK_NAME="AvatarFrontendStack"
OUTPUT_KEY="codeCommit"
OUTPUT_VALUE=$(aws cloudformation describe-stacks --region ap-south-1 --stack-name $FRONTEND_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='$OUTPUT_KEY'].OutputValue" --output text)
if [ -n "$OUTPUT_VALUE" ]; then
    echo "Exported $OUTPUT_KEY as MY_VARIABLE with value: $OUTPUT_VALUE"
    git remote remove origin
    git remote add origin $OUTPUT_VALUE
    git push origin master
else
    echo "Failed to get the output value for $OUTPUT_KEY from stack $FRONTEND_STACK_NAME"
fi

echo "Frontend deployment completed successfull! Sync the bedrock knowledge base and then go to the Amplify Console to try the application!"