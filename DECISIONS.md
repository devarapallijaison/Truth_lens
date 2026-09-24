# TruthLens — Architecture Decision Records (ADRs)

This document formalizes the deliberate product, architectural, and ethical decisions made in the development of the TruthLens civic misinformation triage platform.

---

## DP1 — Feed Ordering: Risk First, Then Recency

### Decision
The public feed orders submitted claims primarily by **risk level** (`HIGH` > `MEDIUM` > `LOW`), and secondarily by **recency** (`createdAt` descending, newer first).

### Implementation
- `HIGH` risk claims (2 or more automated risk flags) appear at the top of the feed.
- `MEDIUM` risk claims (1 automated risk flag) follow.
- `LOW` risk claims (0 automated risk flags) appear next.
- Within the same risk level group, claims are sorted by submission timestamp, newest first.

### Rationale
TruthLens is fundamentally a triage platform. Viral misinformation creates the most harm during its initial propagation window. Prioritizing high-risk claims ensures that claims displaying multiple warning signals (e.g. Sensational urgency + Shouting + Unsourced claims) receive immediate visibility for reviewers and public vigilance.

### Critical Distinction
**Risk level is NOT truth status.** An automated high-risk indicator does not prove a claim is false, nor does a low-risk indicator prove it is true. Risk flags reflect linguistic and structural patterns that warrant triage attention.

---

## DP2 — Visibility: Unverified Claims Remain Publicly Visible

### Decision
All submitted claims remain publicly visible in the feed immediately upon submission, with a prominent, unambiguous `UNVERIFIED` status badge.

### Implementation
- Every new claim starts with status `UNVERIFIED`.
- Unreviewed claims are never hidden behind a moderation embargo.
- The UI renders `UNVERIFIED` with distinct, restrained amber/gold styling, clearly differentiated from `VERIFIED_TRUE` (green), `VERIFIED_FALSE` (crimson), and `MISLEADING` (ochre).
- Disclaimers alongside the feed and detail views remind users that an unreviewed claim is not verified truth.

### Rationale
Hiding viral claims from the public until human reviewers complete their investigation allows harmful rumors to spread unchecked across private channels like WhatsApp and Telegram. Public visibility enables open civic tracking and allows citizens to see what is currently under review, preventing information vacuums while preventing unreviewed claims from being mistaken for established facts.

---

## DP3 — Immutability: Claims Are Immutable After Creation

### Decision
Once submitted, a claim cannot be edited or modified.

### Implementation
- The original `text`, `sourcePlatform`, `category`, `riskFlags`, and `riskLevel` fields are marked immutable in the Mongoose schema and enforced at the API route layer.
- The Reviewer workflow can only update `status`, `reviewerNote`, and `reviewedAt`.
- The reviewer reviews the exact text as submitted.
- If a user wishes to amend a claim or provide an update, they must submit a new claim.

### Rationale
Allowing claims to be edited post-submission would introduce severe integrity vulnerabilities: a malicious actor could submit a benign claim, wait for a reviewer to mark it `VERIFIED_TRUE`, and subsequently edit the text to assert a dangerous falsehood. Immutability guarantees that the human review verdict and the automated risk flags remain permanently bound to the exact content inspected.

---

## Ethical & Governance Principles

1. **No Automated Truth Deciders**: TruthLens strictly avoids automated truth verdicts. Automated logic computes deterministic risk signals only; factual verification is exclusively performed by human reviewers.
2. **Accessible Without Barriers**: In compliance with civic utility and hackathon access rules, all core capabilities (submission, feed inspection, detail audit, and reviewer workflows) operate without mandatory account creation or gatekeeping passwords.
3. **Community Agreement as Sentiment, Not Evidence**: The optional community `I Agree` reaction enables public sentiment measurement with one-reaction-per-browser local state. It is explicitly labeled as community sentiment and never overrides or influences human reviewer verdicts.
4. **Strict Role Separation**: The Public Feed and Claim Detail views are strictly **view-only** with respect to verification. Public users can browse claims, inspect risk indicators and reviewer notes, and express community agreement. Classification controls, verdict assignments (`VERIFIED_TRUE`, `VERIFIED_FALSE`, `MISLEADING`, `UNVERIFIED`), and reviewer notes are exclusively restricted to the Reviewer Dashboard (`#reviewer`).

