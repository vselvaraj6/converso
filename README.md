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
| **AI replies** | OpenAI GPT-3.5 / GPT-4 |
| **Voice calls** | VAPI |
| **Calendar** | Cal.com (Self-hosted or Cloud) |
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
- **nginx** on port **8080** (the primary entry point for the project)
- **Next.js** frontend on port 3000 (internal)
- **FastAPI** backend on port 8001 (internal and exposed)
- **Cal.com** self-hosted on port 3001
- **PostgreSQL** on port 5432 (internal and exposed)
- **Redis** on port 6379 (internal)
- **Celery worker + beat** (background task runners)

### 3. Create your account

Open `http://localhost:8080` → click **Create one** → fill in your name, company, email and password.

---

## Multi-Tenancy & Roles

Converso is built as a multi-tenant SaaS platform with three distinct access levels:

1.  **Platform Admin (Superuser):** Manage the entire platform, oversee all clients (companies), and perform administrative overrides.
2.  **Company Admin:** Manage company-wide settings, AI memory, and team members.
3.  **Sales Agent:** Manage assigned leads, view conversations, and connect personal work calendars.

---

## API Reference

Interactive docs available at `https://converso.yourdomain.com/docs`

### Auth endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account + company |
| POST | `/api/auth/login` | Get JWT token |
| GET  | `/api/auth/me` | Current user info |

### Platform Admin (Superuser only)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/platform/companies` | List all tenants with stats |
| GET | `/api/platform/companies/{id}` | Detailed tenant info + users |
| PATCH | `/api/platform/companies/{id}` | Administrative config override |
| DELETE | `/api/platform/companies/{id}` | Permanently offboard tenant |

### Lead endpoints (require Bearer token)
| Method | Path | Description |
|--------|------|-------------|
| GET  | `/api/leads/` | List leads (paginated, filterable by status) |
| POST | `/api/leads/` | Create lead |
| GET  | `/api/leads/{id}` | Lead detail |
| POST | `/api/leads/import` | Mass upload from CSV/Excel |

### Webhook endpoints (public — called by Twilio/VAPI/Cal.com)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/webhooks/twilio/inbound` | Inbound SMS from Twilio |
| POST | `/api/webhooks/vapi/inbound` | Voice call events from VAPI |
| POST | `/api/webhooks/calcom` | Booking notifications from Cal.com |

---

## How It Works

### Master Orchestrator Scheduling
Converso uses a hierarchical scheduling logic to ensure leads can always book a meeting:
1.  **Priority 1:** Agent's Personal Booking URL (set in Settings).
2.  **Priority 2:** Company Team Round Robin link (set by Company Admin).
3.  **Fallback:** AI-managed polite follow-up if no links are configured.

---

## Development & Testing

### Running Tests
```bash
# Run the full test suite via Docker
docker compose run --rm -e APP_ENV=testing app pytest
```

### Useful commands
```bash
# Run database migrations
docker compose exec app alembic upgrade head

# Promote a user to Superuser
docker compose exec postgres psql -U converso -d converso -c "UPDATE users SET is_superuser = true WHERE email = 'your@email.com';"
```
