#!/bin/bash
# Builds infra/lambda.zip — the deployment artifact for the Lambda function.
# Installs Python dependencies into a temp directory, copies all .py source files,
# zips everything, then cleans up. Run from the repo root (the CI pipeline does this).
set -e

echo "Packaging Lambda function..."

# Install deps into an isolated directory so they don't pollute the local env
pip install -r requirements.txt -t ./package --quiet

# Include all Python source files (server.py, lambda_handler.py, dynamo_memory.py, secrets.py)
cp *.py package/

cd package
zip -r ../infra/lambda.zip . --quiet
cd ..

rm -rf package

echo "Done: infra/lambda.zip created"
ls -lh infra/lambda.zip
