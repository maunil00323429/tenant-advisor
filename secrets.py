# AWS Secrets Manager helper — fetches JSON secrets and caches them in-process.
# Used by server.py to pull runtime config (e.g. CORS_ORIGINS) without env vars.
# The in-memory cache avoids repeated Secrets Manager API calls within a Lambda container.

import boto3
import json
import os

_cache = {}


def get_secret(secret_name: str) -> dict:
    """Returns the parsed JSON dict for the given secret, or {} on failure."""
    if secret_name in _cache:
        return _cache[secret_name]

    region = os.getenv("AWS_REGION", "us-east-1")
    client = boto3.client("secretsmanager", region_name=region)

    try:
        response = client.get_secret_value(SecretId=secret_name)
        secret_dict = json.loads(response["SecretString"])
        _cache[secret_name] = secret_dict
        return secret_dict
    except Exception as e:
        # Graceful fallback — callers will use defaults if the secret is missing
        print(f"Warning: could not retrieve secret '{secret_name}': {e}")
        return {}
