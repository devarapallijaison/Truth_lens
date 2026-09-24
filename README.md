# TruthLens — Misinformation Triage & Verification Platform

> Civic-tech misinformation triage and human review platform built for the **Azisly.ai Hackathon**.

TruthLens is a transparent misinformation-triage system that allows the public to submit viral claims, automatically detects predefined risk signals, keeps new claims in an `UNVERIFIED` state, provides a streamlined reviewer workflow, and publishes reviewed claims in a public feed.

---

## 🌟 Key Features

1. **Submit a Claim (Feature 1)**:
   - Public users can submit claims with Source Platform (`WhatsApp`, `X`, `Instagram`, `Other`) and Category (`Politics`, `Health`, `Finance`, `Other`).
   - All newly submitted claims start with `UNVERIFIED` status and record timestamps.
   - No login or sign-up required.

2. **Deterministic Risk Flags (Feature 2)**:
   - Automatically detects predefined warning signals without using an LLM:
     - **Sensational**: Detects alarmist phrases such as `breaking`, `shocking`, and `share before deleted`.
     - **Shouting**: Detects messages with >50% uppercase alphabetic characters.
     - **Unsourced**: Detects absence of verifiable source links.
   - **Risk Level**: Derived deterministically (2+ flags = `HIGH`, 1 flag = `MEDIUM`, 0 flags = `LOW`).
   - Risk levels are triage priority signals, **not** factual truth verdicts.

3. **Human Reviewer Workflow (Feature 3)**:
   - Reviewer inspects submitted claims and records a verdict:
     - `VERIFIED_TRUE`
     - `VERIFIED_FALSE`
     - `MISLEADING`
     - `UNVERIFIED`
   - Reviewer records an explanatory context note and timestamp.
   - Directly accessible for hackathon grading without authentication.

4. **Public Feed & Filtering (Feature 4)**:
   - Displays all claims with status and risk badges.
   - Interactive filtering by Category and Review Status.
   - Strictly applies **DP1 feed ordering** (Risk level first, then recency).
   - Unverified claims remain publicly visible with prominent badges (**DP2**).

5. **Detail View (Feature 5)**:
   - Comprehensive breakdown showing full immutable claim text, taxonomy, signal analysis, audit timeline, and reviewer notes.

6. **Community "I Agree" Reaction (Optional Feature)**:
   - Public users can express community agreement with a reviewed claim.
   - Enforces **one vote per browser** using `localStorage` with toggle-off capability.
   - Clearly defined as community sentiment, never as evidence or factual verification.

---

## 📐 Decision Points

All three required product decisions are implemented and documented in [DECISIONS.md](./DECISIONS.md):

- **DP1 — Feed Order**: Risk level first (`HIGH` > `MEDIUM` > `LOW`), then recency (newest first). Higher-risk claims surface early for triage.
- **DP2 — Visibility**: Unreviewed claims remain publicly visible with prominent `UNVERIFIED` badges to ensure transparency.
- **DP3 — Editing**: Claims are immutable after creation. Reviewers evaluate the exact submitted text.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite 7, Vanilla CSS (restrained navy/blue/gold design system).
- **Backend**: Node.js (ES modules), Express 5, Mongoose 8.
- **Database**: MongoDB Atlas with automatic in-memory fallback for offline/demo resilience.
- **Tests**: Native Node.js test runner (`node --test`).

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
A sample environment file is provided in `server/.env.example`.
If a MongoDB Atlas URI is provided in `server/.env`, TruthLens connects directly to MongoDB Atlas. If omitted or running locally, TruthLens seamlessly uses its built-in memory store.

### 3. Run Development Servers
```bash
# Terminal 1 — Start backend API (port 5000)
npm run dev:server

# Terminal 2 — Start frontend UI (port 5173)
npm run dev:client
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Run Automated Tests
```bash
cd server
npm test
```

---

## 📡 Application API Endpoints

- `GET /api/health` — API health check and database connection status.
- `GET /api/claims` — Public feed supporting `?category=` and `?status=` filters with DP1 sorting.
- `GET /api/claims/:id` — Detail view for a specific claim.
- `POST /api/claims` — Submit a new claim and compute risk flags.
- `GET /api/review/claims` — Queue of unverified claims awaiting review.
- `PATCH /api/claims/:id/review` — Record reviewer verdict and note (enforces DP3 immutability).
- `POST /api/claims/:id/agree` — Increment community agreement (+1).
- `DELETE /api/claims/:id/agree` — Toggle off community agreement (-1).

---

## ⚖️ Hackathon Compliance Note
In accordance with hackathon instructions:
- **No authentication** (no login, signup, passwords, or JWTs) is present.
- Graders can freely inspect and evaluate the Public Feed, Submit Claim, and Reviewer Dashboard.
