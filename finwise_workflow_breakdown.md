# FinWise AI — Complete Workflow Breakdown

> Every feature decomposed into atomic, trackable tasks for GitHub Issues/Projects.

---

## 🏗️ Phase 1 — MVP (Weeks 1–6)

### Sprint 1 · Project Bootstrap & Auth (Week 1–2)

---

#### 1.1 Repository & DevOps Setup

| # | Task | Details |
|---|---|---|
| 1 | Create GitHub repo `finwise-ai` | Mono-repo: `/frontend`, `/backend`, `/n8n`, `/docs` |
| 2 | Add `.gitignore` | Node, Python, env files, IDE, OS files |
| 3 | Add `README.md` | Project overview, tech stack, setup guide |
| 4 | Add `LICENSE` | MIT or your choice |
| 5 | Create GitHub Project board | Columns: Backlog → To Do → In Progress → Review → Done |
| 6 | Create milestone labels | `phase-1-mvp`, `phase-2-ai`, `phase-3-full`, `phase-4-scale` |
| 7 | Create category labels | `frontend`, `backend`, `ai`, `n8n`, `database`, `auth`, `bug`, `docs` |
| 8 | Setup branch protection | `main` branch — require PR review, CI pass |

---

#### 1.2 Backend — FastAPI Setup

| # | Task | Details |
|---|---|---|
| 9 | Initialize FastAPI project | `backend/` — Python 3.11+, Poetry/pip |
| 10 | Create project structure | `app/`, `routers/`, `models/`, `schemas/`, `services/`, `core/`, `utils/` |
| 11 | Add `requirements.txt` / `pyproject.toml` | fastapi, uvicorn, motor, pydantic, python-jose, passlib, httpx |
| 12 | Configure CORS middleware | Allow frontend origin, credentials |
| 13 | Setup environment config | `.env` + `core/config.py` using pydantic `BaseSettings` |
| 14 | Create MongoDB connection module | `core/database.py` — Motor async client, connection pool |
| 15 | Add health check endpoint | `GET /health` → `{ status: "ok", timestamp }` |
| 16 | Setup error handling middleware | Global exception handler, standard error response format |
| 17 | Add request logging middleware | Log method, path, status, duration |
| 18 | Add response wrapper | `{ success: bool, data: any, error: str | null }` |
| 19 | Create `Dockerfile` for backend | Python 3.11 slim, multi-stage build |
| 20 | Add `docker-compose.yml` | Backend + MongoDB + Redis services |

---

#### 1.3 Database — MongoDB Collections & Indexes

| # | Task | Details |
|---|---|---|
| 21 | Design `users` collection schema | `id, email, name, monthly_income, risk_profile, created_at, updated_at` |
| 22 | Design `expenses` collection schema | `id, user_id, amount, category, date, note, source, created_at` |
| 23 | Design `expense_budgets` collection schema | `id, user_id, category, monthly_limit, month` |
| 24 | Design `mf_holdings` collection schema | `id, user_id, scheme_code, scheme_name, units, avg_buy_nav, purchase_date` |
| 25 | Design `mf_nav_history` collection schema | `id, scheme_code, nav_date, nav` |
| 26 | Design `stock_holdings` collection schema | `id, user_id, symbol, exchange, qty, pick_price, stop_loss, target_price, buy_date, notes` |
| 27 | Design `stock_price_cache` collection schema | `id, symbol, exchange, last_price, updated_at` |
| 28 | Design `goals` collection schema | `id, user_id, name, type, target_amount, current_amount, target_date, priority` |
| 29 | Design `goal_contributions` collection schema | `id, goal_id, amount, date` |
| 30 | Design `bank_statements` collection schema | `id, user_id, file_url, status, parsed_at` |
| 31 | Design `alerts` collection schema | `id, user_id, type, condition_json, channel, is_active` |
| 32 | Design `loans` collection schema | `id, user_id, name, outstanding, interest_rate, emi, lender` |
| 33 | Design `fd_holdings` collection schema | `id, user_id, bank_name, principal, interest_rate, maturity_date` |
| 34 | Design `ai_reports` collection schema | `id, user_id, report_type, content_json, generated_at` |
| 35 | Create MongoDB indexes | `user_id` on all user collections, compound indexes for queries |
| 36 | Add TTL index on `stock_price_cache` | `updated_at` — auto-expire after 24h |
| 37 | Create seed data script | `scripts/seed.py` — sample user with demo data |

---

#### 1.4 Auth — Supabase Integration

| # | Task | Details |
|---|---|---|
| 38 | Setup Supabase project | Create project, get API keys |
| 39 | Configure Supabase Auth | Enable email/password + Google OAuth |
| 40 | Create `POST /auth/register` | Email + password → Supabase signup → create user in MongoDB |
| 41 | Create `POST /auth/login` | Email + password → Supabase sign-in → return JWT |
| 42 | Create `POST /auth/logout` | Invalidate session |
| 43 | Create `POST /auth/refresh` | Refresh token → new access token |
| 44 | Create `GET /auth/me` | Return current user profile from JWT |
| 45 | Create `POST /auth/oauth/google` | Google OAuth flow via Supabase |
| 46 | Email verification flow | Supabase sends verify email, block login until verified |
| 47 | JWT middleware | Decode + validate Supabase JWT on protected routes |
| 48 | Rate limiting on auth routes | 5 attempts/min per IP |
| 49 | Write auth integration tests | Register, login, refresh, protected route access |

---

#### 1.5 Frontend — React + TypeScript Setup

| # | Task | Details |
|---|---|---|
| 50 | Initialize React project | Vite + React + TypeScript |
| 51 | Install and configure TailwindCSS | Tailwind v4, design tokens, custom colors |
| 52 | Setup project structure | `src/components/`, `pages/`, `hooks/`, `services/`, `utils/`, `types/`, `store/` |
| 53 | Configure React Router | All routes from PRD §8 |
| 54 | Setup Axios/Fetch interceptor | Base URL from env, auto-attach JWT, refresh on 401 |
| 55 | Create auth context/store | `useAuth()` — login, logout, user state, loading |
| 56 | Create protected route wrapper | Redirect to `/login` if not authenticated |
| 57 | Setup environment variables | `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| 58 | Add ESLint + Prettier config | Consistent code style |
| 59 | Create `Dockerfile` for frontend | Node 20, multi-stage build |

---

#### 1.6 Frontend — Auth Pages

| # | Task | Details |
|---|---|---|
| 60 | Build `/login` page | Email + password form, Google OAuth button, "Register" link |
| 61 | Build `/register` page | Name + email + password form, Google OAuth, "Login" link |
| 62 | Build email verification pending screen | "Check your email" + resend link |
| 63 | Build `/onboarding` wizard — Step 1 | Name + profile photo (optional) |
| 64 | Build `/onboarding` wizard — Step 2 | Monthly income input (INR) |
| 65 | Build `/onboarding` wizard — Step 3 | Risk appetite selector (Conservative / Moderate / Aggressive) |
| 66 | Build `/onboarding` wizard — Step 4 | Create first goal (name + target amount + date) |
| 67 | Build `/onboarding` wizard — Step 5 | Add first expense (amount + category + note) |
| 68 | Onboarding completion → redirect to dashboard | Save all data, mark onboarding complete |
| 69 | Persist auth state on refresh | Store JWT in httpOnly cookie or localStorage with security |

---

### Sprint 2 · Dashboard & Expenses (Week 3–4)

---

#### 2.1 Dashboard — Main Page

| # | Task | Details |
|---|---|---|
| 70 | Create dashboard layout | Responsive grid — sidebar + main content area |
| 71 | Build sidebar navigation | Links to all modules, active state, collapse on mobile |
| 72 | Build Net Worth card component | Assets − Liabilities = Net Worth, with trend arrow |
| 73 | Build Monthly Snapshot card | Total spend vs budget bar, portfolio change %, top goal |
| 74 | Build AI Insight Feed placeholder | "Coming in Phase 2" cards with shimmer effect |
| 75 | Build Quick Add FAB | Floating button → menu: Add Expense / Investment / Goal |
| 76 | Build Portfolio Donut Chart | Recharts/Chart.js — MF, Stocks, FD, Cash allocation |
| 77 | Create API: `GET /dashboard/summary` | Aggregate net worth, monthly spend, portfolio value |
| 78 | Wire dashboard to API | Fetch on mount, loading skeletons, error states |
| 79 | Add pull-to-refresh / auto-refresh | Refresh every 5 min or on focus |

---

#### 2.2 Expense Module — Manual Entry

| # | Task | Details |
|---|---|---|
| 80 | Create `POST /expenses` endpoint | Validate amount > 0, valid category, date not future |
| 81 | Create `GET /expenses` endpoint | Filters: `date_from`, `date_to`, `category`, `search`, pagination |
| 82 | Create `PATCH /expenses/:id` endpoint | Update any field, ownership check |
| 83 | Create `DELETE /expenses/:id` endpoint | Soft delete or hard delete, ownership check |
| 84 | Implement duplicate detection | Skip if same `(user_id + date + amount + description)` exists |
| 85 | Create `GET /expenses/summary` endpoint | Monthly totals by category, 50/30/20 breakdown |
| 86 | Build `/expenses` page layout | Monthly total card, category chart, expense list |
| 87 | Build expense entry form | Amount (INR format), category dropdown, date picker, note |
| 88 | Build expense list with filters | Search bar, category filter, date range, sort options |
| 89 | Build monthly category donut chart | Recharts — category-wise breakdown |
| 90 | Build day-by-day bar chart | Daily spend for current month |
| 91 | Build budget manager section | Set/edit limits per category |
| 92 | Create `GET /expenses/budgets` endpoint | Return all category budgets for user |
| 93 | Create `POST /expenses/budgets` endpoint | Set/update budget for a category-month |
| 94 | Build budget vs actual bar chart | Per category: budget bar + actual bar |
| 95 | Implement 50/30/20 analyzer UI | Needs / Wants / Savings classification with ideal vs actual |
| 96 | INR formatting utility | `formatINR(123456.78) → "₹1,23,456.78"` |
| 97 | Expense CSV export | Download button → generate CSV server-side |
| 98 | Write expense API tests | CRUD, filters, duplicate detection, budget alerts |

---

### Sprint 3 · Investment Modules (Week 5–6)

---

#### 3.1 Mutual Fund Module

| # | Task | Details |
|---|---|---|
| 99 | Create MF search service | Fetch from `api.mfapi.in`, cache scheme list |
| 100 | Create `GET /mf/search?q=` endpoint | Search by scheme name, return top 20 matches |
| 101 | Create `POST /mf/holdings` endpoint | Add: scheme_code, scheme_name, units, avg_buy_nav, purchase_date |
| 102 | Create `GET /mf/holdings` endpoint | Return all holdings with current NAV + calculated values |
| 103 | Create `PATCH /mf/holdings/:id` endpoint | Update units, avg_buy_nav |
| 104 | Create `DELETE /mf/holdings/:id` endpoint | Remove holding, ownership check |
| 105 | Fetch current NAV from mfapi.in | Service to get latest NAV for a scheme |
| 106 | Create `GET /mf/holdings/:id/nav-history` | NAV history with period filter: 1M/3M/6M/1Y/3Y/5Y/ALL |
| 107 | Calculate portfolio metrics | Current value, invested value, gain/loss %, CAGR |
| 108 | Build `/investments/mf` page | Portfolio table + total summary card |
| 109 | Build MF search + add modal | Search input, results list, add form |
| 110 | Build MF portfolio table | Columns: Scheme, Units, Avg NAV, Current NAV, Value, Gain%, CAGR |
| 111 | Build NAV chart with period toggles | Chart.js line chart, 1M/3M/6M/1Y/3Y/5Y/ALL buttons |
| 112 | Show avg buy NAV reference line on chart | Horizontal dashed line at user's avg buy price |
| 113 | Build `/investments/mf/[id]` fund detail page | NAV chart, metrics, holdings info |
| 114 | Build SIP calculator | Inputs: monthly SIP, duration, expected return → maturity value |
| 115 | Build fund comparison tool | Compare up to 3 funds: NAV chart overlay, metric table |
| 116 | Create `GET /mf/compare` endpoint | Return metrics for multiple scheme IDs |
| 117 | Write MF module API tests | CRUD, NAV fetch, metrics calculation, search |

---

#### 3.2 Stock Portfolio Module

| # | Task | Details |
|---|---|---|
| 118 | Create yfinance service | `services/stock_service.py` — fetch price, history, fundamentals |
| 119 | Create `GET /stocks/search?q=` endpoint | Search by symbol name |
| 120 | Create `POST /stocks/holdings` endpoint | Validate: SL < pick_price, target > pick_price |
| 121 | Create `GET /stocks/holdings` endpoint | Return all holdings with CMP, P&L |
| 122 | Create `PATCH /stocks/holdings/:id` endpoint | Update qty, SL, target, notes |
| 123 | Create `DELETE /stocks/holdings/:id` endpoint | Remove holding |
| 124 | Create stock price cache logic | Upsert `stock_price_cache`, check freshness (15 min) |
| 125 | Create `GET /stocks/holdings/:id/technicals` | RSI-14, MACD, 50-SMA, 200-SMA, Golden/Death cross, volume vs 20d avg |
| 126 | Calculate technical indicators | Python: RSI, MACD(12,26,9), SMA, volume analysis |
| 127 | Build `/investments/stocks` page | Portfolio table + summary card |
| 128 | Build stock add/edit form | Symbol, exchange (NSE/BSE), qty, pick price, SL, target, notes |
| 129 | Build stock portfolio table | CMP, P&L (₹ + %), SL distance, target distance, risk-reward |
| 130 | Build `/investments/stocks/[id]` detail page | Chart, technicals, fundamentals |
| 131 | Build candlestick chart | TradingView Lightweight Charts, 50-SMA + 200-SMA overlays |
| 132 | Add pick/SL/target horizontal lines on chart | Green (pick), red (SL), green dashed (target) |
| 133 | Build technical indicators display | RSI gauge, MACD chart, SMA status, volume bar |
| 134 | Build watchlist feature | Track stocks without position, set price alerts |
| 135 | Create `GET/POST /stocks/watchlist` endpoints | CRUD watchlist items |
| 136 | Write stock module API tests | CRUD, validation (SL < pick), technicals, cache |

---

#### 3.3 Goals Module

| # | Task | Details |
|---|---|---|
| 137 | Create `POST /goals` endpoint | Validate: target_date in future, target > 0, valid type |
| 138 | Create `GET /goals` endpoint | Return all goals with progress %, status |
| 139 | Create `PATCH /goals/:id` endpoint | Update target, name, date |
| 140 | Create `DELETE /goals/:id` endpoint | Remove goal |
| 141 | Create `POST /goals/:id/contribute` endpoint | Add contribution, update current_amount |
| 142 | Calculate goal status | On-track / Behind / At-risk based on monthly_savings_required |
| 143 | Auto-calculate emergency fund target | 6 × average of last 3 months expenses |
| 144 | Build `/goals` page | Goal cards grid with progress bars |
| 145 | Build goal creation form | Name, type dropdown, target amount, target date, priority |
| 146 | Build goal detail page `/goals/[id]` | Progress bar, contribution history, status badge |
| 147 | Build contribution form | Amount + date, history list |
| 148 | Milestone celebrations | Confetti animation at 25%, 50%, 75%, 100% |
| 149 | Write goal API tests | CRUD, contributions, status calculation, emergency fund |

---

#### 3.4 Net Worth Dashboard

| # | Task | Details |
|---|---|---|
| 150 | Create `GET /networth` endpoint | Aggregate: MF + stocks + FD + savings − loans |
| 151 | Manual savings & property input | Allow user to enter manual asset values |
| 152 | Build `/networth` page | Asset breakdown, liability list, net worth number |
| 153 | Build asset/liability pie charts | Assets by type, liabilities by loan |
| 154 | Monthly net worth snapshot logic | Auto-save on 1st of month |
| 155 | Build 12-month trend line chart | Net worth over time |
| 156 | Write net worth API tests | Calculation accuracy, snapshot logic |

---

## 🤖 Phase 2 — AI Core (Weeks 7–14)

### Sprint 4 · AI Agents & MCP Server (Week 7–9)

---

#### 4.1 MCP Server Setup

| # | Task | Details |
|---|---|---|
| 157 | Create MCP server project | `mcp_server/` — Python FastAPI or custom MCP |
| 158 | Implement `get_user_financial_snapshot(user_id)` | Net worth, income, portfolio summary |
| 159 | Implement `get_mf_holdings(user_id)` | All MF holdings with current values |
| 160 | Implement `get_stock_holdings(user_id)` | Stock portfolio with live P&L |
| 161 | Implement `get_expense_breakdown(user_id, months)` | Categorized monthly expenses |
| 162 | Implement `get_goal_status(user_id)` | All goals with progress % |
| 163 | Implement `add_expense(user_id, amount, category)` | Create new expense record |
| 164 | Implement `get_mf_nav_history(scheme_code, days)` | NAV history array |
| 165 | Implement `get_stock_price_history(symbol, days)` | OHLCV history array |
| 166 | Implement `get_tax_data(user_id)` | 80C, HRA, capital gains |
| 167 | Implement `get_net_worth(user_id)` | Assets/liabilities breakdown |
| 168 | Write MCP server integration tests | All tool functions with test data |

---

#### 4.2 AI Agent — MF Analysis

| # | Task | Details |
|---|---|---|
| 169 | Create `mf_analysis_agent` | System prompt + Claude Sonnet integration |
| 170 | Build MF analysis prompt template | Include: NAV history, metrics, benchmark comparison |
| 171 | Generate 400-word HOLD / SIP CONTINUE / SWITCH verdict | Structured output |
| 172 | Performance metrics calculation | CAGR, Sharpe Ratio, Sortino Ratio, Max Drawdown, Beta |
| 173 | Benchmark comparison logic | Compare vs Nifty 50, Midcap 150, Smallcap 250 |
| 174 | Risk badge calculation | Low / Moderate / High from volatility + drawdown |
| 175 | Create `POST /mf/holdings/:id/analyze` endpoint | Trigger AI report, return content |
| 176 | Add SEBI disclaimer to every AI output | Mandatory footer text |
| 177 | Build AI report display component | Verdict badge, analysis text, metrics, disclaimer |
| 178 | Write MF AI tests | Report generation < 30s, SEBI disclaimer present |

---

#### 4.3 AI Agent — Stock Verdict

| # | Task | Details |
|---|---|---|
| 179 | Create `stock_verdict_agent` | System prompt + Claude integration |
| 180 | Build stock verdict prompt template | Include: technicals, fundamentals, P&L, thesis |
| 181 | Generate HOLD / ACCUMULATE / PARTIAL EXIT / FULL EXIT verdict | 200-word reasoning |
| 182 | Scrape fundamentals from screener.in | P/E, P/B, EPS, promoter holding %, 52W high/low |
| 183 | Create `POST /stocks/holdings/:id/verdict` endpoint | Trigger AI verdict |
| 184 | Create `GET /stocks/holdings/:id/fundamentals` endpoint | Return scraped data |
| 185 | Build stock AI verdict display component | Verdict badge, reasoning, technicals, disclaimer |
| 186 | Write stock AI tests | Verdict contains valid label, < 30s |

---

#### 4.4 AI Agent — Expense Analyzer

| # | Task | Details |
|---|---|---|
| 187 | Create `expense_analyzer_agent` | System prompt + Claude |
| 188 | Build expense analysis prompt | Include: categorized spend, trends, comparisons |
| 189 | Find specific cuttable expenses | With exact ₹ savings amounts |
| 190 | Create `POST /expenses/analyze` endpoint | Trigger AI analysis |
| 191 | Build AI expense analysis display | Savings suggestions, category insights |
| 192 | Subscription tracker logic | AI detects recurring charges, shows monthly burn |
| 193 | Write expense AI tests | Analysis returns actionable items with amounts |

---

#### 4.5 AI Agent — Goal Planner

| # | Task | Details |
|---|---|---|
| 194 | Create `goal_planner_agent` | System prompt + Claude |
| 195 | Build goal planning prompt | Include: goal details, income, expenses, risk profile |
| 196 | SIP recommendation logic | Amount, fund type (equity >5yr, debt <3yr), feasibility |
| 197 | Create `POST /goals/:id/plan` endpoint | Trigger AI plan |
| 198 | Build AI goal plan display | SIP recommendation, timeline, feasibility badge |
| 199 | Off-track warning system | "Increase monthly savings by ₹X to stay on track" |
| 200 | Write goal AI tests | Plan includes SIP amount, fund type recommendation |

---

### Sprint 5 · PDF Import & N8N Workflows (Week 10–11)

---

#### 5.1 PDF Import Pipeline

| # | Task | Details |
|---|---|---|
| 201 | Create `pdf_parser_agent` | System prompt — extract transactions from bank statement text |
| 202 | Create `categorizer_agent` | Claude Haiku — categorize single transaction |
| 203 | PDF upload to S3 | `POST /expenses/import/pdf` → upload, store in `bank_statements` |
| 204 | PyMuPDF text extraction | Extract text from uploaded PDF |
| 205 | AI transaction extraction | Parse extracted text → JSON array of transactions |
| 206 | AI categorization (bulk) | Categorize each transaction, flag confidence < 0.7 |
| 207 | Duplicate transaction detection | Skip if same (user_id + date + amount + description) |
| 208 | Bulk insert transactions | Insert into `expenses`, skip duplicates |
| 209 | CSV import pipeline | Parse CSV columns → map to expense fields → bulk insert |
| 210 | Create `POST /expenses/import/csv` endpoint | CSV upload and processing |
| 211 | Create `GET /expenses/import/:id/status` endpoint | Return import progress |
| 212 | Build PDF/CSV import page `/expenses/import` | Upload zone, progress bar, review flagged items |
| 213 | Build flagged transaction review UI | Show low-confidence items, let user fix category |
| 214 | Push notification after import | "Imported 47 transactions. 3 need review." |
| 215 | Auto-delete PDFs from S3 after 30 days | S3 lifecycle rule or cron job |
| 216 | Anonymize data before sending to Claude | Strip PAN, Aadhaar, account numbers |
| 217 | Write PDF import pipeline tests | Extraction accuracy > 85%, duplicate skip, anonymization |

---

#### 5.2 N8N Workflow — Daily NAV Update

| # | Task | Details |
|---|---|---|
| 218 | Setup N8N instance | Self-hosted Docker, connect to MongoDB |
| 219 | Create NAV update workflow | Cron 6:30 PM IST → fetch schemes → call mfapi → upsert |
| 220 | Fetch all scheme_codes from `mf_holdings` | Aggregate unique codes |
| 221 | Call mfapi.in for each scheme | Batch with rate limiting |
| 222 | Upsert into `mf_nav_history` | Update or insert NAV records |
| 223 | Trigger price alerts if conditions met | Check against user alert conditions |
| 224 | Write NAV update workflow tests | Verify data freshness, alert triggering |

---

#### 5.3 N8N Workflow — Stock Price Refresh

| # | Task | Details |
|---|---|---|
| 225 | Create price refresh workflow | Cron every 15 min, market hours only (9:15–15:30 IST, Mon–Fri) |
| 226 | Fetch active symbols from `stock_holdings` | Aggregate unique symbols |
| 227 | Call yfinance for each symbol | Batch processing |
| 228 | Upsert `stock_price_cache` | Update last_price, timestamp |
| 229 | Check stop-loss / target alerts | CMP vs SL (critical), CMP vs target |
| 230 | Fire alerts via notification service | Push, email, SMS based on user preference |
| 231 | Write price refresh tests | Cache freshness < 15 min, alert triggering |

---

### Sprint 6 · Alert Engine (Week 12–14)

---

#### 6.1 Smart Alert System

| # | Task | Details |
|---|---|---|
| 232 | Create alert data model | Type, condition_json, channel, is_active, cooldown tracking |
| 233 | Create `GET /alerts` endpoint | Return all user alerts |
| 234 | Create `POST /alerts` endpoint | Create new alert with condition |
| 235 | Create `DELETE /alerts/:id` endpoint | Deactivate or remove alert |
| 236 | Stock target hit alert logic | CMP >= target_price |
| 237 | Stop-loss breach alert logic | CMP <= stop_loss — CRITICAL, no cooldown |
| 238 | Stop-loss warning logic | CMP within 3% of stop_loss |
| 239 | Budget 80% used alert | monthly_spend > 80% of budget per category |
| 240 | Budget exceeded alert | monthly_spend > 100% of budget |
| 241 | Goal milestone alert | Progress hits 25/50/75/100% |
| 242 | SIP due reminder | 1st of every month |
| 243 | Net worth milestone alert | net_worth >= user-set value |
| 244 | Tax deadline reminder | 7 days before Jun 15, Sep 15, Dec 15, Mar 15, Jul 31 |
| 245 | Alert cooldown logic | 60 min cooldown (except CRITICAL) |
| 246 | Firebase push notification service | Send via FCM |
| 247 | Email notification service | SendGrid or SMTP |
| 248 | SMS/WhatsApp notification service | Twilio integration |
| 249 | Build `/alerts` management page | List alerts, toggle active, create new |
| 250 | Write alert system tests | All trigger types, cooldown enforcement, channel delivery |

---

#### 6.2 Finance Orchestrator Agent

| # | Task | Details |
|---|---|---|
| 251 | Create `finance_orchestrator` agent | Master router — routes queries to specialist agents |
| 252 | Build query classification logic | Detect intent: MF / Stock / Expense / Goal / General |
| 253 | Context assembly | Load full user financial snapshot before each query |
| 254 | Build AI chat interface component | Chat bubble UI on dashboard |
| 255 | Wire chat to orchestrator API | Send query, stream response |
| 256 | Write orchestrator tests | Correct routing, context inclusion |

---

## 🚀 Phase 3 — Full Features (Weeks 15–22)

### Sprint 7 · Tax & Debt (Week 15–17)

---

#### 7.1 Tax Planner

| # | Task | Details |
|---|---|---|
| 257 | Create `GET /tax/summary` endpoint | Overall tax data for user |
| 258 | Create `GET /tax/80c` endpoint | ELSS, PPF, EPF, LIC, NSC tracker vs ₹1.5L limit |
| 259 | Create `GET /tax/regime-comparison` endpoint | Old vs New regime calculation |
| 260 | Build 80C tracker UI | Category-wise inputs, progress bar vs ₹1.5L |
| 261 | Build regime comparison UI | Side-by-side: Old vs New regime with recommendation |
| 262 | Build HRA calculator | Inputs: basic salary, rent paid, city type → exempt HRA |
| 263 | Capital gains summary | STCG (20%) and LTCG (12.5%) from stock/MF transactions |
| 264 | Tax calendar reminders | Advance tax dates, ITR deadline |
| 265 | Build `/tax` page | Tabs: 80C, Regime, HRA, Capital Gains, Calendar |
| 266 | Write tax planner tests | Calculation accuracy, correct regime recommendation |

---

#### 7.2 Debt Planner

| # | Task | Details |
|---|---|---|
| 267 | Create `GET /loans` endpoint | Return all loans |
| 268 | Create `POST /loans` endpoint | Add loan: name, lender, outstanding, rate, EMI |
| 269 | Create `GET /loans/payoff-plan` endpoint | Accept `extra` param, calculate both strategies |
| 270 | Snowball strategy calculation | Sort by balance ascending, apply extra to smallest first |
| 271 | Avalanche strategy calculation | Sort by interest rate descending, apply extra to highest first |
| 272 | Build `/loans` page | Loan list, add form, strategy comparison |
| 273 | Build Snowball vs Avalanche comparison UI | Total interest, months to debt-free, timeline chart |
| 274 | Build extra payment simulator | Slider → real-time update: interest saved, months saved |
| 275 | Write debt planner tests | Avalanche < Snowball in total interest |

---

#### 7.3 FD Optimizer

| # | Task | Details |
|---|---|---|
| 276 | Seed FD rate database | 25 Indian banks, monthly update structure |
| 277 | Create `GET /fd` endpoint | Return user's FD holdings |
| 278 | Create `POST /fd` endpoint | Add FD: bank, principal, rate, maturity date |
| 279 | Create `GET /fd/compare` endpoint | Input: amount + tenure → comparison table |
| 280 | Tax-adjusted yield calculation | Post-tax return based on user's tax bracket |
| 281 | Build `/fd` page | Holdings table, maturity calendar, comparison tool |
| 282 | Build FD comparison table | All banks sorted by maturity amount |
| 283 | Build maturity calendar | Upcoming renewals, total annual interest |
| 284 | N8N workflow: monthly FD rate update | Scrape/update bank rates |
| 285 | Write FD optimizer tests | Comparison accuracy, tax-adjusted yield |

---

### Sprint 8 · News & Reports (Week 18–20)

---

#### 8.1 Personalized News Feed

| # | Task | Details |
|---|---|---|
| 286 | Create RSS feed parser service | Fetch from ET, Moneycontrol, Livemint |
| 287 | N8N workflow: fetch news every 2 hours | Parse RSS, store articles |
| 288 | Generate text embeddings per article | Anthropic Embeddings API |
| 289 | Relevance scoring per user | Keyword match (stock symbols, MF names) + vector similarity |
| 290 | Create `GET /news/feed` endpoint | Top 20 articles/day with AI summary |
| 291 | Generate 2-sentence AI summary per article | Claude Haiku for speed |
| 292 | Build `/news` page | Article cards with summary, relevance tag, source |
| 293 | Write news feed tests | Relevance scoring, freshness, summary quality |

---

#### 8.2 Monthly AI Report

| # | Task | Details |
|---|---|---|
| 294 | Create `report_writer_agent` | System prompt + Claude Sonnet |
| 295 | Build report prompt template | Month summary, investment vs Nifty, expenses, goals, actions |
| 296 | N8N workflow: generate monthly report | Cron 1st of every month |
| 297 | Store report in `ai_reports` collection | Keep last 12 months |
| 298 | Create `GET /reports` endpoint | Return report list |
| 299 | Create `GET /reports/:id` endpoint | Return specific report |
| 300 | Email report delivery | Send full report via email |
| 301 | Push notification for new report | "Your February financial report is ready" |
| 302 | Build `/reports` page | Report archive, individual report view |
| 303 | Write monthly report tests | Report sections complete, < 30s generation |

---

### Sprint 9 · Settings & Polish (Week 21–22)

---

#### 9.1 Settings Page

| # | Task | Details |
|---|---|---|
| 304 | Build `/settings` page layout | Profile, preferences, notifications, account tabs |
| 305 | Profile editing | Name, income, risk profile, tax bracket |
| 306 | Notification preferences | Toggle per channel: push, email, SMS, WhatsApp |
| 307 | Alert cooldown settings | Customize cooldown duration |
| 308 | Data export | Download all data as JSON/CSV |
| 309 | Account deletion | Soft delete with 30-day grace period |

---

#### 9.2 UI/UX Polish

| # | Task | Details |
|---|---|---|
| 310 | INR number formatting everywhere | `₹1,23,456.78` format across all pages |
| 311 | Loading skeleton screens | All data-fetching pages |
| 312 | Empty state illustrations | When no expenses, holdings, goals exist |
| 313 | Error boundary + toast notifications | Global error handler, success/error toasts |
| 314 | Dark mode toggle | Theme switcher, persist preference |
| 315 | Responsive design audit | Test all pages on mobile, tablet, desktop |
| 316 | Accessibility audit | Keyboard nav, screen reader, color contrast |
| 317 | Performance optimization | Lazy loading, code splitting, image optimization |

---

## 📈 Phase 4 — Scale (Weeks 23–28)

### Sprint 10 · WhatsApp Bot & Admin (Week 23–28)

---

#### 10.1 WhatsApp Bot (Phase 2)

| # | Task | Details |
|---|---|---|
| 318 | Setup Twilio WhatsApp sandbox | Configure webhook |
| 319 | Phone linking in settings | User links phone number |
| 320 | Natural language query parsing | "How much on food?", "Should I hold TCS?", "Add expense 350 Swiggy" |
| 321 | Wire to `finance_orchestrator` agent | Full user context, respond via WhatsApp |
| 322 | Write WhatsApp bot tests | Query parsing, response delivery |

---

#### 10.2 Performance & Scaling

| # | Task | Details |
|---|---|---|
| 323 | Redis caching layer | Cache frequently accessed data (dashboard, net worth) |
| 324 | Database query optimization | Index analysis, slow query logging |
| 325 | API response time monitoring | p95 < 300ms for non-AI endpoints |
| 326 | Load testing | Simulate 1,000 concurrent users |
| 327 | Error monitoring setup | Sentry or similar |
| 328 | CI/CD pipeline | GitHub Actions: lint → test → build → deploy |

---

#### 10.3 Admin Dashboard

| # | Task | Details |
|---|---|---|
| 329 | User management | View users, usage stats |
| 330 | System health dashboard | API latency, error rates, DB stats |
| 331 | N8N workflow monitoring | Run history, failure alerts |
| 332 | AI usage tracking | Token consumption, cost per user |

---

## 📊 Total Task Count

| Phase | Tasks |
|---|---|
| Phase 1 — MVP | 156 tasks |
| Phase 2 — AI Core | 100 tasks |
| Phase 3 — Full Features | 48 tasks |
| Phase 4 — Scale | 15 tasks |
| **Total** | **~332 tasks** |
