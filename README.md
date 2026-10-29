# UPSC Mentor AI

A local-first UPSC Civil Services preparation workspace: AI mentor, syllabus navigator, PYQ practice, prelims test engine, Mains/essay evaluation, current-affairs briefs, study planner, notes, spaced-repetition flashcards, analytics, interview practice, settings and an admin console.

The interface is fully responsive and supports light/dark themes and English/Hindi UI labels.

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # type-check and production build
npm test         # Vitest unit suite
```

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Aspirant | `demo@upscmentor.app` | `demo1234` |
| Admin | `admin@upscmentor.app` | `admin1234` |

The demo aspirant is seeded with a CSE 2027 profile, a 30-day plan, completed study activity, tests, notes, flashcards and revision items.

## What is implemented

- **AI Mentor** — topic-aware tutoring, planning, evaluation routing, quick actions and local chat history. Falls back to deterministic curated lesson content when no AI proxy is configured.
- **Learn / Topic pages** — full prelims, Mains, essay, CSAT and optional syllabus map with progress tracking.
- **PYQ and question pages** — source-labelled curated demo PYQs, AI practice questions, explanations and revision actions.
- **Prelims engine** — configurable mode, difficulty, count, timer and negative marking; question palette; auto-submit; results, topic analysis and revision-queue generation.
- **Mains and Essay Lab** — timed writing, rubric-style feedback, model answers and saved evaluations.
- **Current Affairs** — curated issue briefs with static-syllabus links, Mains dimensions and revision mode.
- **Study Plan** — week board, task management, revision queue, regeneration and daily targets.
- **Notes and Flashcards** — Markdown notes, tags/search/bookmarks, manual cards, generated starter decks and SM-2-style scheduling.
- **Analytics** — readiness, score trend, study consistency, subject/topic performance and weak areas.
- **Interview** — DAF-based mock board with transcript and structured practice feedback.
- **Settings / Admin** — profile and preferences, theme/language, password change, JSON export/reset, AI-proxy status, content provenance and account inventory.

## Architecture

- React 19 + TypeScript + Vite 6 + React Router 7
- Route-level lazy loading and a custom CSS token system
- `src/contexts/AuthContext.tsx` — local accounts, sessions, password hashing and profile updates
- `src/contexts/AppContext.tsx` — per-user workspace persistence and CRUD
- `src/services/ai.ts` — optional proxy call plus deterministic local fallbacks
- `src/data/` — syllabus, curated questions, current affairs and demo seed data
- `src/lib/` — scoring, planner, SRS, test selection, search, analytics and date helpers

### Local storage keys

| Key | Purpose |
| --- | --- |
| `upsc-mentor:users` | Local browser accounts (password hashes only) |
| `upsc-mentor:session` | Current user id |
| `upsc-mentor:data:<userId>` | Workspace data for one user |
| `upsc-mentor:theme` | Light/dark preference |

## AI proxy (optional)

Set `VITE_AI_PROXY_URL` to a server-side endpoint. The browser sends:

```json
{ "task": "mentor", "payload": {}, "messages": [{ "role": "system", "content": "..." }] }
```

The proxy must authenticate with the model provider, apply rate limits and return:

```json
{ "content": "Assistant response" }
```

Without a proxy, every feature remains usable through local deterministic content. Provider API keys must never be placed in `VITE_*` variables.

## Verification

```bash
npm run build
npm test
```

The unit suite covers spaced repetition, negative-marking scoring, test URL/config round-trips, question selection and planner generation. Browser smoke checks were run against the production build at desktop and mobile widths, including login, all primary routes, mentor chat, note creation, Mains evaluation, prelims submission/results and admin role access.

## Content and security notes

- This is a **frontend-only, local-first demo**, not a production multi-user backend. Accounts and data live in the browser and can be cleared by the user.
- Scores are indicative practice signals, not UPSC marks. Curated PYQs are demo records; AI-generated questions are explicitly labelled.
- Current-affairs briefs include source attribution and should be verified against official documents before reliance.
- A production deployment needs a real database, server-side authentication, audit logging, rate limiting and a secure AI proxy.

# PlayGround

<!-- omgithub:readme:start -->
## 🚀 Build, play, and remix with OMGithub

**Created using [OMGithub.com](https://omgithub.com).**

[![OMGithub](https://img.shields.io/badge/OMGithub-Open%20project-orange?style=for-the-badge)](https://omgithub.com/alamsharjil3-stack/PlayGround)
[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?logo=github&style=for-the-badge)](https://github.com/alamsharjil3-stack/PlayGround)

- 🎮 [Open the project](https://omgithub.com/alamsharjil3-stack/PlayGround).
- ✨ [Remix this project](https://omgithub.com/?remix=alamsharjil3-stack%2FPlayGround).
- 💻 [Explore the source](https://github.com/alamsharjil3-stack/PlayGround).
- 🛠️ [Check build runs](https://github.com/alamsharjil3-stack/PlayGround/actions).
- 🐛 [Report an issue](https://github.com/alamsharjil3-stack/PlayGround/issues).
- 👤 [Explore the creator's projects](https://omgithub.com/alamsharjil3-stack).
- 🌍 [Create with OMGithub](https://omgithub.com).
<!-- omgithub:readme:end -->
