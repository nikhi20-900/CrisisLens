# Contributing to CrisisLens

Thank you for your interest in contributing to CrisisLens! We welcome contributions from emergency technologists, AI engineers, and open-source developers committed to improving disaster resilience.

---

## 1. Development Workflow

### Step 1: Fork and Clone
1. Fork the CrisisLens repository to your GitHub account.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/crisislens.git
   cd crisislens
   ```

### Step 2: Branch Naming Conventions
Create a descriptive feature or bugfix branch off `main`:
- Features: `feat/living-crisis-timeline-scrubber`
- Fixes: `fix/openrouter-retry-backoff`
- Docs: `docs/problem-statement-alignment`
- Performance: `perf/leaflet-canvas-marker-layer`

```bash
git checkout -b feat/your-feature-name
```

---

## 2. Code Quality & Standards

### Python Backend Standards
- Target Python 3.11+.
- Adhere to PEP 8 standards.
- Run type annotations and strict Pydantic v2 validation on all API payloads.
- Ensure all business logic engines (Severity, Priority, Recommendations) remain **deterministic, auditable, and explainable**.
- Never log, print, or return sensitive credentials or raw API keys.

### TypeScript / React Frontend Standards
- Target React 19 and modern TypeScript.
- Follow component encapsulation and semantic markup.
- Avoid inline styles where Tailwind utility classes apply.
- Ensure all interactive elements have keyboard accessibility (`tabIndex`, `aria-label`).
- Validate production builds locally:
  ```bash
  cd frontend
  npm run lint
  npm run build
  ```

---

## 3. Testing Requirements

All contributions that modify backend logic or frontend components must pass the test suites before merging:

### Backend Testing
Run pytest from the backend directory:
```bash
cd backend
pytest -v
```
Ensure all 21+ existing unit and integration tests pass without regressions. When adding new endpoints or engine rules, write corresponding pytest test cases in `backend/tests/`.

### Frontend Linting & Build Verification
```bash
cd frontend
npm run lint
npm run build
```

---

## 4. Submitting Pull Requests

1. **Keep Pull Requests Focused**: Avoid mixing unrelated refactorings or multiple features in a single PR.
2. **Clear PR Descriptions**:
   - Describe the problem solved or feature added.
   - Reference any relevant GitHub issues.
   - Include before/after screenshots or terminal logs where relevant.
3. **Commit Messages**: Write concise, conventional commit messages:
   - `feat(api): add single-retry rate limit backoff to openrouter service`
   - `fix(map): repair leaflet icon anchor offset on mobile viewports`
   - `docs(readme): add 2-minute hackathon judge demo workflow`

Thank you for helping build reliable, explainable AI for emergency responders!
