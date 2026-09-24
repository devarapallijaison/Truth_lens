# TruthLens — Codex Project Instructions

## 1. Project Overview

TruthLens is a misinformation-triage web application.

The system:
1. Lets the public submit viral claims.
2. Automatically detects predefined risk signals.
3. Keeps new claims in an `UNVERIFIED` state.
4. Provides a reviewer workflow where a human reviewer records `VERIFIED_TRUE`, `VERIFIED_FALSE`, or `MISLEADING` with a short note.
5. Publishes reviewed claims in a public feed.
6. Optionally lets public users express community agreement using a one-vote-per-browser `I Agree` reaction.

TruthLens must NOT automatically decide whether a claim is factually true or false. Automated logic is for risk triage only.

---

## 2. Technology Stack

Use this stack unless there is a strong technical reason not to:

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB Atlas
- ODM: Mongoose
- Language: JavaScript
- Version control: Git + public GitHub repository
- Development IDE: Visual Studio Code

Architecture:

Browser
  -> React/Vite frontend
  -> Express/Node.js API
  -> Mongoose
  -> MongoDB Atlas

The frontend must not connect directly to MongoDB. Database operations must go through the Express backend.

Do not introduce Firebase, Supabase, or a second database unless explicitly requested.

---

## 3. Required Features

All five required features must be implemented before optional features are prioritized.

### Feature 1 — Submit a Claim

The public can submit:

- Claim text
- Source platform:
  - WhatsApp
  - X
  - Instagram
  - Other
- Category:
  - Politics
  - Health
  - Finance
  - Other

A newly submitted claim must start as:

`UNVERIFIED`

Store its submission timestamp.

---

### Feature 2 — Risk Flags

Automatically detect the required risk signals:

- Sensational
- Shouting
- Unsourced

High Risk is derived when the claim has 2 or more risk flags.

Risk detection should be deterministic and testable. Do not use an LLM to decide these required flags.

Examples from the brief:

- Sensational examples include phrases such as `breaking`, `shocking`, and `share before deleted`.
- Shouting means more than 50% of alphabetic characters are uppercase.
- Unsourced means no source link is provided/available according to the implementation.

Risk level is a triage signal. It is NOT a factual verdict.

---

### Feature 3 — Review Workflow

A reviewer can open an `UNVERIFIED` claim and select exactly one:

- `VERIFIED_TRUE`
- `VERIFIED_FALSE`
- `MISLEADING`

The reviewer also enters a short review note.

The review changes the claim's status and records the review time.

TruthLens records the reviewer's judgment. TruthLens itself must not claim that its automated risk system proved the claim true or false.

---

### Feature 4 — Public Feed

The public feed must:

- Display all claims.
- Show clear status badges.
- Allow filtering by category.
- Allow filtering by status.
- Apply DP1 feed ordering.

Unverified claims must remain publicly visible.

The UI must clearly distinguish:

`UNVERIFIED`

from:

`VERIFIED_TRUE`
`VERIFIED_FALSE`
`MISLEADING`

---

### Feature 5 — Detail View

A claim detail page must display:

- Full claim text
- Source platform
- Category
- Risk flags
- Risk level
- Current status
- Reviewer note, when available
- Submission time
- Review time, when available
- Optional `I Agree` reaction count, when implemented

---

## 4. Decision Points

These are deliberate product decisions and must be implemented consistently.

### DP1 — Feed Order

Decision:

**Risk first, then recency.**

Implementation:

1. Higher-risk claims appear before lower-risk claims.
2. Within the same risk level, newer claims appear first.

Reason:

TruthLens is a triage product, so claims with more detected warning signals should receive earlier attention. Recency then surfaces newer claims within the same risk level.

Important:

Risk level is not the same as truth status.

---

### DP2 — Visibility

Decision:

**Unverified claims remain publicly visible.**

Every unreviewed claim must show a prominent:

`UNVERIFIED`

badge.

Reason:

This makes the review pipeline transparent while avoiding the presentation of an unreviewed claim as established fact.

Do not label an unverified claim as true, false, or misleading.

---

### DP3 — Editing

Decision:

**Claims are immutable after submission.**

Once a claim is submitted:

- The original claim text cannot be edited.
- The source platform cannot be changed.
- The category cannot be changed.
- The automatically calculated risk flags must remain associated with the submitted claim.
- The reviewer reviews the exact submitted content.

If a materially different claim needs to be submitted, create a new claim.

Reason:

The review result must remain tied to the content that was actually submitted and reviewed.

---

## 5. No Authentication

Do NOT implement:

- Login
- Signup
- Passwords
- JWT authentication
- OAuth
- User accounts
- Role-based authentication

The hackathon requires graders to access the application without creating an account.

The reviewer dashboard must therefore be directly accessible during the hackathon demo.

Do not add an authentication system unless the hackathon requirements are explicitly changed.

---

## 6. Reviewer Rules

The application includes a reviewer workflow, but the hackathon brief does not define a separate external organization or fact-checking company.

Do not invent:

- A fake verification organization
- External reviewer credentials
- A complex reviewer identity system
- External fact-checking integrations

For this MVP, model the reviewer simply as the human role responsible for recording the review result.

The reviewer:

1. Opens an unverified claim.
2. Reads the original claim.
3. Sees the automated risk flags.
4. Chooses True, False, or Misleading.
5. Adds a short note.
6. Saves the review.

The reviewer result becomes visible on the public feed/detail page.

---

## 7. Optional Community “I Agree” Reaction

This is an optional enhancement.

Implement it ONLY after all five required features and the three Decision Points are stable.

### Purpose

A public user can express agreement with a reviewed claim.

Preferred label:

`I Agree`

Do not call it factual verification.

### Critical Rule

`I Agree` is a community reaction.

It is NOT:

- A fact-check
- Evidence
- Independent confirmation
- A replacement for the reviewer
- A mechanism for changing the claim status

For example:

`VERIFIED TRUE`
`Reviewer note: Confirmed by reviewer.`
`👍 I Agree — 127`

The `127` means 127 recorded community reactions. It must not be described as 127 factual confirmations.

### One Vote Per Browser

Because authentication is prohibited, use browser-local state to enforce one reaction per browser.

Recommended implementation:

- Store the user's reacted claim IDs in `localStorage`.
- Before accepting an `I Agree` action, check whether that claim ID is already stored locally.
- If already present, do not increment the count again.
- After a successful reaction, store the claim ID locally.
- The UI should change from `I Agree` to an appropriate state such as `Agreed`.
- A page refresh must not allow another vote from the same browser.

Example:

`localStorage["truthlens_agreed_claims"]`

may contain an array of claim IDs.

### Important Limitation

One-vote-per-browser is a lightweight MVP control, not secure identity-based voting.

It can be bypassed by clearing browser storage, using another browser, or using another device.

Do not claim that it prevents duplicate voting across users/devices.

### Backend Rule

The backend must validate the reaction request and increment the count safely.

Do not allow the client to submit an arbitrary new `agreeCount`.

The client should request an action such as:

`POST /api/claims/:id/agree`

The server performs the increment.

The reaction must never modify:

- `status`
- `reviewerNote`
- `riskFlags`
- `riskLevel`
- original claim text

---

## 8. Suggested Data Model

Use a `claims` collection.

Recommended fields:

- `_id`
- `text`
- `sourcePlatform`
- `category`
- `riskFlags`
- `riskLevel`
- `status`
- `reviewerNote`
- `createdAt`
- `reviewedAt`
- `agreeCount`

The original claim fields are immutable after creation.

---

## 9. Suggested API

Suggested application API:

- `POST /api/claims` — create a claim and calculate risk flags.
- `GET /api/claims` — public feed, filters, and DP1 ordering.
- `GET /api/claims/:id` — claim detail.
- `GET /api/review/claims` — claims awaiting review.
- `PATCH /api/claims/:id/review` — save reviewer status and note.
- `POST /api/claims/:id/agree` — optional community reaction.

These are the application's internal API endpoints. Do not claim that they are the hackathon Standard API unless the actual Standard API specification has been implemented.

---

## 10. Development Priorities

Priority order:

1. Project foundation
2. MongoDB connection and Claim model
3. Submit Claim
4. Deterministic Risk Flags
5. Public Feed
6. Filters
7. Detail View
8. Reviewer Dashboard
9. DP1 / DP2 / DP3 enforcement
10. Testing
11. Deployment
12. README.md
13. DECISIONS.md
14. Optional `I Agree` feature
15. UI polish

Do not sacrifice required functionality for visual polish.

---

## 11. Coding Rules for Codex

- Inspect the existing project before changing files.
- Do not rewrite working code unnecessarily.
- Keep frontend and backend responsibilities separate.
- Use clear component/module names.
- Handle loading, error, and empty states.
- Validate user input.
- Never expose MongoDB credentials in frontend code.
- Use environment variables for secrets.
- Do not commit `.env` files containing secrets.
- Keep API responses predictable.
- Prefer simple, deterministic implementations.
- Avoid unnecessary libraries.
- Do not add authentication.
- Do not add features outside the specification without asking first.
- After significant changes, run the relevant tests/build and report failures.
- Preserve existing working features when implementing new ones.

---

## 12. Definition of Done

The project is ready for submission only when:

- All five required features work.
- DP1 works.
- DP2 works.
- DP3 works.
- No authentication is present.
- Claims cannot be edited after submission.
- Reviewer workflow works.
- Public feed and filters work.
- Detail view works.
- Risk flags work deterministically.
- Optional `I Agree` works correctly if included.
- Public deployment is working.
- GitHub repository is public.
- README.md is present.
- Hackathon ID is present in the root README.md.
- DECISIONS.md documents all three Decision Points.
- The demo can walk through the five required features in order.

## 13. Scope Discipline

This is a hackathon MVP.

If time is limited:

**Required features > Decision Points > deployment/testing > documentation > optional I Agree > visual polish.**

Never delay the five required features because of optional functionality.
