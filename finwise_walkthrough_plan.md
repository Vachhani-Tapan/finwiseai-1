# FinWise AI — Walkthrough Implementation Plan

> Step-by-step guide to build, ship, and maintain the FinWise AI application.

---

## 1. Project Directory Structure

```
finwise-ai/
├── frontend/                    # React + TypeScript + TailwindCSS
│   ├── public/
│   ├── src/
│   │   ├── assets/              # Images, icons, fonts
│   │   ├── components/          # Shared UI components
│   │   │   ├── ui/              # Buttons, modals, cards, inputs
│   │   │   ├── charts/          # Chart components (donut, line, bar, candlestick)
│   │   │   ├── layout/          # Sidebar, header, footer, FAB
│   │   │   └── forms/           # Form components (expense, stock, MF, goal)
│   │   ├── pages/               # Route-level page components
│   │   │   ├── auth/            # Login, Register, Onboarding
│   │   │   ├── dashboard/       # Main dashboard
│   │   │   ├── expenses/        # Expense tracker + import
│   │   │   ├── investments/     # MF + Stocks pages
│   │   │   ├── goals/           # Goal planner
│   │   │   ├── networth/        # Net worth dashboard
│   │   │   ├── loans/           # Debt planner
│   │   │   ├── fd/              # FD optimizer
│   │   │   ├── tax/             # Tax planner
│   │   │   ├── alerts/          # Alert manager
│   │   │   ├── news/            # News feed
│   │   │   ├── reports/         # Monthly reports
│   │   │   └── settings/        # Profile + preferences
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # API client functions
│   │   ├── store/               # Zustand / Context state management
│   │   ├── types/               # TypeScript interfaces
│   │   ├── utils/               # Helpers (INR formatter, date utils)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   └── Dockerfile
│
├── backend/                     # FastAPI (Python)
│   ├── app/
│   │   ├── core/                # Config, database, security
│   │   │   ├── config.py        # Environment variables via Pydantic
│   │   │   ├── database.py      # MongoDB Motor connection
│   │   │   └── security.py      # JWT middleware, password hashing
│   │   ├── models/              # MongoDB document schemas (Pydantic)
│   │   │   ├── user.py
│   │   │   ├── expense.py
│   │   │   ├── mf_holding.py
│   │   │   ├── stock_holding.py
│   │   │   ├── goal.py
│   │   │   ├── loan.py
│   │   │   ├── fd_holding.py
│   │   │   ├── alert.py
│   │   │   └── ai_report.py
│   │   ├── routers/             # API route handlers
│   │   │   ├── auth.py
│   │   │   ├── expenses.py
│   │   │   ├── mutual_funds.py
│   │   │   ├── stocks.py
│   │   │   ├── goals.py
│   │   │   ├── networth.py
│   │   │   ├── loans.py
│   │   │   ├── fd.py
│   │   │   ├── tax.py
│   │   │   ├── alerts.py
│   │   │   ├── news.py
│   │   │   ├── reports.py
│   │   │   └── dashboard.py
│   │   ├── services/            # Business logic
│   │   │   ├── mf_service.py    # mfapi.in integration
│   │   │   ├── stock_service.py # yfinance integration
│   │   │   ├── expense_service.py
│   │   │   ├── goal_service.py
│   │   │   ├── tax_service.py
│   │   │   ├── alert_service.py
│   │   │   ├── notification_service.py  # Firebase, Twilio, Email
│   │   │   ├── pdf_parser_service.py    # PyMuPDF + Claude
│   │   │   └── scraper_service.py       # screener.in scraper
│   │   ├── agents/              # AI agent definitions
│   │   │   ├── orchestrator.py
│   │   │   ├── mf_analyst.py
│   │   │   ├── stock_analyst.py
│   │   │   ├── expense_analyzer.py
│   │   │   ├── goal_planner.py
│   │   │   ├── pdf_parser.py
│   │   │   ├── categorizer.py
│   │   │   └── report_writer.py
│   │   ├── utils/               # Helpers
│   │   │   ├── formatters.py    # INR formatting
│   │   │   ├── calculators.py   # CAGR, Sharpe, SIP, etc.
│   │   │   └── validators.py    # Input validation helpers
│   │   └── main.py              # FastAPI app entry point
│   ├── tests/                   # Pytest tests
│   │   ├── test_auth.py
│   │   ├── test_expenses.py
│   │   ├── test_mutual_funds.py
│   │   ├── test_stocks.py
│   │   ├── test_goals.py
│   │   └── test_calculators.py
│   ├── scripts/
│   │   ├── seed.py              # Seed database with demo data
│   │   └── migrate.py           # DB migration scripts
│   ├── .env.example
│   ├── requirements.txt
│   ├── Dockerfile
│   └── pytest.ini
│
├── mcp_server/                  # MCP Server for AI agents
│   ├── server.py                # MCP tool definitions
│   ├── tools/                   # Individual tool implementations
│   └── requirements.txt
│
├── n8n/                         # N8N workflow exports
│   ├── workflows/
│   │   ├── daily_nav_update.json
│   │   ├── stock_price_refresh.json
│   │   ├── monthly_report.json
│   │   ├── news_feed_refresh.json
│   │   └── fd_rate_update.json
│   └── README.md
│
├── docs/                        # Documentation
│   ├── PRD.md                   # Product Requirements Document
│   ├── API.md                   # API documentation
│   ├── ARCHITECTURE.md          # System architecture
│   ├── DEPLOYMENT.md            # Deployment guide
│   └── CONTRIBUTING.md          # Contribution guide
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml               # Lint + Test on PR
│   │   ├── deploy-staging.yml   # Deploy to staging
│   │   └── deploy-prod.yml     # Deploy to production
│   ├── ISSUE_TEMPLATE/
│   │   ├── feature.md
│   │   ├── bug.md
│   │   └── task.md
│   └── PULL_REQUEST_TEMPLATE.md
│
├── docker-compose.yml           # Full stack: frontend + backend + MongoDB + Redis + N8N
├── docker-compose.dev.yml       # Dev overrides (hot reload, debug)
├── .gitignore
├── .env.example
└── README.md
```

---

## 2. Development Environment Setup

### Prerequisites
- Node.js 20+ & npm
- Python 3.11+ & pip
- Docker & Docker Compose
- MongoDB (via Docker or Atlas)
- Redis (via Docker)
- Git

### Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/finwise-ai.git
cd finwise-ai

# 2. Copy environment files
cp .env.example .env
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

# 3. Start infrastructure (MongoDB + Redis)
docker-compose -f docker-compose.dev.yml up -d mongo redis

# 4. Backend setup
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 5. Frontend setup (new terminal)
cd frontend
npm install
npm run dev                   # → http://localhost:5173

# 6. Seed database (optional)
cd backend
python scripts/seed.py
```

---

## 3. Git Workflow & Branching Strategy

### Branch Naming Convention

```
main                           # Production-ready code
├── develop                    # Integration branch
│   ├── feature/auth-login     # Feature branches
│   ├── feature/expense-crud
│   ├── feature/mf-portfolio
│   ├── fix/nav-calculation
│   └── chore/add-eslint
```

### Rules

| Rule | Detail |
|---|---|
| **Branch from** | Always branch from `develop` |
| **PR target** | Always PR into `develop` |
| **Naming** | `feature/`, `fix/`, `chore/`, `docs/` + kebab-case |
| **Commits** | Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `test:` |
| **PR size** | Keep PRs < 400 lines when possible |
| **Reviews** | 1 approval required before merge |
| **Merge** | Squash merge into `develop`, merge commit `develop → main` |

### Example Commit Messages

```
feat(auth): implement email/password registration
feat(expenses): add manual expense entry form
fix(stocks): correct SL validation to disallow SL > pick price
docs(api): add mutual funds endpoint documentation
test(goals): add unit tests for goal status calculation
chore(deps): update fastapi to 0.110.0
```

---

## 4. GitHub Project Setup

### Labels

```bash
# Priority
P0-critical, P1-high, P2-medium, P3-low

# Type
feature, bug, chore, docs, test, design

# Module
auth, dashboard, expenses, mutual-funds, stocks, goals,
networth, loans, fd, tax, alerts, news, reports, settings, ai, n8n

# Phase
phase-1-mvp, phase-2-ai, phase-3-full, phase-4-scale

# Status
needs-triage, blocked, needs-review
```

### Milestones

| Milestone | Deadline | Issues |
|---|---|---|
| Sprint 1 — Bootstrap & Auth | Week 2 | Tasks 1–69 |
| Sprint 2 — Dashboard & Expenses | Week 4 | Tasks 70–98 |
| Sprint 3 — Investments & Goals | Week 6 | Tasks 99–156 |
| Sprint 4 — AI Agents & MCP | Week 9 | Tasks 157–200 |
| Sprint 5 — PDF Import & N8N | Week 11 | Tasks 201–231 |
| Sprint 6 — Alert Engine | Week 14 | Tasks 232–256 |
| Sprint 7 — Tax & Debt | Week 17 | Tasks 257–285 |
| Sprint 8 — News & Reports | Week 20 | Tasks 286–303 |
| Sprint 9 — Settings & Polish | Week 22 | Tasks 304–317 |
| Sprint 10 — Scale & Admin | Week 28 | Tasks 318–332 |

---

## 5. Sprint-by-Sprint Implementation Guide

### 🏁 Sprint 1 — Project Bootstrap & Auth (Week 1–2)

**Goal:** Working login/register with JWT, project scaffold, database connected.

**Day-by-day:**

| Day | Focus | Deliverables |
|---|---|---|
| Day 1 | Repo setup | GitHub repo, project board, labels, milestones |
| Day 2 | Backend scaffold | FastAPI project, folder structure, Docker setup |
| Day 3 | Database setup | MongoDB collections, indexes, connection module |
| Day 4 | Auth backend | Register, login, logout, refresh, JWT middleware |
| Day 5 | Auth backend | Google OAuth, email verification, rate limiting |
| Day 6 | Frontend scaffold | Vite + React + TS + Tailwind, routing, project structure |
| Day 7 | Auth frontend | Login page, register page, auth context |
| Day 8 | Frontend auth | Onboarding wizard (5 steps), protected routes |
| Day 9 | Integration testing | Auth flow E2E, error handling |
| Day 10 | Polish + PR | Code review, fix issues, merge to develop |

**Exit Criteria:**
- [ ] User can register, verify email, login
- [ ] Google OAuth works
- [ ] JWT auth protects all endpoints
- [ ] Onboarding wizard saves user data
- [ ] All auth tests pass

---

### 🏁 Sprint 2 — Dashboard & Expenses (Week 3–4)

**Goal:** Working dashboard with expense CRUD, budgets, and charts.

| Day | Focus | Deliverables |
|---|---|---|
| Day 1–2 | Dashboard API + UI | Summary endpoint, layout, net worth card, snapshot card |
| Day 3–4 | Expense CRUD backend | All endpoints, validation, duplicate detection |
| Day 5–6 | Expense UI | List, form, filters, search, charts |
| Day 7–8 | Budget system | Set budgets, budget vs actual bars, 50/30/20 |
| Day 9 | CSV export | Export expenses as CSV |
| Day 10 | Tests + Polish | API tests, integration testing, UI polish |

**Exit Criteria:**
- [ ] Dashboard loads with real data
- [ ] CRUD expenses with validation
- [ ] Budget alerts at 80% and 100%
- [ ] Category donut chart, daily bar chart work
- [ ] 50/30/20 analyzer correct

---

### 🏁 Sprint 3 — Investments & Goals (Week 5–6)

**Goal:** MF portfolio, stock portfolio, goals with progress tracking, net worth.

| Day | Focus | Deliverables |
|---|---|---|
| Day 1–2 | MF backend | Search, CRUD, NAV fetch, metrics |
| Day 3–4 | MF frontend | Portfolio table, NAV chart, SIP calculator, comparison |
| Day 5–6 | Stock backend | CRUD, yfinance integration, technicals, price cache |
| Day 7–8 | Stock frontend | Portfolio table, candlestick chart, watchlist |
| Day 9 | Goals module | CRUD, contributions, status calculation, milestones |
| Day 10 | Net worth + tests | Net worth dashboard, all module tests |

**Exit Criteria:**
- [ ] MF holdings show real NAV data from mfapi.in
- [ ] Stock P&L calculated correctly
- [ ] SL < pick price validation enforced
- [ ] Goals show on-track/behind/at-risk status
- [ ] Net worth = assets − liabilities

---

### 🏁 Sprint 4 — AI Agents & MCP (Week 7–9)

**Goal:** All AI agents working, MCP server operational.

| Day | Focus | Deliverables |
|---|---|---|
| Day 1–3 | MCP server | All 10 tool functions implemented and tested |
| Day 4–5 | MF analysis agent | 400-word verdict, performance metrics, SEBI disclaimer |
| Day 6–7 | Stock verdict agent | HOLD/ACCUMULATE/EXIT, fundamentals scraping |
| Day 8–9 | Expense analyzer agent | Find savings with ₹ amounts, subscription detection |
| Day 10–12 | Goal planner agent | SIP recommendation, timeline feasibility |
| Day 13–15 | Finance orchestrator | Query routing, chat interface, full context assembly |

**Exit Criteria:**
- [ ] All MCP tools return correct data
- [ ] AI reports generate in < 30 seconds
- [ ] SEBI disclaimer on every investment AI output
- [ ] Orchestrator correctly routes to specialist agents

---

### 🏁 Sprint 5 — PDF Import & N8N (Week 10–11)

**Goal:** Bank statement import, automated NAV/price updates.

| Day | Focus | Deliverables |
|---|---|---|
| Day 1–3 | PDF import pipeline | Upload, PyMuPDF, AI extraction, categorization |
| Day 4–5 | CSV import + review UI | CSV parsing, flagged transaction review |
| Day 6–7 | N8N: NAV update | Cron → fetch → upsert workflow |
| Day 8–9 | N8N: price refresh | 15-min cron, market hours only, alert trigger |
| Day 10 | Tests | Extraction accuracy, duplicate handling, data freshness |

**Exit Criteria:**
- [ ] PDF import extracts > 85% transactions accurately
- [ ] Duplicate transactions are skipped
- [ ] NAV updates daily at 6:30 PM
- [ ] Stock prices refresh every 15 min during market hours
- [ ] Data anonymized before Claude API calls

---

### 🏁 Sprint 6 — Alert Engine (Week 12–14)

**Goal:** All alert types firing correctly across all channels.

| Day | Focus | Deliverables |
|---|---|---|
| Day 1–3 | Alert logic | All 9 trigger types, cooldown system |
| Day 4–5 | Notification services | Firebase push, email, Twilio SMS/WhatsApp |
| Day 6–7 | Alert management UI | Create, toggle, delete alerts |
| Day 8–10 | Integration tests | Alert triggering E2E, channel delivery |

**Exit Criteria:**
- [ ] Stop-loss breach fires CRITICAL alert within 5 min
- [ ] Budget alerts fire at 80% and 100%
- [ ] Goal milestones trigger push notification
- [ ] 60-min cooldown works (except CRITICAL)

---

### 🏁 Sprint 7 — Tax & Debt (Week 15–17)

**Goal:** Tax planner, debt snowball/avalanche, FD optimizer.

| Day | Focus | Deliverables |
|---|---|---|
| Day 1–3 | Tax planner | 80C tracker, regime comparison, HRA calculator |
| Day 4–5 | Capital gains | STCG/LTCG calculation from transactions |
| Day 6–8 | Debt planner | Loan CRUD, snowball vs avalanche, extra payment sim |
| Day 9–10 | FD optimizer | Rate comparison, tax-adjusted yield, maturity calendar |

**Exit Criteria:**
- [ ] 80C shows used vs ₹1.5L limit
- [ ] Regime comparison recommends correct regime
- [ ] Avalanche shows less total interest than snowball
- [ ] FD comparison sorts by maturity amount

---

### 🏁 Sprint 8 — News & Reports (Week 18–20)

**Goal:** Personalized news feed, monthly AI reports.

| Day | Focus | Deliverables |
|---|---|---|
| Day 1–3 | News feed | RSS parsing, embeddings, relevance scoring |
| Day 4–5 | News UI | Article cards, AI summaries, relevance tags |
| Day 6–8 | Monthly reports | Report writer agent, N8N cron, email delivery |
| Day 9–10 | Reports UI | Archive, individual report view |

**Exit Criteria:**
- [ ] Top 20 relevant articles per day
- [ ] 2-sentence AI summary per article
- [ ] Monthly report generates on 1st
- [ ] Report archived in-app for 12 months

---

### 🏁 Sprint 9 — Settings & Polish (Week 21–22)

**Goal:** Settings page, INR formatting, dark mode, mobile responsive.

| Day | Focus | Deliverables |
|---|---|---|
| Day 1–2 | Settings page | Profile, notifications, data export |
| Day 3–4 | INR formatting + polish | All amounts in ₹1,23,456 format, loading skeletons |
| Day 5–6 | Dark mode + responsive | Theme toggle, mobile/tablet testing |
| Day 7–8 | Accessibility + performance | Keyboard nav, lazy loading, code splitting |

**Exit Criteria:**
- [ ] All pages responsive on mobile
- [ ] Dark mode toggle works
- [ ] INR format consistent everywhere
- [ ] No accessibility violations

---

### 🏁 Sprint 10 — Scale & Admin (Week 23–28)

**Goal:** WhatsApp bot, Redis caching, CI/CD, admin dashboard.

| Day | Focus | Deliverables |
|---|---|---|
| Week 23–24 | WhatsApp bot | Twilio setup, NL parsing, orchestrator integration |
| Week 25–26 | Performance | Redis caching, query optimization, load testing |
| Week 27–28 | CI/CD + Admin | GitHub Actions, admin dashboard, monitoring |

**Exit Criteria:**
- [ ] WhatsApp queries return correct responses
- [ ] p95 API response < 300ms
- [ ] 1,000 concurrent users without degradation
- [ ] CI pipeline: lint → test → build → deploy

---

## 6. CI/CD Pipeline

### `.github/workflows/ci.yml`

```yaml
name: CI
on:
  pull_request:
    branches: [develop, main]

jobs:
  backend-lint-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install -r backend/requirements.txt
      - run: cd backend && ruff check .
      - run: cd backend && pytest tests/ -v

  frontend-lint-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: cd frontend && npm ci
      - run: cd frontend && npm run lint
      - run: cd frontend && npm run build
```

---

## 7. Deployment Architecture

```
┌─────────────────────────────────────────┐
│              CDN (Vercel / Cloudflare)   │
│              Frontend (React SPA)        │
├─────────────────────────────────────────┤
│                                         │
│     ┌───────────────────────────┐       │
│     │   FastAPI Backend         │       │
│     │   (Railway / Render)      │       │
│     └───────┬───────┬───────────┘       │
│             │       │                    │
│     ┌───────▼──┐ ┌──▼────────┐          │
│     │ MongoDB  │ │  Redis    │          │
│     │ Atlas    │ │ Upstash   │          │
│     └──────────┘ └───────────┘          │
│                                         │
│     ┌──────────────────────────┐        │
│     │  N8N (Self-hosted VPS)   │        │
│     └──────────────────────────┘        │
│                                         │
│     ┌──────────────────────────┐        │
│     │  S3 (AWS) — PDF Storage  │        │
│     └──────────────────────────┘        │
│                                         │
│     ┌──────────────────────────┐        │
│     │  Supabase — Auth         │        │
│     └──────────────────────────┘        │
└─────────────────────────────────────────┘
```

### Recommended Hosting

| Service | Provider | Cost (estimate) |
|---|---|---|
| Frontend | Vercel (free tier) | $0 |
| Backend | Railway / Render | $5–20/mo |
| MongoDB | Atlas (free 512MB) | $0–$25/mo |
| Redis | Upstash (free tier) | $0 |
| N8N | VPS (DigitalOcean) | $6/mo |
| S3 | AWS Free Tier | $0–$5/mo |
| Supabase | Free Tier | $0 |
| **Total MVP** | | **~$11–56/mo** |

---

## 8. Key Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| DB | MongoDB | Flexible schema for evolving finance data, good with JSON |
| Auth | Supabase | Free tier, Google OAuth built-in, JWT out of box |
| AI | Claude Sonnet + Haiku | Best reasoning for finance, Haiku for fast categorization |
| Stock data | yfinance | Free, reliable, OHLCV data for Indian stocks |
| MF data | mfapi.in | Free, no auth, comprehensive NAV data |
| Charts | Recharts + TradingView LW | Recharts for standard, TV for candlestick |
| Automation | N8N | Visual workflows, self-hosted, easy cron jobs |
| Notifications | Firebase + Twilio | Push + SMS + WhatsApp coverage |

---

## 9. Security Checklist

- [ ] JWT tokens: 24h access, 7d refresh
- [ ] Rate limiting on auth endpoints (5/min)
- [ ] CORS configured for frontend origin only
- [ ] MongoDB credentials in env, not code
- [ ] Never store bank login credentials
- [ ] Never send PAN/Aadhaar/account numbers to AI
- [ ] PDF auto-delete from S3 after 30 days
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (MongoDB parameterized queries)
- [ ] HTTPS everywhere in production
- [ ] Helmet/security headers on API

---

## 10. Quick Reference — Commands

```bash
# Backend
cd backend
uvicorn app.main:app --reload --port 8000       # Dev server
pytest tests/ -v                                  # Run tests
ruff check .                                      # Lint

# Frontend
cd frontend
npm run dev                                       # Dev server → :5173
npm run build                                     # Production build
npm run lint                                      # ESLint

# Docker
docker-compose up -d                              # Full stack
docker-compose -f docker-compose.dev.yml up -d    # Dev mode
docker-compose down                               # Stop all

# Database
python scripts/seed.py                            # Seed demo data
```

---

*FinWise AI — Walkthrough Plan v1.0*
