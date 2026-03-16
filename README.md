# FinWise AI

**AI-Powered Personal Finance Platform for Indian Investors**

FinWise AI is an intelligent personal finance platform that helps users manage **expenses, investments, financial goals, taxes, and debt** in one place. It combines **financial analytics, automation workflows, and AI agents** to deliver personalized financial insights and recommendations.

The platform is designed primarily for **young Indian professionals** who want a modern, automated way to track and optimize their finances.

---

# Core Features

### Expense Management

* Track daily expenses manually or import bank statements
* AI-powered categorization of transactions
* Budget management by category
* 50/30/20 financial rule analyzer
* Monthly spending analytics and charts
* CSV/PDF transaction import

### Investment Tracking

#### Mutual Funds

* Add and manage MF holdings
* Live NAV tracking
* Historical NAV charts
* Portfolio metrics (CAGR, gain/loss)
* AI-powered fund analysis

#### Stocks

* Portfolio management
* Technical indicators (RSI, MACD, SMA)
* Risk-reward tracking
* Stop-loss and target monitoring
* AI-powered stock verdicts

### Financial Goals

* Create and track goals
* Automatic progress tracking
* Goal feasibility analysis
* SIP recommendations
* Milestone notifications

### Net Worth Tracking

* Consolidated assets and liabilities
* Automatic net worth calculation
* Historical net worth trends
* Asset allocation visualization

### AI Financial Advisor

AI agents analyze your financial data and provide actionable insights:

* Mutual fund analysis agent
* Stock verdict agent
* Expense optimization agent
* Goal planning agent
* Finance orchestrator chat assistant

### Smart Alerts

Real-time alerts for:

* Stop-loss breaches
* Target price hits
* Budget overspending
* Goal milestones
* SIP reminders
* Tax deadlines

### Tax Planning

* 80C deduction tracker
* Old vs New regime comparison
* HRA calculator
* Capital gains summary
* Tax calendar reminders

### Debt Planner

* Loan tracking
* Snowball repayment strategy
* Avalanche repayment strategy
* Extra payment simulator

### Fixed Deposit Optimizer

* Compare FD rates across banks
* Maturity calendar
* Tax-adjusted yield calculations

### Monthly AI Financial Report

Users receive an AI-generated monthly report summarizing:

* Investment performance
* Expense behavior
* Goal progress
* Personalized financial recommendations

---

# Tech Stack

## Frontend

* React
* TypeScript
* Vite
* TailwindCSS
* Recharts / Chart.js
* TradingView Lightweight Charts

## Backend

* FastAPI
* Python
* Pydantic
* Motor (MongoDB async driver)

## Database

* MongoDB

## AI

* Claude AI (Anthropic)
* AI Agents with MCP architecture

## Automation

* N8N workflows

## Infrastructure

* Docker
* Redis (caching)
* AWS S3 (file storage)

## Authentication

* Supabase Auth
* JWT-based session management

---

# Architecture Overview

```
Frontend (React + TypeScript)
        |
        |
Backend API (FastAPI)
        |
        |
MongoDB Database
        |
        |
AI Agents (Claude)
        |
        |
Automation Workflows (N8N)
```

---

# Project Structure

```
finwise-ai
│
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── hooks
│   │   ├── services
│   │   ├── store
│   │   └── utils
│
├── backend
│   ├── app
│   │   ├── routers
│   │   ├── models
│   │   ├── schemas
│   │   ├── services
│   │   ├── core
│   │   └── utils
│
├── mcp_server
│
├── n8n
│
├── docs
│
└── docker-compose.yml
```

---

# Development Roadmap

The development is structured into **four phases**.

## Phase 1 — MVP

* Authentication system
* Expense tracking
* Dashboard analytics
* Mutual fund portfolio tracking
* Stock portfolio tracking
* Goal management
* Net worth dashboard

## Phase 2 — AI Core

* AI investment analysis
* Expense analyzer
* Goal planning AI
* Bank statement PDF import
* Smart alert system
* Finance chat assistant

## Phase 3 — Full Features

* Tax planner
* Debt payoff planner
* Fixed deposit optimizer
* Personalized finance news
* Monthly AI financial reports

## Phase 4 — Scale

* WhatsApp finance bot
* Redis caching
* Performance optimization
* Admin dashboard
* Monitoring and analytics

---

# Installation

## Clone the Repository

```
git clone https://github.com/yourusername/finwise-ai.git
cd finwise-ai
```

---

## Run with Docker

```
docker-compose up --build
```

Services started:

* Backend API
* MongoDB
* Redis
* N8N

---

## Run Frontend

```
cd frontend
npm install
npm run dev
```

---

## Run Backend

```
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

# Environment Variables

Create `.env` files for backend and frontend.

Example:

Backend:

```
MONGODB_URI=
REDIS_URL=
SUPABASE_URL=
SUPABASE_KEY=
ANTHROPIC_API_KEY=
AWS_S3_BUCKET=
```

Frontend:

```
VITE_API_BASE_URL=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

# Security & Compliance

* All AI outputs include a **financial advisory disclaimer**
* Sensitive financial data is **anonymized before AI processing**
* Secure authentication using **Supabase**
* Encrypted storage for uploaded financial documents

---

# Disclaimer

FinWise AI is a **financial information tool**, not a registered investment advisor.
All AI-generated insights are for **educational purposes only** and should not be considered financial advice.

---

# Contributing

Contributions are welcome.

Steps:

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Open a pull request

---

# License

This project is licensed under the **MIT License**.

---

# Future Vision

FinWise AI aims to become an **AI-powered personal CFO for individuals**, helping users make better financial decisions through automation, data analysis, and intelligent recommendations.
