🛡️ ShieldNest Developer Notes
Mission

Build a secure, modular, and future-proof portfolio dashboard for Coreum users.
We want it to feel professional for public users and exclusive for private members.

User Journey

Visitor

Can connect wallets or paste addresses.

Data is not saved.

Nudged to sign up before leaving (exit-intent prompt).

Public User

Signs up with email/pw or wallet bootstrap.

Data saved in Supabase.

Sees Shield NFT teaser + “Request membership.”

Private Member

PMA signed (PDF + on-chain hash).

Must hold Shield NFT (placeholder in v1).

Gains access to member dashboard: NFT metrics, buy options, sell-back coming soon.

Architecture Rules

Frontend: Next.js (App Router).

Backend: Supabase (Auth, DB, Storage).

Hosting: Vercel + Supabase (v1).

Future Services: Go/VPS only when DEX or heavy jobs demand it.

Coding Guidelines

Errors: Always return { code, message, hint?, causeId }.

Security:

No secrets in client code.

Enforce Supabase RLS.

Sanitize logs.

Structure:

components/ → UI.

hooks/ → React state logic.

contexts/ → shared state.

lib/ → DB/wallet/NFT helpers.

utils/ → error + formatting helpers.

Style:

TypeScript strict.

Small pure functions.

Write comments as if you’re leaving a note for your future self.

Change Management

Branches:

main = production.

develop = staging.

feature/* = short-lived features.

Commits: Conventional Commits (feat:, fix:, chore:).

PRs:

Include description of what, why, risks, rollback plan.

Link to issue/task.

Changelog: Generated with Changesets (later).

Personality of Project

We are building professional-grade crypto software with a playful edge (aliens, shields, exclusivity).

Public pages should feel trustworthy and clean.

Private member areas should feel like a secret club (exclusive, powerful tools).