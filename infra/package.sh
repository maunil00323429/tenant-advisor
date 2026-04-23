#!/bin/bash
set -e

echo "Packaging Lambda function..."

pip install -r requirements.txt -t ./package --quiet

cp *.py package/

cd package
zip -r ../infra/lambda.zip . --quiet
cd ..

rm -rf package

echo "Done: infra/lambda.zip created"
ls -lh infra/lambda.zip
