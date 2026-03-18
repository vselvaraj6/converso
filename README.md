# Converso

Converso is an AI-powered sales CRM that automates lead nurturing through voice calls, SMS, and calendar scheduling. It is designed for sales teams that want to run intelligent outreach at scale without sacrificing a human touch.

---

## Project Overview

Converso manages the full lead lifecycle: capture, qualification, conversation, appointment booking, and conversion tracking. An AI assistant handles inbound and outbound SMS, answers voice calls via VAPI, books meetings directly into Cal.com, and escalates qualified leads to human agents — all from a single dashboard.

---

## Architecture

```
Browser
  └── nginx (port 8080)
        ├── /api  → FastAPI backend (port 8001)
        └── /     → Next.js frontend (port 3000)

FastAPI backend
  ├── PostgreSQL 15 (database)
  ├── Redis (task broker + cache)
  ├── Celery worker (background tasks: SMS, AI replies)
  ├── Celery beat (scheduled nudges)
  ├── Twilio (inbound/outbound SMS + voice)
  ├── VAPI (AI voice calls)
  └── Cal.com (appointment scheduling, port 3001)
```

---

## Features

| Page | Description |
|------|-------------|
| Dashboard | Live KPI summary, lead trend chart, upcoming meetings |
| Lead Pipeline | Full CRUD lead management with pagination, search, filters, CSV import/export |
| Lead Detail | Conversation history, sentiment analysis, meeting log, AI nudge controls |
| Conversations | Inbound/outbound SMS thread view per lead |
| Calendar / Meetings | Upcoming and historical meeting list synced with Cal.com |
| Analytics | Pipeline metrics, conversation breakdown, response time charts |
| Conversions | Closed-won deal tracking with revenue and conversion time stats |
| Campaigns | Automated email and SMS campaign management |
| Team Management | Multi-user team management with role-based access control |
| AI Training | Dataset management, intent review, sandbox testing, model analytics |
| Conversation Builder | Visual flow editor for designing AI conversation scripts |
| Settings | Company configuration, Cal.com booking URLs, Twilio phone number |
| Platform Admin | Superuser dashboard for managing all client tenants |

---

## Quick Start (Docker)

### 1. Clone and configure

```bash
git clone <repo-url>
cd converso
cp .env.example .env
# Fill in required API keys (see Environment Setup below)
```

### 2. Start the stack

```bash
docker compose up -d
```

This starts nginx, the Next.js frontend, the FastAPI backend, Cal.com, PostgreSQL, Redis, and the Celery workers.

> **Note:** If Docker networking fails with iptables errors, run the included fix script:
> ```bash
> sudo bash scripts/fix-iptables.sh
> ```

### 3. Create your first account

Open `http://localhost:8080` and click **Create one** to register. The first registered user on a fresh database can be promoted to superuser via:

```bash
docker compose exec postgres psql -U converso -d converso \
  -c "UPDATE users SET is_superuser = true WHERE email = 'your@email.com';"
```

---

## Environment Setup

Copy `.env.example` to `.env` and fill in the following required keys:

| Variable | Description |
|----------|-------------|
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Twilio sending number (E.164 format) |
| `OPENAI_API_KEY` | OpenAI API key for AI reply generation |
| `VAPI_API_KEY` | VAPI API key for AI voice calls |
| `VAPI_PHONE_NUMBER_ID` | VAPI phone number ID |
| `CALCOM_API_KEY` | Cal.com API key for meeting management |
| `SECRET_KEY` | JWT signing secret (generate a random 32+ char string) |
| `DATABASE_URL` | PostgreSQL connection string (set automatically in Docker) |

---

## Port Reference

| Service | Port | Notes |
|---------|------|-------|
| App (nginx) | 8080 | Primary entry point — use this in the browser |
| FastAPI backend | 8001 | Also accessible directly for API testing |
| Cal.com | 3001 | Self-hosted scheduling UI |
| PostgreSQL | 5432 | Exposed for local DB tools |
| Next.js (internal) | 3000 | Internal only; accessed via nginx |
| Redis (internal) | 6379 | Internal only |

---

## Development (without Docker)

### Backend

```bash
cd converso  # repo root
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Requires a running PostgreSQL and Redis instance
alembic upgrade head
uvicorn app.main:app --reload --port 8001
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

### Celery workers

```bash
celery -A app.celery_app worker --loglevel=info
celery -A app.celery_app beat --loglevel=info
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, shadcn/ui, Recharts |
| Backend | FastAPI (Python 3.11) |
| Database | PostgreSQL 15 |
| Task queue | Celery + Redis |
| SMS | Twilio |
| AI replies | OpenAI GPT-4 |
| Voice calls | VAPI |
| Calendar | Cal.com (self-hosted) |
| Reverse proxy | nginx |
| Containerisation | Docker Compose |

---

## API Reference

Interactive API docs are available at `http://localhost:8001/docs` when the backend is running.

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account and company |
| POST | `/api/auth/login` | Get JWT token |
| GET | `/api/auth/me` | Current user info |
| PATCH | `/api/auth/me` | Update current user profile |

### Leads

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/leads/` | List leads (paginated, filterable) |
| POST | `/api/leads/` | Create a lead |
| GET | `/api/leads/{id}` | Lead detail |
| POST | `/api/leads/import` | Bulk import from CSV or Excel |
| GET | `/api/leads/export` | Export all leads as CSV |

### Webhooks (called by external services)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/webhooks/twilio/inbound` | Inbound SMS from Twilio |
| POST | `/api/webhooks/vapi/inbound` | Voice call events from VAPI |
| POST | `/api/webhooks/calcom` | Booking notifications from Cal.com |

### Platform Admin (superuser only)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/platform/companies` | List all tenant companies |
| GET | `/api/platform/companies/{id}` | Tenant detail with users |
| PATCH | `/api/platform/companies/{id}` | Update tenant config |
| DELETE | `/api/platform/companies/{id}` | Offboard a tenant |
