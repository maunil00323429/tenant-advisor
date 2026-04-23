from http.server import BaseHTTPRequestHandler
import json
import os
import re
import urllib.request

from openai import OpenAI

SYSTEM_PROMPT = """
You are an expert Landlord-Tenant Dispute Advisor with deep knowledge of
residential tenancy laws across Canadian provinces and US states. Your role is
to help tenants and landlords understand their rights, analyze their dispute
objectively, draft professional correspondence, and recommend clear next steps.

You must produce your response in exactly four sections using Markdown ## headings:

## Rights Summary
Write in plain, simple language aimed at someone with no legal background.
Summarize the key tenant and landlord rights that apply to the user's specific
situation and jurisdiction. Reference general legal principles but do not cite
specific statutes. Include a disclaimer that this is not legal advice.

## Situation Analysis
Adopt a neutral, objective tone. Analyze the dispute based on the facts provided.
Identify which party appears to be at fault. Highlight any red flags or missing
information the user should be aware of. Do not take sides unfairly.

## Suggested Response Letter
Write a formal, professional letter addressed to the opposing party. The tone
should be firm but respectful. Reference the user's rights where appropriate.
Include placeholders like [Your Name] and [Date] for the user to fill in.
The letter should be ready to send with minimal editing.

## Recommended Next Steps
Use a numbered list. Start with the simplest resolution (informal conversation)
and escalate to formal options (written notice, tenant board complaint, mediation,
small claims court). Be specific to the user's jurisdiction when possible.

Constraints:
- Do not invent facts not present in the user's input.
- Do not guarantee legal outcomes.
- Always include a disclaimer that this is informational, not legal advice.
- If the jurisdiction is not recognized, provide general guidance and note the limitation.
"""


def _json_response(handler, code, body):
    handler.send_response(code)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
    handler.end_headers()
    handler.wfile.write(json.dumps(body).encode())


def _validate(body):
    errors = []
    if body.get("user_role") not in ("tenant", "landlord"):
        errors.append("user_role must be 'tenant' or 'landlord'")
    if not body.get("province_or_state") or len(body["province_or_state"]) < 2:
        errors.append("province_or_state is required (min 2 chars)")
    if not body.get("dispute_category"):
        errors.append("dispute_category is required")
    if not body.get("lease_start_date") or not re.match(r"^\d{4}-\d{2}-\d{2}$", body["lease_start_date"]):
        errors.append("lease_start_date must be YYYY-MM-DD")
    if not body.get("dispute_description") or len(body["dispute_description"]) < 50:
        errors.append("dispute_description is required (min 50 chars)")
    if not body.get("desired_outcome") or len(body["desired_outcome"]) < 10:
        errors.append("desired_outcome is required (min 10 chars)")
    return errors


def _verify_clerk_jwt(auth_header):
    """Basic JWT verification — checks that a Bearer token is present."""
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    return auth_header.split(" ", 1)[1]


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        _json_response(self, 200, {})

    def do_GET(self):
        _json_response(self, 200, {"status": "healthy", "version": "1.0"})

    def do_POST(self):
        try:
            token = _verify_clerk_jwt(self.headers.get("Authorization"))
            if not token:
                _json_response(self, 401, {"error": "Missing or invalid Authorization header"})
                return

            content_length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(content_length))

            errors = _validate(body)
            if errors:
                _json_response(self, 422, {"error": "Validation failed", "details": errors})
                return

            user_msg = (
                f"Role: {body['user_role']}\n"
                f"Jurisdiction: {body['province_or_state']}\n"
                f"Dispute Category: {body['dispute_category']}\n"
                f"Lease Start Date: {body['lease_start_date']}\n"
                f"Dispute Description: {body['dispute_description']}\n"
                f"Desired Outcome: {body['desired_outcome']}\n"
            )

            client = OpenAI()
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_msg},
                ],
            )
            result = response.choices[0].message.content

            _json_response(self, 200, {"response": result})

        except json.JSONDecodeError:
            _json_response(self, 400, {"error": "Invalid JSON body"})
        except Exception as e:
            _json_response(self, 500, {"error": str(e)})
