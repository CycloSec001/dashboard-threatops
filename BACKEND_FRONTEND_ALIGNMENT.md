# Backend/frontend alignment

## Source of truth

The dashboard must treat the CycloSec gateway and the canonical schemas as the only production data sources:

- Gateway route registration: `Engines/backend/api/main.py`
- Response envelopes: `Engines/backend/api/schemas/response_models.py`
- KPI routes and definitions: `Engines/backend/api/routes/kpi.py` and `Engines/backend/services/kpi_engine/kpi_definitions.py`
- UnifiedEventV2 validation: `Engines/backend/api/services/ingest_v2.py`
- Canonical event schema: `cyclosec-schema/python/cyclosec_schema/artifacts/json-schema/unified_event_v2.schema.json`

The frontend now uses the authenticated API client and adapters for supported views. Local fixture/config arrays are empty and cannot produce production security data.

## Backend-backed frontend routes

These routes are allowed to render backend data:

| Frontend route | Backend source |
| --- | --- |
| Overview | `GET /api/v1/kpis/dashboards/{dashboard_id}` |
| Active incidents / incidents | `GET /api/v1/incidents` |
| Incident timeline | incidents plus incident investigation timeline endpoints |
| Alerts & signals / event explorer | `GET /api/v1/events` (`metadata.schema = UnifiedEventV2`) |
| Attack chains | `GET /api/v1/correlation/chains` |
| Correlation view | `GET /api/v1/correlation/rules` and `GET /api/v1/correlation/chains` |
| Threat hunting | `POST /api/query` |
| Investigation workspace | `GET /api/v1/investigations` and incident investigation sections |
| Evidence | `GET /api/v1/evidence` and incident-scoped evidence endpoints |
| Threat intelligence / IOC / actors / campaigns | `GET /api/v1/threat-intelligence/*` |
| Actions / approvals / playbooks | action, decision, and SOAR routes |
| Rules & policies | `GET /api/v1/policies` |
| Audit logs | `GET /api/v1/audit` |
| KPIs | `GET /api/v1/kpis/metrics` and individual metric routes |
| Security / detection / response analytics | `GET /api/v1/kpis/metrics` (only metrics returned by the tenant's KPI definitions are shown) |
| Exposure / response readiness | `GET /api/v1/kpis/metrics` (tenant KPI values only) |

Charts and statistics must be derived from `value`, `trend`, and `chart` in KPI responses or from fields in the returned domain records. An empty response is rendered as empty/partial/unavailable; it is never filled with a guessed value.

## Event mapping

UnifiedEventV2 is nested under `transport`, `event`, `pipeline`, `enrichment`, and `validation`. The frontend event adapter should use:

- `event.id`, `event.occurred_at`, `event.domain`, `event.type`, `event.category`, `event.action`, `event.outcome`, `event.severity`
- `event.actor`, `event.target`, `event.source`, `event.process`, `event.file`, `event.network`, `event.cloud`
- `transport.tenant_id`
- `enrichment.risk`, `enrichment.threat`, and `validation.status`

Flat normalized fields may only be used when they are explicitly produced by the backend normalization contract.

## Verified misalignments and production solutions

| Area | Current mismatch | Production solution |
| --- | --- | --- |
| Domain page rollout | The initial domain contracts exist, but provider/framework adapters and frontend field mapping are still rollout work. | Enable a page only after its adapter consumes the corresponding endpoint and preserves empty/503 states. Do not show fixture values. |
| KPI availability | KPI definitions are backend-owned, but not every metric is guaranteed to have source data or a populated `chart`. | Render `value`, `trend`, and `chart` only when present; expose missing-data status instead of defaulting to zero or a fabricated trend. |
| Domain record typing | Several gateway response models contain `dict[str, Any]` domain records. | Generate/version frontend adapters from the canonical schemas and add contract tests for each supported envelope. |
| Event availability | Events are Kafka/storage-backed and can return `503` while the gateway health endpoint remains healthy. | Show service-unavailable state and retry; do not replace events with sample records. |
| Query validation | `POST /api/query` accepts backend CSQL, rejects tenant overrides, and returns `400` for invalid fields. | Keep query text user-supplied, omit tenant context from the request, and map `400`/`403`/`503` to distinct UI states. |
| Tenant isolation | Tenant identity comes from JWT and query/body `tenant_id` overrides are rejected. | Never add tenant IDs from URL, local storage, or component state to API requests. |
| Custom dashboards | The old UI stored dashboard definitions and KPI cards in local storage, which is not a backend production contract. | Use `/api/v1/dashboards/custom`; widget KPI sources are validated against the backend KPI registry. |
| Live updates | The backend exposes polling endpoints, not a dashboard WebSocket/SSE contract. | Poll supported list/KPI endpoints with bounded refresh intervals; do not imply real-time streaming. |

## Domain capability contracts

The requested domain pages now have one backend boundary under `/api/v1`:

| Domain | API | Source/derivation |
| --- | --- | --- |
| Vulnerabilities | `/vulnerabilities` | Authoritative scanner record; existing vulnerability event topics remain the ingestion path |
| Cloud | `/cloud/resources` | Cloud connector/resource record; existing cloud event topics remain the ingestion path |
| Endpoint | `/endpoint/assets` | Existing endpoint telemetry normalized to an endpoint record |
| Network | `/network/observations` | Existing network telemetry normalized to an observation |
| Dark web | `/dark-web/observations` | Provider-neutral contract; no observations are created until an external provider is configured |
| Control effectiveness | `/controls/assessments` | Framework control assessment and evidence/finding counts |
| Compliance | `/compliance/assessments` | Tenant framework/control assessment results |
| Security posture | `/security-posture` | Derived from the domain records above; it is not a second ingestion pipeline |
| Custom dashboards | `/dashboards/custom` | Tenant-scoped widgets whose KPI sources are validated against the existing KPI registry |

Records are tenant-scoped in the backend repository and are never synthesized
for empty domains. The POST boundary is intended for authenticated connectors
and normalized ingestion workers, not for frontend fixture data. A missing
OpenSearch/domain repository returns `503` so the UI can show service
unavailability rather than a fabricated dashboard.

Dark web and compliance remain intentionally source/catalog-neutral until a
provider and first supported framework are selected. The contracts are ready
for those adapters, but no fake observations, controls, or framework results
are inserted.

The frontend now maps these routes through
[DomainDashboard.jsx](./src/views/DomainDashboard.jsx), which calls the
corresponding authenticated API endpoint, renders empty tenant data explicitly,
and distinguishes backend `503` availability failures from other request
errors. Route aliases such as `cloud_saas`, `network_visibility`, and
`dark_web_intel` resolve to the same domain contracts so sidebar navigation and
direct URLs remain consistent.

## Remaining backend work needed before enabling unavailable pages

For each unavailable page, the backend team should provide:

1. A registered gateway route with tenant/RBAC middleware (the domain routes
   above provide the initial boundary).
2. A versioned response model and envelope.
3. Field-level schema documentation, including nullability and missing-data semantics.
4. KPI definitions and source/aggregation metadata where charts are required.
5. Contract tests with empty, partial, permission-denied, and service-unavailable responses.
