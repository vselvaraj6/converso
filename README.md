# Converso

AI-powered lead nurturing platform — SMS, voice, and calendar automation for solo founders and small sales teams.

---

## Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router) + Tailwind CSS |
| **Backend** | FastAPI (Python) |
| **Database** | PostgreSQL 15 |
| **Task queue** | Celery + Redis |
| **SMS** | Twilio |
| **AI replies** | OpenAI GPT-4 |
| **Voice calls** | VAPI |
| **Calendar** | Google Calendar API |
| **Reverse proxy** | nginx |
| **Tunnel** | Cloudflare Tunnel |

Everything runs via Docker Compose — one command to start the whole stack.

---

## Quick Start

### 1. Clone and configure

```bash
git clone <repo>
cd converso
cp .env.example .env   # fill in your API keys (see below)
```

### 2. Start the stack

```bash
docker compose up -d --build
```

This starts:
- **nginx** on port 80 (the only port you need to expose)
- **Next.js** frontend on port 3000 (internal)
- **FastAPI** backend on port 8000 (internal)
- **PostgreSQL** on port 5432 (internal)
- **Redis** on port 6379 (internal)
- **Celery worker + beat** (background task runners)

### 3. Create your account

Open `http://localhost` → click **Create one** → fill in your name, company, email and password.

### 4. Configure Cloudflare Tunnel

Point your Cloudflare tunnel to `http://localhost:80` (nginx handles routing internally).

```yaml
# cloudflared config.yml
tunnel: <your-tunnel-id>
ingress:
  - hostname: converso.yourdomain.com
    service: http://localhost:80
  - service: http_status:404
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
# ── Application ───────────────────────────────────────────────────────────────
APP_NAME=Converso
APP_ENV=production
SECRET_KEY=your-very-long-random-secret-key-here   # openssl rand -hex 32

# ── Twilio (SMS) ──────────────────────────────────────────────────────────────
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# ── OpenAI (AI replies) ───────────────────────────────────────────────────────
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo

# ── VAPI (voice calls) ────────────────────────────────────────────────────────
VAPI_API_KEY=your_vapi_key

# ── Google Calendar ───────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://converso.yourdomain.com/auth/google/callback
```

Generate a secret key:
```bash
openssl rand -hex 32
```

---

## Twilio Webhook Setup

In your [Twilio console](https://console.twilio.com) → Phone Numbers → your number → Messaging:

- **Webhook URL:** `https://converso.yourdomain.com/api/webhooks/twilio/inbound`
- **Method:** `POST`

All inbound SMS messages will be automatically processed by the AI.

---

## How It Works

### Inbound SMS flow
```
Lead texts your Twilio number
  → Twilio webhook → /api/webhooks/twilio/inbound
  → Identify lead by phone number
  → OpenAI analyses sentiment + intent
  → OpenAI generates smart reply
  → If booking intent → create Google Calendar event
  → Reply sent via Twilio
  → Lead status + sentiment updated in DB
```

### Outbound campaign (scheduled)
```
Every 15 minutes: Celery beat fires send_scheduled_messages
  → Find leads not contacted in 48h (status: new/contacted, <3 call attempts)
  → For new leads with no response: initiate VAPI voice call
  → For others: send AI-generated follow-up SMS
  → Update lead contact timestamps
```

### New lead cold outreach
```
Every 5 minutes: process_new_leads task runs
  → Find NEW leads with 0 call attempts
  → Send AI cold outreach SMS (batch of 30)
```

---

## API Reference

Interactive docs available at `https://converso.yourdomain.com/docs`

### Auth endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account + company |
| POST | `/api/auth/login` | Get JWT token |
| GET  | `/api/auth/me` | Current user info |

### Lead endpoints (require Bearer token)
| Method | Path | Description |
|--------|------|-------------|
| GET  | `/api/leads/` | List leads (paginated, filterable by status) |
| POST | `/api/leads/` | Create lead |
| GET  | `/api/leads/{id}` | Lead detail |

### Message endpoints (require Bearer token)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/messages/lead/{lead_id}` | Conversation history for a lead |
| GET | `/api/messages/thread/{thread_id}` | All messages in a thread |

### Webhook endpoints (public — called by Twilio/VAPI)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/webhooks/twilio/inbound` | Inbound SMS from Twilio |
| POST | `/api/webhooks/vapi/inbound` | Voice call events from VAPI |

---

## Development

### Run locally (without Docker)

```bash
# Backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev          # http://localhost:3000
```

### Useful commands

```bash
# View logs
docker compose logs -f app
docker compose logs -f celery-worker

# Restart a single service
docker compose restart app

# Run database migrations
docker compose exec app alembic upgrade head

# Tail all logs
docker compose logs -f

# Stop everything
docker compose down

# Stop and wipe data (careful!)
docker compose down -v
```

---

## Project Structure

```
converso/
├── app/                    # FastAPI backend
│   ├── api/
│   │   ├── auth.py         # Login, register, JWT
│   │   ├── leads.py        # Lead CRUD
│   │   ├── messages.py     # Message history
│   │   └── webhooks.py     # Twilio + VAPI webhooks
│   ├── core/
│   │   ├── config.py       # Settings from .env
│   │   ├── database.py     # Async SQLAlchemy engine
│   │   └── security.py     # JWT + password hashing
│   ├── integrations/
│   │   ├── twilio.py       # SMS sending
│   │   ├── openai.py       # AI replies + sentiment
│   │   ├── vapi.py         # Voice call automation
│   │   └── google_calendar.py
│   ├── models/             # SQLAlchemy ORM models
│   ├── services/
│   │   └── workflow_service.py  # Core business logic
│   └── tasks/
│       ├── celery_app.py   # Celery config + beat schedule
│       └── lead_tasks.py   # Background task implementations
├── frontend/               # Next.js dashboard
│   ├── app/
│   │   ├── login/
│   │   ├── register/
│   │   └── dashboard/
│   │       ├── page.tsx         # Overview / stats
│   │       ├── leads/           # Lead list + detail
│   │       ├── conversations/   # Active conversations
│   │       └── settings/        # Config + API keys guide
│   ├── components/
│   │   └── Sidebar.tsx
│   └── lib/
│       └── api.ts          # API client
├── nginx.conf              # Reverse proxy config
├── docker-compose.yml      # Full stack orchestration
└── .env                    # Your secrets (never commit this)
```

---

## Security Notes

- JWT tokens expire after **7 days**. Rotate your `SECRET_KEY` to invalidate all sessions.
- Webhook endpoints are intentionally public (required by Twilio/VAPI).
- All other API endpoints require a valid Bearer token.
- Never commit `.env` to git — it is already in `.gitignore`.

---

## GitHub Actions Self-Hosted Runner Setup

Run these commands **on your homelab machine** (one time only).

### Step 1 — Get a registration token from GitHub

Go to: `https://github.com/vselvaraj6/converso/settings/actions/runners/new`

Select **Linux** and copy the token shown on that page. It looks like `AXXXXXXXXXXXXXXXXXXXXXXXXX`.

### Step 2 — Download and configure the runner

```bash
# Create a directory for the runner
mkdir -p ~/actions-runner && cd ~/actions-runner

# Detect your CPU architecture automatically
ARCH=$(uname -m)
case $ARCH in
  x86_64)  RUNNER_ARCH="x64" ;;
  aarch64) RUNNER_ARCH="arm64" ;;
  armv7l)  RUNNER_ARCH="arm" ;;
  *)       echo "Unknown arch: $ARCH"; exit 1 ;;
esac

# Download the latest runner (check https://github.com/actions/runner/releases for latest version)
RUNNER_VERSION="2.322.0"
curl -fsSL -o actions-runner.tar.gz \
  "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-${RUNNER_ARCH}-${RUNNER_VERSION}.tar.gz"

# Verify the download succeeded
ls -lh actions-runner.tar.gz

# Extract
tar xzf actions-runner.tar.gz

# Configure (paste YOUR token from Step 1 after --token)
./config.sh \
  --url https://github.com/vselvaraj6/converso \
  --token YOUR_TOKEN_HERE \
  --name homelab \
  --unattended
```

### Step 3 — Install as a systemd service (survives reboots)

```bash
sudo ./svc.sh install
sudo ./svc.sh start

# Verify it's running
sudo ./svc.sh status
```

### Step 4 — Allow the runner to use Docker

```bash
# Replace 'ubuntu' with whatever user the runner runs as
sudo usermod -aG docker ubuntu
# Log out and back in (or run: newgrp docker)
```

### Step 5 — Confirm it's online

Go to `https://github.com/vselvaraj6/converso/settings/actions/runners` — you should see **homelab** with a green **Idle** status.

---

## Troubleshooting

**Frontend can't reach the API**
- Check `docker compose logs nginx` — nginx must be running
- Verify the frontend container started: `docker compose ps`

**Twilio webhook returning errors**
- Confirm your Cloudflare tunnel is active: `cloudflared tunnel info`
- Test with `curl -X POST https://converso.yourdomain.com/api/webhooks/twilio/inbound`

**Celery tasks not running**
- Check `docker compose logs celery-beat` — should log every 5/15 minutes
- Check `docker compose logs celery-worker` for task errors

**Database connection errors**
- Wait ~10s after `docker compose up` for PostgreSQL to finish initialising
- Run `docker compose ps` — postgres healthcheck must show `healthy`
