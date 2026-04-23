import os
from fastapi import FastAPI, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer, HTTPAuthorizationCredentials
from openai import OpenAI

app = FastAPI()
clerk_config = ClerkConfig(jwks_url=os.getenv("CLERK_JWKS_URL"))
clerk_guard = ClerkHTTPBearer(clerk_config)


class InputRecord(BaseModel):
    user_role: str = Field(..., pattern="^(tenant|landlord)$")
    province_or_state: str = Field(..., min_length=2)
    dispute_category: str
    lease_start_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    dispute_description: str = Field(..., min_length=50, max_length=2000)
    desired_outcome: str = Field(..., min_length=10)
    session_id: Optional[str] = None


system_prompt = """
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


def user_prompt_for(record: InputRecord) -> str:
    return f"""
Role: {record.user_role}
Jurisdiction: {record.province_or_state}
Dispute Category: {record.dispute_category}
Lease Start Date: {record.lease_start_date}
Dispute Description: {record.dispute_description}
Desired Outcome: {record.desired_outcome}
"""


@app.get("/")
@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "healthy", "version": "1.0"}


@app.post("/")
@app.post("/api")
def process(
    record: InputRecord,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    user_id = creds.decoded["sub"]
    client = OpenAI()
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user",   "content": user_prompt_for(record)},
    ]
    stream = client.chat.completions.create(
        model="gpt-4o-mini", messages=messages, stream=True
    )

    def event_stream():
        for chunk in stream:
            text = chunk.choices[0].delta.content
            if text:
                for line in text.split("\n"):
                    yield f"data: {line}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
