# Converso

Converso is an AI-powered sales CRM that automates the full lead lifecycle — from capture and qualification through engagement, appointment booking, and conversion — without sacrificing a human touch.

---

## User Journey

The platform implements the complete 6-step conversational AI sales journey:

| Step | Action | How Converso handles it |
|------|--------|-------------------------|
| 1 | **Lead Capture** | CSV/Excel bulk import, manual entry, or direct API integration with your existing CRM |
| 2 | **Qualification** | OpenAI analyzes every inbound message for sentiment, intent, and urgency. Lead score updates automatically. |
| 3 | **Engagement** | AI sends personalized SMS using per-company tone, industry lingo, and company memory. Outbound campaigns run on configurable nudge intervals. |
| 4 | **Scheduling** | Cal.com integration books meetings automatically when the AI detects scheduling intent, or proposes available slots. |
| 5 | **Follow-up** | Celery beat runs scheduled outbound campaigns. Configurable call retry (max attempts + hours between attempts). SMS fallback fires automatically after all call attempts are exhausted. |
| 6 | **Handoff** | VAPI AI voice calls escalate warm leads. Frustrated leads (negative sentiment + unanswered questions) are auto-flagged for human review. Agents see a "Needs Attention" count on the dashboard and can resolve flags after follow-up. |

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
  ├── Celery worker (background tasks: SMS, AI replies, voice calls)
  ├── Celery beat (scheduled nudges — every 15 min)
  ├── Twilio (inbound/outbound SMS)
  ├── VAPI (AI voice calls with per-lead context injection)
  ├── Cal.com (self-hosted appointment scheduling, port 3001)
  └── Resend (booking confirmation emails)
```

Multi-tenant: all tenants share a single database, isolated by `company_id` on every row.

---

## Features

| Page | Description |
|------|-------------|
| Dashboard | Live KPIs: total leads, meetings, conversion rate, SMS sent, **Needs Attention count** (flagged leads) |
| Lead Pipeline | Full CRUD with pagination, search, status/human-review filters, CSV/Excel import and export |
| Lead Detail | Conversation history, sentiment, lead score, meeting log, manual SMS, escalate/resolve review |
| Conversations | Inbound/outbound SMS thread view per lead |
| Meetings | Upcoming and historical meetings synced from Cal.com |
| Analytics | Pipeline funnel, intent distribution, sentiment breakdown, channel mix, daily lead trend |
| Conversions | Closed-won deal tracking with revenue and conversion time stats |
| Campaigns | Automated outreach campaign management (mortgage/refi sequences + custom) |
| Team | Multi-user team management with role-based access (admin / write / read) |
| AI Training | Intent review, sandbox testing, dataset management, model analytics |
| Conversation Builder | Visual flow editor for designing AI conversation scripts |
| Settings | Company config, Cal.com URLs, Twilio number, AI tone/temperature, industry lingo |
| Platform Admin | Superuser dashboard: manage all client tenants, AI config, call retry config |

### AI Capabilities

- **Sentiment & intent analysis** — classifies every inbound message in real time (sentiment, intent, urgency, datetime extraction)
- **Smart replies** — context-aware SMS replies using full conversation history, lead stage, and urgency
- **Cold outreach generation** — personalized first-contact messages per lead
- **Conversation summarization** — 2-3 sentence summary injected into VAPI voice call context
- **Urgency-aware prompting** — system prompt adapts to lead status (NEW/CONTACTED/QUALIFIED) and urgency level

### Outbound Automation

- Working hours enforcement — calls only fire within the assigned agent's timezone window
- Configurable call retry — per-company `max_attempts` (default 3) and `hours_between_attempts` (default 8)
- SMS fallback — automatic nurture SMS after all call attempts are exhausted
- Mortgage/refi campaign sequences — 30-message scripted sequences for mortgage industry leads

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

This starts nginx, Next.js, FastAPI, Cal.com, PostgreSQL, Redis, and Celery workers.

> **Note:** If Docker networking fails with iptables errors, run the included fix script:
> ```bash
> sudo bash scripts/fix-iptables.sh
> ```

### 3. Run database migrations

```bash
docker compose exec app alembic upgrade head
```

### 4. Create your first account

Open `http://localhost:8080` and click **Create one** to register. Promote to superuser:

```bash
docker compose exec postgres psql -U converso -d converso \
  -c "UPDATE users SET is_superuser = true WHERE email = 'your@email.com';"
```

---

## Environment Setup

Copy `.env.example` to `.env` and fill in the following:

| Variable | Required | Description |
|----------|----------|-------------|
| `TWILIO_ACCOUNT_SID` | ✅ | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | ✅ | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | ✅ | Twilio sending number (E.164 format) |
| `OPENAI_API_KEY` | ✅ | OpenAI API key for AI reply generation |
| `VAPI_API_KEY` | ✅ | VAPI API key for AI voice calls |
| `VAPI_PHONE_NUMBER_ID` | ✅ | VAPI phone number ID |
| `CALCOM_API_KEY` | ✅ | Cal.com API key for meeting management |
| `CALCOM_WEBHOOK_SECRET` | ✅ | Cal.com webhook signing secret |
| `SECRET_KEY` | ✅ | JWT signing secret (32+ random chars) |
| `DATABASE_URL` | auto | Set automatically in Docker |
| `RESEND_API_KEY` | optional | Resend API key for booking confirmation emails |
| `EMAIL_FROM_DOMAIN` | optional | Sending domain for emails (default: `converso.ai`) |

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
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

alembic upgrade head
uvicorn app.main:app --reload --port 8001
```

### Frontend

```bash
cd frontend
npm install
npm run dev  # http://localhost:3000
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
| Frontend | Next.js 14 (App Router), Tailwind CSS, Recharts |
| Backend | FastAPI (Python 3.11) |
| Database | PostgreSQL 15 |
| Task queue | Celery + Redis |
| SMS | Twilio |
| AI replies | OpenAI GPT-4 / GPT-3.5 fallback |
| Voice calls | VAPI |
| Calendar | Cal.com (self-hosted) |
| Email | Resend HTTP API |
| Reverse proxy | nginx |
| Containerisation | Docker Compose |

---

## API Reference

Interactive docs: `http://localhost:8001/docs`

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account and company |
| POST | `/api/auth/login` | Get JWT token |
| GET | `/api/auth/me` | Current user info |
| PATCH | `/api/auth/me` | Update profile |
| GET | `/api/auth/company` | Company config |
| PATCH | `/api/auth/company` | Update company config |

### Leads

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/leads/` | List leads (paginated; filter by `status`, `needs_human_review`) |
| POST | `/api/leads/` | Create a lead |
| GET | `/api/leads/{id}` | Lead detail |
| PATCH | `/api/leads/{id}` | Update lead fields |
| DELETE | `/api/leads/{id}` | Delete a lead |
| POST | `/api/leads/import` | Bulk import from CSV or Excel |
| GET | `/api/leads/export` | Export all leads as CSV |
| POST | `/api/leads/{id}/escalate` | Flag lead for human review |
| POST | `/api/leads/{id}/resolve-review` | Clear human review flag |
| POST | `/api/leads/{id}/sms` | Send manual SMS |

### Webhooks (called by external services)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/webhooks/twilio/inbound` | Inbound SMS from Twilio |
| POST | `/api/webhooks/vapi/inbound` | Voice call end-of-call events from VAPI |
| POST | `/api/webhooks/calcom` | Booking notifications from Cal.com → sets lead CONVERTED, sends confirmation email |

### Analytics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/analytics/overview` | KPIs, funnel, channel mix, intent distribution, daily trends |

### Platform Admin (superuser only)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/platform/companies` | List all tenant companies |
| GET | `/api/platform/companies/{id}` | Tenant detail with users |
| PATCH | `/api/platform/companies/{id}` | Update tenant settings |
| PATCH | `/api/platform/companies/{id}/ai-config` | Update AI prompt config (tone, temperature, lingo, memory) |
| PATCH | `/api/platform/companies/{id}/call-config` | Update call retry config (max attempts, hours between) |
| POST | `/api/platform/companies/{id}/users` | Add user to tenant |
| DELETE | `/api/platform/users/{id}` | Remove a user |
| DELETE | `/api/platform/companies/{id}` | Offboard a tenant (all data) |

---

## Lead Lifecycle

```
NEW → CONTACTED → QUALIFIED → CONVERTED
                              ↑
                   Cal.com BOOKING_CREATED webhook
                   (also triggers booking confirmation email)

Any stage → LOST          (intent: not_interested → also flags for human review)
Any stage → needs_human_review = true   (auto: negative sentiment + question)
                                         (manual: POST /api/leads/{id}/escalate)
```

---

## Marketing Strategy

### Target Segments

**Primary:** B2B SaaS companies and financial services firms (mortgage brokers, insurance, wealth management) that run high-volume outbound sales and need AI to handle the first 5–7 touchpoints before a human closes.

**Secondary:** Real estate agencies and staffing firms that need appointment-heavy pipelines automated.

### Value Proposition

> *"Your AI sales team that never sleeps — qualifies leads, books meetings, and hands off warm prospects to your closers."*

Key differentiators:
- Full lifecycle automation (not just chatbot / not just dialer) — SMS + voice + calendar in one
- Working hours enforcement prevents out-of-hours calls that destroy trust
- Human handoff is seamless: AI flags frustrated leads; agents see them instantly on dashboard
- Per-tenant AI config (tone, lingo, memory) — adapts to every company's brand voice
- Mortgage/refi industry sequences built-in — zero setup for the #1 use case

### Go-to-Market

**Phase 1 — Niche dominance (months 1–3)**
- Launch into mortgage broker market (sequences already built)
- Partner with 2–3 mid-size brokerages as design partners
- Offer white-glove onboarding: import leads, configure AI tone, set working hours
- Target: 5 paying customers, $5k MRR

**Phase 2 — Self-serve expansion (months 4–6)**
- Launch self-serve sign-up with 14-day free trial (no credit card)
- Content: "How we booked 3x more meetings for [Partner]" case study
- SEO: "AI for mortgage leads", "automated SMS follow-up real estate"
- Target: 25 customers, $25k MRR

**Phase 3 — Platform play (months 7–12)**
- API-first: publish embeddable lead capture widget + Zapier integration
- Launch marketplace: let agencies sell Converso to their network (rev-share)
- Expand verticals: real estate, staffing, insurance
- Target: 100 customers, $100k MRR

### Pricing (suggested)

| Plan | Price | Leads | Messages |
|------|-------|-------|----------|
| Starter | $149/mo | 500 | 5,000 SMS |
| Growth | $399/mo | 2,000 | 20,000 SMS + voice |
| Scale | $999/mo | 10,000 | Unlimited + priority support |

Voice calls billed at cost pass-through (VAPI + Twilio rates).

### Key Metrics to Track

- **Time-to-first-contact** — how fast the AI reaches a new lead (target: < 5 min)
- **AI → Human handoff rate** — % of conversations escalated (healthy: 10–20%)
- **Meeting show rate** — % of booked leads who attend
- **Conversion rate** — CONVERTED leads / total leads (benchmark: 3–8% for cold outbound)
- **SMS opt-out rate** — monitor for aggressive cadence (keep < 2%)
