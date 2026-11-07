# ReproLoop — Product Requirements Document (PRD)

**Document status:** Baseline for hackathon MVP  
**Version:** 1.0  
**Last updated:** 7 November 2026  
**Product:** ReproLoop  
**Tagline:** From user-reported software problems to developer-verified fixes.

---

## 1. Executive summary

ReproLoop is a software problem-resolution platform that connects end-user reports with developer investigation and verified remediation. A user can report a problem in plain language, attach a screenshot, and—only after explicit consent—attach a limited set of browser diagnostics. ReproLoop structures the report, identifies related incidents, investigates an authorized code repository, proposes a minimal patch, and runs relevant tests in a controlled environment. Developers review and approve any proposed change.

ReproLoop is not simply an AI bug-report writer, error dashboard, or autonomous code fixer. Its defining workflow is the **closed loop** between the user's observed problem and a developer-reviewed, test-evidenced resolution.

**Product promise:** turn an unclear software problem into an evidence-backed, reproducible, reviewable resolution path—without pretending that an AI hypothesis is a verified fix.

## 2. Problem statement

### 2.1 User problem

People using web applications often cannot describe technical failures precisely. They may say “the page is stuck”, “it doesn't work”, or “I can't save”, without knowing which steps, browser conditions, network failures, or application state caused the issue. They rarely know what evidence a developer needs.

### 2.2 Developer problem

Developers receive incomplete reports, spend time asking follow-up questions, trying to reproduce issues, searching logs and code, and deciding whether a proposed fix actually resolves the reported behavior. Existing tools commonly solve only part of this workflow.

### 2.3 Why existing approaches leave a gap

- Issue trackers organize work but depend on the quality of incoming reports.
- Error-monitoring products capture technical exceptions but may not capture the user's intent and experience.
- Bug-capture tools improve evidence collection but do not necessarily carry the incident through repository investigation, patch proposal, and test verification.
- AI coding assistants can suggest changes but may not have the incident evidence, reproducibility context, or controlled verification needed to establish that the change fixes the reported problem.

ReproLoop must prove the value of connecting these stages. It must not claim that no competitor offers any overlapping feature.

## 3. Product vision and positioning

**Vision:** make software problems easier for users to report and safer for teams to resolve.

**Positioning:** an AI-assisted incident-to-fix workflow for software teams, combining user-context capture, evidence-based multi-agent investigation, proposed code changes, and controlled verification.

**Primary differentiator:** a traceable chain from user report → captured evidence → investigation findings → proposed patch → actual test result → human approval → user-facing status.

## 4. Goals and non-goals

### 4.1 MVP goals

1. Let a user submit a clear problem report with optional screenshot evidence.
2. Collect a small, transparent set of browser diagnostics only after consent.
3. Ask targeted follow-up questions when essential reproduction details are missing.
4. Group likely duplicate reports without silently discarding distinct incidents.
5. Investigate a connected, authorized sample repository using evidence and code references.
6. Generate a minimal proposed patch and a relevant regression test.
7. Run tests in an isolated environment and report the real outcome.
8. Keep a developer in control of approval and merge/deployment.
9. Show an auditable timeline of agent actions, findings, decisions, and test output.

### 4.2 Non-goals for the hackathon MVP

- Fully autonomous merging, deployment, or production modification.
- Guaranteed root-cause identification.
- Universal support for every framework, browser, repository host, or programming language.
- Full session replay, keystroke recording, audio/video recording, or broad browsing-history collection.
- Capturing request/response bodies, cookies, credentials, authorization headers, or payment data.
- Replacing a team's issue tracker, observability platform, CI/CD system, or source-control provider.
- Multi-tenant enterprise billing, complex organization administration, or marketplace integrations unless time permits.
- Voice reporting and multilingual speech workflows in the initial demo.

## 5. Target users and personas

### Persona A — End user / reporter

- Uses a web application but is not expected to understand its internals.
- Wants to report a problem quickly and know what happens next.
- Needs clear consent, privacy explanations, and a way to track status.
- Success means the report is understood and progress is visible.

### Persona B — Developer / maintainer

- Owns or contributes to a software repository.
- Needs reproducible evidence, useful hypotheses, code references, and a safe proposed fix.
- Wants to reduce triage time without surrendering code-review control.
- Success means less manual investigation and a testable change with transparent evidence.

### Persona C — Team lead / project owner

- Needs visibility into incident volume, recurring failures, unresolved blockers, and verification status.
- Wants traceability and predictable human approval boundaries.
- Success means better prioritization and fewer repeated reports.

## 6. Core user journeys

### 6.1 Reporter journey

1. Open the report page or extension popup.
2. Describe what they expected and what happened.
3. Optionally add a screenshot.
4. Review the diagnostic-capture explanation and choose whether to share diagnostics.
5. Submit the report.
6. Answer concise follow-up questions if needed.
7. View incident status, a safe workaround if one is available, and the final resolution summary.

### 6.2 Developer journey

1. Create a project and connect an authorized repository.
2. Review incoming incidents and evidence.
3. Start an investigation.
4. Inspect agent findings, cited evidence, confidence, and unresolved questions.
5. Review a proposed patch and generated regression test.
6. Inspect actual test output and verification status.
7. Approve or reject the patch; any merge/deployment occurs through an explicit, separately authorized workflow.
8. Review the reporter-facing status and resolution explanation.

## 7. Functional requirements

Priority labels: **P0** required for MVP; **P1** desirable if time permits; **P2** post-hackathon.

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| FR-01 | Submit incident text | P0 | Reporter can submit a title/description; server validates and stores it. |
| FR-02 | Attach screenshot | P0 | User can attach an image; file type/size are validated; image is access-controlled. |
| FR-03 | Consent-based diagnostics | P0 | Diagnostics are off until consent; consent scope is visible; report records consent choice and timestamp. |
| FR-04 | Diagnostic redaction | P0 | Sensitive fields are excluded or redacted before persistence; no credentials or cookies are collected. |
| FR-05 | Follow-up questions | P0 | Intake agent returns structured missing-information questions; reporter can answer them. |
| FR-06 | Incident status | P0 | Reporter and developer see persisted workflow status, not transient model claims. |
| FR-07 | Duplicate suggestions | P0 | System suggests related incidents with rationale; a human or explicit rule confirms linkage. |
| FR-08 | Repository connection | P0 | Developer connects a repository with least-privilege authorization or uses a seeded sample repository. |
| FR-09 | Evidence-backed investigation | P0 | Findings include evidence references (incident evidence or repository path/line where available). |
| FR-10 | Proposed patch | P0 | Patch is stored as a reviewable diff; no automatic merge or default-branch push. |
| FR-11 | Regression test | P0 | Agent proposes or creates a test associated with the reported behavior. |
| FR-12 | Controlled verification | P0 | Tests execute in an isolated environment; raw result, command, exit code, and logs are recorded. |
| FR-13 | Human approval | P0 | Developer explicitly approves/rejects; approval is audited. |
| FR-14 | Reporter-facing resolution | P0 | User sees a truthful status and explanation; no “fixed” claim before evidence and approval. |
| FR-15 | Live progress | P1 | UI streams persisted events or polls for progress without being the source of truth. |
| FR-16 | Browser extension | P1 | Extension captures page metadata, screenshot, and narrowly scoped diagnostics after consent. |
| FR-17 | Incident analytics | P2 | Team sees trends, recurrence, and resolution-time metrics. |

## 8. Multi-agent product behavior

Agents are specialized workers coordinated by a deterministic backend orchestrator. They are not independent autonomous actors with unrestricted access.

| Agent | Responsibility | Must produce | Must not do |
|---|---|---|---|
| Intake | Normalize report and identify missing facts | Structured incident summary, expected/actual behavior, questions | Invent reproduction steps or diagnose without evidence |
| Diagnostic | Interpret supplied screenshot and permitted browser metadata | Observations, timeline, candidate signals | Treat every console warning as causal |
| Pattern | Find similar incidents | Candidate links, similarity rationale | Auto-close or merge incidents solely on semantic similarity |
| Root Cause Investigator | Search authorized repository and trace relevant code | Ranked hypotheses with file/line evidence and uncertainty | Claim certainty without supporting evidence |
| Repair | Draft minimal patch and regression test | Diff, rationale, expected behavior, test proposal | Merge, deploy, push to protected branch, or run arbitrary shell |
| Verification | Execute approved test plan in sandbox | Passed/Failed/Inconclusive/Not run, command, exit code, logs | Claim success without actual execution output |

### 8.1 Orchestrator responsibilities

- Own workflow state and allowed transitions.
- Validate agent output against schemas.
- Enforce tool permissions and resource limits.
- Persist each agent run and event before publishing progress.
- Apply bounded retries, timeouts, cancellation, and maximum-step limits.
- Stop and request human input when evidence is insufficient or a safety boundary is reached.

### 8.2 Workflow states

`RECEIVED → INTAKE → DIAGNOSIS → PATTERN_ANALYSIS → ROOT_CAUSE_ANALYSIS → PATCH_GENERATION → VERIFICATION → AWAITING_APPROVAL → RESOLVED`

Additional terminal or exception states:

`NEEDS_MORE_INFORMATION`, `DUPLICATE`, `VERIFICATION_FAILED`, `INVESTIGATION_FAILED`, `CANCELLED`.

A state transition must be performed by backend logic, not inferred from model prose.

## 9. MVP scope and demo definition

### Must demonstrate end-to-end

1. A seeded web application contains a reproducible bug.
2. A reporter submits a natural-language issue and screenshot.
3. The system asks a useful follow-up or uses sufficient supplied context.
4. The system attaches permitted evidence and identifies a related report if present.
5. Agents inspect the seeded repository and cite relevant code.
6. A minimal patch and regression test are generated.
7. A test runs in isolation and its real output is shown.
8. A developer approves or rejects the proposed patch.
9. The incident timeline and reporter-facing status update.

### Cut order if time is constrained

1. Preserve the end-to-end happy path on one seeded application/repository.
2. Preserve truthful test verification and human approval.
3. Preserve report intake, evidence, and investigation traceability.
4. Defer the browser extension before compromising the above.
5. Defer analytics, complex auth, multi-provider repository support, and broad agent autonomy.

A polished extension with no verified repair loop is a weaker MVP than a reliable web-only closed loop.

## 10. Success metrics

Hackathon metrics should be measured on a fixed demo dataset; do not present targets as achieved results.

| Metric | Definition | MVP measurement |
|---|---|---|
| Report completeness | Reports with expected behavior, actual behavior, and useful reproduction context | Count / total seeded reports |
| Intake usefulness | Follow-up questions judged necessary and answerable | Human review of sample cases |
| Duplicate precision | Correct duplicate suggestions / all duplicate suggestions | Labeled test set |
| Evidence coverage | Findings with traceable evidence / total findings | Agent output audit |
| Reproduction success | Seeded incidents reproduced by test or documented steps | Reproduced / attempted |
| Verification integrity | Test statuses backed by stored execution records | Must be 100% |
| Human reviewability | Patches with diff, rationale, test, and status | Count / total proposed patches |
| Time-to-triage | Time from report submission to first useful investigation result | Demo timestamps |

## 11. UX and trust requirements

- Explain diagnostic collection in plain language before permission is requested.
- Diagnostics must be optional and narrowly scoped.
- Provide a visible indication when capture is active.
- Allow users to review what will be sent and remove an attachment before submission.
- Never expose raw secrets or sensitive network information in the dashboard.
- Label model output as an observation, hypothesis, recommendation, or verified result.
- Show evidence and uncertainty alongside findings.
- Distinguish `Passed`, `Failed`, `Inconclusive`, and `Not run`.
- Do not display “Resolved” until the configured approval and resolution criteria are satisfied.

## 12. Security, privacy, and compliance requirements

- Collect the minimum data required for a report.
- Never collect passwords, cookies, authorization headers, payment data, or full request/response bodies.
- Redact query parameters and identifiers where they may contain sensitive data.
- Use least-privilege repository scopes and encrypt stored tokens.
- Enforce workspace/project ownership on every resource access.
- Treat screenshots, issue text, repository files, and logs as untrusted input; protect agents from prompt injection.
- Run repository code and tests in disposable, resource-limited sandboxes with no ambient credentials.
- Record access, approval, patch, and verification events.
- Provide a deletion/retention policy before production use.

## 13. Assumptions, constraints, and open decisions

| Item | Current baseline | Must verify / decide |
|---|---|---|
| AI inference | BharatCode model API | Exact model availability, request format, rate limits, context limits, pricing/credits, retention |
| Adaption credits | BharatCode's official Build League page advertises 1,000 free Adaption credits per participant to train a model for the project | Confirm the credit grant in the user's Adaption account, exact product scope, expiry, limits, and whether any non-training services are eligible |
| Source control | GitHub | OAuth/App permissions and webhook scope |
| Execution | Playwright + predefined test commands | Sandbox provider and network policy |
| Data store | PostgreSQL + TypeORM | Hosting and backup approach |
| Frontend | Next.js + TypeScript + Tailwind | Deployment provider |
| Backend | NestJS + TypeScript | Deployment provider |
| Extension | Chrome Manifest V3 | Permission feasibility and review time |

**Important:** BharatCode's official Build League page describes 1,000 free Adaption credits per participant for training a model for the project. This is not evidence that the credits can pay for general hosting, model inference, database, or storage. Confirm the actual grant and eligible Adaption product in the user's account before planning usage. Treat model training as optional: ReproLoop's MVP can use BharatCode inference without training a custom model. Do not add a training pipeline unless a measurable product need and sufficient time/data justify it. Keep model and infrastructure integrations behind adapters.

## 14. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Agent produces plausible but false root cause | Incorrect patch | Require evidence citations, uncertainty, human review |
| Generated patch does not fix user behavior | False resolution | Regression test and isolated execution; show actual result |
| Test environment executes malicious repository code | Infrastructure compromise | Disposable sandbox, no secrets, CPU/memory/time limits, restricted network |
| Browser capture leaks sensitive data | Privacy harm | Explicit consent, allowlist metadata, redaction, preview |
| Scope too broad for hackathon | Incomplete demo | One seeded app, one repo, one language/framework, one complete path |
| Model/API unavailable or credits insufficient | Demo blocked | Provider adapter, fallback model/mock fixture, deterministic demo mode |
| Duplicate grouping hides distinct bugs | Lost reports | Suggestions only; preserve original incidents |
| Prompt injection in repository or issue text | Tool misuse | Treat all retrieved content as untrusted data; backend permission checks |

## 15. Release acceptance checklist

- [ ] Reporter can create an incident and attach an image.
- [ ] Diagnostic consent is explicit, recorded, and optional.
- [ ] Sensitive browser/network fields are not persisted.
- [ ] Agent outputs are schema-validated and persisted.
- [ ] Every finding is labelled and traceable to evidence or marked unsupported.
- [ ] Repository access is scoped and auditable.
- [ ] Patch is a diff and cannot auto-merge.
- [ ] Verification status comes from a real execution record.
- [ ] Failed/inconclusive tests cannot be displayed as passed.
- [ ] Human approval is required.
- [ ] Reporter status is truthful and understandable.
- [ ] Demo can run with documented setup and a seeded reproducible bug.

## 16. Glossary

- **Incident:** a user-reported software problem.
- **Evidence:** screenshot, user-provided details, or consented diagnostic metadata associated with an incident.
- **Finding:** an observation or hypothesis produced during investigation.
- **Patch:** a proposed code change represented as a diff.
- **Regression test:** a test intended to fail before the fix and pass after it.
- **Verification:** recorded execution of a test or check against a specific patch.
- **Human approval:** explicit developer decision to accept or reject a proposed patch.
- **Closed loop:** traceable progression from report through verified, reviewed resolution.
