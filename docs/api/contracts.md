# CrisisLens AI — API Reference & Schema Contracts

FastAPI automatically serves interactive Swagger documentation at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/api/v1/openapi.json`

## Domain Schemas Cross-Reference

| Entity | Pydantic Class | TypeScript Interface |
|---|---|---|
| Report | `app.schemas.domain.Report` | `domain.ts::Report` |
| Evidence | `app.schemas.domain.Evidence` | `domain.ts::Evidence` |
| EvidenceLink | `app.schemas.domain.EvidenceLink` | `domain.ts::EvidenceLink` |
| Incident | `app.schemas.domain.Incident` | `domain.ts::Incident` |
| Impact | `app.schemas.domain.Impact` | `domain.ts::Impact` |
| Need | `app.schemas.domain.Need` | `domain.ts::Need` |
| Resource | `app.schemas.domain.Resource` | `domain.ts::Resource` |
| ActionPlan | `app.schemas.domain.ActionPlan` | `domain.ts::ActionPlan` |
| IncidentSnapshot | `app.schemas.domain.IncidentSnapshot` | `domain.ts::IncidentSnapshot` |
| Contradiction | `app.schemas.domain.Contradiction` | `domain.ts::Contradiction` |
