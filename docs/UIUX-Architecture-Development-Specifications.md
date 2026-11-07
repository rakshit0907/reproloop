# ReproLoop — UI/UX, Architecture & Development Specifications

**Document status:** Product design and implementation reference  
**Version:** 1.0  
**Last updated:** 7 November 2026

---

## 1. Purpose and design direction

This document translates the product and technical requirements into screen behavior, interaction rules, component boundaries, implementation order, and engineering conventions.

**Experience principle:** make complex investigation understandable without exposing end users to developer jargon or hiding uncertainty from developers.

ReproLoop has two primary experiences:
1. **Reporter experience:** simple, reassuring, privacy-transparent, and status-oriented.
2. **Developer experience:** evidence-dense, traceable, reviewable, and explicit about uncertainty.

Do not build two disconnected products. Both experiences must refer to the same incident record and lifecycle.

## 2. Information architecture

### Reporter-facing routes

- `/report` — create a report.
- `/report/confirmation/:incidentId` — confirmation and next steps.
- `/track/:publicToken` — status and reporter-safe updates.
- `/privacy/diagnostics` — what is collected and what is never collected.

### Developer-facing routes

- `/app` — overview.
- `/app/incidents` — incident inbox.
- `/app/incidents/:incidentId` — incident workspace.
- `/app/projects` — projects.
- `/app/projects/:projectId` — project overview and repository connection.
- `/app/repositories` — connected repositories.
- `/app/settings` — workspace and integration settings.

The public tracking token must be high entropy, revocable, scoped to one incident, and must not expose internal findings, repository code, private logs, or workspace details.

## 3. Reporter journey and screen specifications

### 3.1 Report form

**Goal:** capture a useful report in under a minute without requiring technical knowledge.

Fields:
- Short title (required).
- “What were you trying to do?” (required).
- “What happened instead?” (required).
- “How can we reproduce it?” (optional but prompted).
- Screenshot attachment (optional).
- Browser diagnostics consent (optional, default off).

Microcopy:
- Expected: “What did you expect to happen?”
- Actual: “What happened instead?”
- Reproduction: “What steps led to this?”
- Consent: “Share limited browser diagnostics to help the team investigate. You can review the details before sending. This does not include passwords, cookies, or message contents.”

Behavior:
- Inline validation; preserve text after validation errors.
- Show file type and size constraints before upload.
- Display screenshot preview and remove action.
- Diagnostics remain disabled until the user actively opts in.
- If diagnostics are unavailable, report submission still works.
- Never block a basic report on extension installation or permissions.

### 3.2 Consent and evidence review

Before sending diagnostics, explain each category separately:
- Page URL (with query string removed or redacted).
- Page title.
- Timestamp.
- Screenshot selected by the user.
- Allowlisted console error metadata, if technically available.
- Limited failed-request metadata, if technically available.

Explicitly state what is not captured:
- Passwords, cookies, authorization headers, payment details.
- Full request/response bodies.
- Full browsing history.
- Keystrokes or screen recording.

Show a review step and a clear “Send report” action. Consent must be stored with scope and timestamp. Changing consent later must not retroactively imply permission for earlier collection.

### 3.3 Confirmation and tracking

Show:
- Incident reference.
- What happens next.
- Current status in plain language.
- Follow-up question when required.
- Reporter-safe workaround only when validated or clearly labelled as a suggestion.

Status language:
- Received — “Your report has been submitted.”
- Investigating — “The team is examining the report.”
- Need information — “A detail is needed to continue.”
- Fix under review — “A proposed change is being checked.”
- Resolved — “The team has reviewed the fix and marked the issue resolved.”

Do not expose model chain-of-thought, private repository paths, raw diagnostics, or internal confidence scores to reporters.

## 4. Developer experience and screen specifications

### 4.1 Overview dashboard

Primary information:
- New incidents.
- Investigating.
- Waiting for information.
- Fixes awaiting review.
- Verification failures.
- Recent activity.

Avoid vanity metrics in the MVP. Counts must be computed from persisted incident states.

### 4.2 Incident inbox

Columns or cards:
- Incident title.
- Project.
- Status.
- Priority/severity (if explicitly set or derived by a transparent rule).
- Created time.
- Related incident indicator.
- Evidence indicator.

Filters:
- Status.
- Project.
- Date.
- Has screenshot/diagnostics.
- Needs human attention.

Search by title, description, and incident reference. Avoid automatically setting severity solely from model-generated language.

### 4.3 Incident workspace

Recommended tabs/sections:

1. **Report** — reporter's original text, expected/actual behavior, reproduction steps, follow-up answers.
2. **Evidence** — screenshots, timestamps, redacted diagnostic metadata, consent scope.
3. **Investigation** — agent timeline, observations, hypotheses, confidence limitations, evidence links.
4. **Code analysis** — repository revision, relevant files/lines, related symbols, counter-evidence.
5. **Proposed fix** — diff, changed files, rationale, risk notes.
6. **Verification** — test plan, environment, command, result, exit code, logs.
7. **Activity** — audit events and human decisions.

Keep the original report visible or one click away. Never let generated summaries replace the source report.

### 4.4 Patch review

Show:
- Base commit SHA.
- Patch hash.
- File list.
- Unified diff with syntax highlighting.
- Why the change is proposed.
- Expected behavior after change.
- Regression test added/changed.
- Verification status and execution details.
- Approve and Reject actions.

Approval must be a deliberate action with a confirmation step. Approval means “accept this patch for the next authorized repository workflow”; it must not silently mean “merge and deploy”.

### 4.5 Verification result presentation

Use distinct states:
- **Passed:** test process ran and required checks passed.
- **Failed:** test process ran and one or more required checks failed.
- **Inconclusive:** runner or environment could not establish the result.
- **Not run:** no execution record exists.

Show test command, environment, base revision, patch hash, exit code, duration, and bounded logs. A green status must never be based on model interpretation alone.

## 5. Visual design system

Suggested direction: calm, technical, and trustworthy. Avoid the generic “AI neon dashboard” look.

### Color tokens

| Token | Suggested value | Use |
|---|---|---|
| `color-bg` | `#F5F6F8` | App background |
| `color-surface` | `#FFFFFF` | Cards and panels |
| `color-text` | `#17202A` | Primary text |
| `color-muted` | `#667085` | Secondary text |
| `color-border` | `#E4E7EC` | Dividers and borders |
| `color-primary` | `#3157D5` | Primary actions and links |
| `color-success` | `#16835D` | Verified success only |
| `color-warning` | `#B7791F` | Attention required |
| `color-danger` | `#C0393B` | Failed/destructive |
| `color-info` | `#2878A5` | Informational states |

These are initial design tokens, not immutable brand decisions. Check contrast against WCAG 2.2 AA before release. Do not communicate status through color alone; pair color with text and/or icon.

### Typography and spacing

- Use a highly legible UI sans-serif.
- Body text: 14–16 px; secondary metadata: never below 12 px.
- Clear hierarchy: page title, section heading, card title, supporting text.
- Spacing scale: 4, 8, 12, 16, 24, 32, 40, 48 px.
- Radius: 8–12 px for controls/cards; consistent across the app.
- Use restrained shadows; prefer borders and whitespace.
- Maintain visible focus indicators and keyboard navigation.

### Responsive behavior

- Desktop: persistent sidebar and wide incident workspace.
- Tablet: collapsible sidebar; stacked summary panels.
- Mobile: single-column layouts; diff viewer may use horizontal scrolling or a dedicated full-screen view.
- Do not hide security/consent information on small screens.

## 6. Component inventory

### Shared components

- `AppShell`
- `SidebarNavigation`
- `TopBar`
- `PageHeader`
- `StatusBadge`
- `MetricCard`
- `FilterBar`
- `SearchInput`
- `EmptyState`
- `ErrorState`
- `LoadingSkeleton`
- `ConfirmDialog`
- `Toast`
- `Timeline`
- `EvidenceCard`
- `CodeReference`
- `DiffViewer`
- `TestResultPanel`
- `ConsentPanel`

### Domain components

- `IncidentList`
- `IncidentSummary`
- `ReportForm`
- `ScreenshotUploader`
- `DiagnosticConsent`
- `FollowUpQuestionCard`
- `AgentRunTimeline`
- `FindingCard`
- `RepositoryConnectCard`
- `PatchReviewPanel`
- `VerificationDetails`
- `ReporterStatusCard`

Keep domain-specific data fetching and state out of generic visual components. Shared components should not contain hidden authorization decisions.

## 7. Interaction and accessibility requirements

- All functionality must be keyboard accessible.
- Focus order follows visual order.
- Buttons and icon-only controls have accessible names.
- Form errors are associated with inputs and announced.
- Dialogs trap focus and return focus on close.
- Status updates use accessible live regions without excessive announcements.
- Minimum practical target size: 44 × 44 CSS px where possible.
- Text and controls meet WCAG 2.2 AA contrast requirements.
- Avoid motion that is necessary to understand state; respect reduced-motion settings.
- Do not rely on drag-and-drop as the only way to perform an action.
- Code diffs must remain readable with keyboard and screen readers where practical.

## 8. Application architecture and component boundaries

### Frontend structure

```text
apps/web/src/
├── app/
│   ├── (public)/
│   │   ├── report/
│   │   └── track/[token]/
│   └── (workspace)/
│       └── app/
│           ├── incidents/
│           ├── projects/
│           ├── repositories/
│           └── settings/
├── components/
│   ├── ui/
│   └── domain/
├── features/
│   ├── incidents/
│   ├── evidence/
│   ├── investigation/
│   ├── patches/
│   └── verification/
├── lib/
│   ├── api-client.ts
│   ├── auth.ts
│   └── permissions.ts
└── styles/
```

### Backend structure

```text
apps/api/src/
├── auth/
├── workspaces/
├── projects/
├── incidents/
├── evidence/
├── repositories/
├── ai/
│   ├── agents/
│   ├── orchestrator/
│   ├── tools/
│   ├── prompts/
│   └── providers/
├── patches/
├── verification/
├── audit/
└── database/
```

### Responsibility boundaries

- Frontend: presentation, user input, client-side validation for usability, rendering persisted state.
- API: authentication, authorization, validation, business rules, state transitions, persistence.
- Orchestrator: workflow coordination and bounded job execution.
- Agents: structured reasoning over explicitly supplied context.
- Tool registry: controlled access to data and actions.
- Sandbox: isolated code/test execution.
- Provider adapters: model, repository, storage, and hosting integrations.

## 9. Development standards

### General

- TypeScript strict mode.
- Shared DTO and schema definitions where practical.
- No `any` for external model output; parse unknown data into validated schemas.
- Consistent error response shape and request correlation IDs.
- Environment variables for secrets and provider configuration.
- No secrets in source control or client bundles.
- Small, reviewable commits with descriptive messages.
- Keep migrations and seed data in source control.

### API standards

- Version routes under `/api/v1`.
- Validate all request bodies, query parameters, path identifiers, and model outputs.
- Enforce authorization in backend guards/services, not just hidden UI controls.
- Use pagination for incident lists and event timelines.
- Use idempotency for job-start and patch-creation operations.
- Return stable error codes; avoid leaking stack traces to clients.

### Frontend standards

- Handle loading, empty, error, and success states for every data-backed view.
- Keep original user report distinct from AI summary.
- Optimistically update only reversible low-risk interactions.
- Use server state for persisted records; do not treat local component state as authoritative.
- Avoid polling too frequently; prefer SSE for active investigations where practical.

### AI/agent standards

- Every agent has a single defined responsibility.
- Use versioned prompts and structured output schemas.
- Keep context minimal and relevant.
- Treat retrieved repository text, issue text, logs, and screenshots as untrusted data.
- Agent findings must distinguish observation from hypothesis.
- Record evidence references and limitations.
- Never expose private chain-of-thought; provide concise rationale and evidence instead.
- Backend validates tool requests and enforces permissions.
- Bound tool calls, retries, time, and output size.

## 10. Implementation sequence

The order below protects the end-to-end product from being displaced by surface-level polish.

### Phase 0 — Provider and scope validation

- Inspect AdaptionLabs.ai credit dashboard/terms.
- Verify BharatCode API contract with a minimal server-side request.
- Confirm hackathon rules, submission format, and deadline from official source.
- Choose one sample application and one reproducible bug.
- Freeze MVP scope and cut extension if schedule becomes unsafe.

**Exit criteria:** API connectivity and provider limits are known; sample bug is reproducible; scope is written down.

### Phase 1 — Foundation

- Create monorepo and workspace scripts.
- Bootstrap Next.js and NestJS.
- Configure PostgreSQL and TypeORM migrations.
- Add environment validation and `.env.example`.
- Add basic workspace/project/incident entities.
- Implement report creation and screenshot upload.
- Seed the buggy sample application.

**Exit criteria:** a report can be created and retrieved from the database.

### Phase 2 — Evidence and intake

- Add diagnostic consent record.
- Add redaction pipeline and evidence metadata.
- Implement Intake Agent with strict schema.
- Add follow-up question/answer flow.
- Persist agent runs and timeline events.

**Exit criteria:** report becomes a structured incident with missing information clearly represented.

### Phase 3 — Investigation

- Implement Diagnostic Agent.
- Implement Pattern Agent with candidate-only duplicate suggestions.
- Implement authorized repository search/read tools.
- Implement Root Cause Agent with file/line evidence.
- Add developer incident workspace.

**Exit criteria:** seeded bug investigation produces traceable, qualified findings.

### Phase 4 — Patch and verification

- Implement patch artifact generation.
- Validate diff paths and size.
- Generate regression test.
- Run tests in isolated environment.
- Persist test-run metadata and logs.
- Implement approval/rejection flow.

**Exit criteria:** one seeded incident produces a patch and an actual, recorded test result.

### Phase 5 — Product polish and demo

- Improve reporter status and developer dashboard.
- Add progress streaming.
- Add extension only if the core workflow is stable.
- Add empty/error/loading states and accessibility checks.
- Prepare README, architecture diagrams, seeded demo data, and short demo script.

**Exit criteria:** a clean end-to-end demo can be repeated from a fresh setup.

## 11. Hackathon delivery plan

Given the short window, prioritize a single reliable vertical slice rather than broad platform coverage.

| Priority | Deliverable | Cut decision |
|---|---|---|
| P0 | Report form + seeded incident | Never cut |
| P0 | Intake and repository investigation | Never cut |
| P0 | Patch + actual test verification | Never cut |
| P0 | Developer approval and incident timeline | Never cut |
| P1 | Screenshot upload | Keep if straightforward |
| P1 | Consent-based diagnostic metadata | Keep minimal |
| P1 | SSE progress | Replace with polling if needed |
| P1 | Browser extension | Cut first if behind |
| P2 | Analytics, multiple repository providers, voice | Post-hackathon |

## 12. Definition of ready and definition of done

### Definition of ready

A task is ready when:
- User value and acceptance criteria are clear.
- API/data dependencies are known.
- Security/privacy implications are identified.
- Required UI states are listed.
- Provider dependency is verified or has a fallback.

### Definition of done

A task is done when:
- Acceptance criteria pass.
- Loading, empty, error, and success states exist.
- Validation and authorization are enforced.
- Tests cover primary and failure paths.
- Sensitive data is redacted.
- Documentation and migrations are updated.
- No placeholder action is presented as functional.
- Demo path remains reproducible.

## 13. Demo script

1. Open the seeded sample application.
2. Trigger the known bug.
3. Open ReproLoop and submit the problem in ordinary language.
4. Attach a screenshot and explicitly choose whether to share diagnostics.
5. Show the incident created and the intake summary.
6. Start investigation and show agent events as they are persisted.
7. Open the root-cause findings and inspect repository references.
8. Show the proposed diff and regression test.
9. Run verification and display the actual test result.
10. Approve or reject the patch.
11. Show the updated reporter-facing status.

The demo must include at least one failure or uncertainty state if possible, to demonstrate that the product does not falsely label every AI output as success.

## 14. Open decisions log

| Decision | Current position | Owner/action |
|---|---|---|
| AdaptionLabs credits | Use only after verifying eligible services and terms | Inspect dashboard and record limits/expiry |
| BharatCode model/API | Provider adapter; exact API contract pending validation | Run minimal API smoke test |
| Extension timing | P1, not a dependency for core demo | Decide after patch verification works |
| Repository auth | Prefer GitHub App or narrowly scoped authorization | Confirm hackathon demo needs |
| Sandbox provider | Separate disposable execution boundary | Select simplest secure option available |
| Authentication depth | Keep minimum viable while protecting workspace data | Decide whether demo requires full multi-user auth |
| Public reporter tracking | High-entropy scoped token | Implement only if time permits |

## 15. Change management

When a requirement or architecture decision changes:
1. Update the relevant section in this document.
2. Update the PRD if user value, scope, or acceptance criteria change.
3. Update the TRD if APIs, data, integrations, security, or deployment change.
4. Record material trade-offs in an ADR.
5. Add or revise tests and acceptance criteria.
6. Update version/date and a short change note.

Do not allow implementation to silently diverge from the three reference documents. The documents are living baselines, not immutable contracts.
