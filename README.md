# Landlord-Tenant Dispute Advisor

AI-powered tool that helps tenants and landlords navigate rental disputes with legal rights summaries, professional response letters, and escalation guidance.

## Live Demo

**CloudFront:** https://d1x8k2qwg4m7ra.cloudfront.net

## Screenshot

[screenshot of working app here]

## Technology Stack

Next.js, FastAPI, Clerk Auth, OpenAI (Vercel), AWS Bedrock Nova 2 Lite (AWS), AWS Lambda, API Gateway, S3, CloudFront, DynamoDB, Secrets Manager, Terraform, GitHub Actions CI/CD.

## Architecture Overview

```
User Browser ──HTTPS──► CloudFront ──HTTP──► S3 (static frontend)
User Browser ──HTTPS+JWT──► API Gateway ──AWS_PROXY──► Lambda
Lambda ──► Clerk JWKS (JWT verify)
Lambda ──► Pydantic (input validation)
Lambda ──► DynamoDB (conversation memory)
Lambda ──► Secrets Manager (runtime config)
Lambda ──► Bedrock Nova 2 Lite (AI inference)
Terraform ──► manages all AWS resources
GitHub Actions ──► auto-deploys on push to main via OIDC
```

## Local Development Setup

```bash
git clone https://github.com/maunil00323429/tenant-advisor.git
cd tenant-advisor
npm install
cp .env.example .env.local  # fill in CLERK keys and OPENAI_API_KEY
npm run dev
```

## Deployment

**Terraform:** All AWS infrastructure is defined in `infra/*.tf`. Run `cd infra && terraform init && terraform workspace select dev && terraform apply` to provision or update all resources.

**GitHub Actions:** Pushing to `main` triggers the CI/CD pipeline which packages the Lambda, applies Terraform, builds the Next.js frontend, syncs to S3, and invalidates the CloudFront cache — all via OIDC with no long-lived secrets.

## API Endpoints

**GET /health**
- Response: `{"status": "healthy", "version": "1.0"}`

**POST /api**
- Headers: `Authorization: Bearer <Clerk JWT>`, `Content-Type: application/json`
- Request body:
```json
{
  "user_role": "tenant",
  "province_or_state": "Ontario",
  "dispute_category": "deposit",
  "lease_start_date": "2024-09-01",
  "dispute_description": "Description of the dispute (50-2000 chars)",
  "desired_outcome": "What the user wants (min 10 chars)",
  "session_id": "optional-session-id"
}
```
- Response (Vercel): SSE stream of Markdown text
- Response (AWS): `{"response": "Markdown text", "session_id": "..."}`

## Known Limitations

1. **Not actual legal advice** — the AI can make mistakes and should not replace a real lawyer. The disclaimer is included in every response but users may still over-rely on the output.
2. **Jurisdiction coverage is general** — the model doesn't have access to specific local bylaws or recent legislative changes. It provides general legal principles rather than citing exact statutes.

## Future Improvements

1. **Document upload** — allow users to attach their lease agreement for direct analysis, so the AI can reference specific clauses.
2. **Multi-language support** — add French and Spanish support for non-English speaking tenants, especially relevant for Quebec and US border states.
3. **Conversation export** — let users download their full dispute analysis as a PDF they can bring to a lawyer or tenant board hearing.
