# Security Policy

## Responsible Disclosure & Reporting Vulnerabilities

The CrisisLens engineering team takes security and privacy seriously, particularly given the sensitive nature of disaster response operations and citizen-submitted field telemetry.

If you believe you have discovered a security vulnerability in CrisisLens, please report it privately:

- **Email**: `security@crisislens.local` (or file a private advisory via GitHub Security Advisories)
- **Response Target**: We acknowledge vulnerability reports within 48 business hours and coordinate remediation before public release.
- **Please DO NOT** open public GitHub issues or discussions for sensitive security vulnerabilities.

---

## Sensitive Configuration & API Key Protection

### 1. Never Commit Secrets or API Keys
CrisisLens strictly enforces that no third-party API keys (e.g., OpenRouter, Google Gemini, NASA FIRMS) are committed to the repository:
- All sensitive credentials must be read at runtime from `.env` files.
- `.env` files are tracked in `.gitignore` and must never be staged or committed to Git.
- Always use `.env.example` as a template containing only empty placeholders.

### 2. Zero Secret Exposure to the Frontend Client
- Third-party API keys are **strictly server-side**.
- The React/Vite frontend client never receives or stores the OpenRouter API key.
- All AI calls and external API communications route through the authenticated FastAPI backend.
- The map stack utilizes **Leaflet + OpenStreetMap**, which does not require any map API keys or client-side tokens.

### 3. Credential Rotation Policy
If an API key is accidentally exposed in logs, issues, or commit history:
1. **Immediately revoke** the key in the provider console ([OpenRouter Keys](https://openrouter.ai/keys) or [Google AI Studio](https://aistudio.google.com/)).
2. Generate a new API key.
3. Update the local backend `.env`.
4. Re-verify git commit history using tools like `git-filter-repo` or BFG Repo-Cleaner before pushing.

### 4. Input Sanitization & File Upload Guardrails
- **File Validation**: Uploaded disaster photographs are strictly validated against magic byte headers and allowed extensions (`.png`, `.jpg`, `.jpeg`, `.webp`).
- **File Size Restrictions**: Uploaded media is constrained to a 10MB hard ceiling to prevent Denial of Service (DoS) memory exhaustion.
- **SQL Injection Prevention**: All database queries use asynchronous SQLAlchemy ORM parameter binding with SQLite/aiosqlite.
- **Strict JSON Schema Enforcement**: AI output payloads are parsed through strict Pydantic schemas to prevent prompt injection or payload tampering from influencing internal database records.
