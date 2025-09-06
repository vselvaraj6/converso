# Converso - AI-Powered Lead Nurturing Platform

Converso is an intelligent lead nurturing and conversion platform that uses AI to automate customer interactions through SMS, voice calls, and calendar scheduling.

## Features

- 🤖 AI-powered smart replies using OpenAI
- 📱 SMS communication via Twilio
- 🎙️ Voice call automation with VAPI
- 📅 Calendar integration with Google Calendar
- 🔄 CRM integration with Zoho
- 📊 Lead sentiment analysis and scoring
- ⏰ Automated outbound campaigns

## Quick Start

### Using Docker (Recommended)

1. Clone the repository
2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` with your API keys
4. Start the application:
   ```bash
   make dev
   ```

The application will be available at http://localhost:8000

### Local Development

1. Install dependencies:
   ```bash
   make install
   ```
2. Set up database:
   ```bash
   make db-setup
   ```
3. Run the application:
   ```bash
   make run
   ```

## Deployment on Railway (Recommended)

Railway provides the easiest deployment with automatic SSL, databases, and scaling.

### Prerequisites
1. Create a [Railway account](https://railway.app)
2. Install Railway CLI:
   ```bash
   # macOS/Linux
   curl -fsSL https://railway.app/install.sh | sh
   
   # Windows
   scoop install railway
   ```

### Deploy Steps

1. **Login to Railway:**
   ```bash
   railway login
   ```

2. **Create a new project:**
   ```bash
   railway init
   ```

3. **Add PostgreSQL and Redis:**
   ```bash
   # In Railway dashboard or CLI
   railway add
   # Select PostgreSQL and Redis
   ```

4. **Set environment variables:**
   ```bash
   # Copy from .env.example
   railway variables set TWILIO_ACCOUNT_SID=your_sid
   railway variables set TWILIO_AUTH_TOKEN=your_token
   railway variables set OPENAI_API_KEY=your_key
   # ... set all required variables
   ```

5. **Deploy:**
   ```bash
   railway up
   ```

6. **Run migrations:**
   ```bash
   railway run alembic upgrade head
   ```

7. **Get your app URL:**
   ```bash
   railway open
   ```

### Railway Environment Variables

Railway automatically provides:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `PORT` - Port to bind to

You need to add:
- `SECRET_KEY` - Generate a secure key
- `TWILIO_ACCOUNT_SID` - From Twilio dashboard
- `TWILIO_AUTH_TOKEN` - From Twilio dashboard  
- `TWILIO_PHONE_NUMBER` - Your Twilio phone number
- `OPENAI_API_KEY` - From OpenAI platform
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `VAPI_API_KEY` - From VAPI dashboard
- `ZOHO_CLIENT_ID` - From Zoho API Console
- `ZOHO_CLIENT_SECRET` - From Zoho API Console

### Monitoring

Railway provides:
- Logs: `railway logs`
- Metrics: Available in dashboard
- Deployments: Automatic on git push

## Alternative Deployment Options

### Render
Push to GitHub and Render will auto-deploy based on `render.yaml`

### Fly.io
```bash
flyctl launch
flyctl deploy
```

### Docker (Any VPS)
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## API Documentation

Once running, access the interactive API docs at:
- Swagger UI: https://your-app.railway.app/docs
- ReDoc: https://your-app.railway.app/redoc

## Webhooks Configuration

After deployment, configure webhooks:

1. **Twilio SMS Webhook:**
   - URL: `https://your-app.railway.app/api/webhooks/twilio/inbound`
   - Method: POST

2. **VAPI Voice Webhook:**
   - URL: `https://your-app.railway.app/api/webhooks/vapi/inbound`
   - Method: POST

## Architecture

- **FastAPI** - Modern Python web framework with automatic API documentation
- **PostgreSQL** - Primary database for storing leads, messages, and conversations
- **Redis** - Caching and message queue for background tasks
- **Celery** - Distributed task processing for outbound campaigns
- **SQLAlchemy** - Async ORM for database operations
- **Docker** - Containerization for easy deployment

## How It Works

1. **Inbound Messages**: Webhooks from Twilio/VAPI → FastAPI endpoints → AI processing → Smart replies
2. **Outbound Campaigns**: Scheduled Celery tasks → Lead qualification → SMS/Voice outreach
3. **Calendar Booking**: Intent detection → Google Calendar API → Automated scheduling
4. **Lead Nurturing**: Sentiment analysis → Dynamic responses → Status tracking

## Development

### Setup Development Environment
```bash
./scripts/setup-dev.sh
```

### Code Quality Tools

**Linters configured:**
- **Black** - Code formatter (PEP 8 compliant)
- **isort** - Import statement organizer
- **flake8** - Style guide enforcement
- **pylint** - Code analysis
- **mypy** - Static type checker
- **bandit** - Security vulnerability scanner
- **pydocstyle** - Docstring conventions
- **detect-secrets** - Prevent secrets in code

### Development Commands

```bash
# Code formatting
make format              # Auto-format all code

# Run all linters
make lint               # Run all code quality checks

# Run specific linters
make lint-flake8        # Style guide checks
make lint-black         # Format checking
make lint-isort         # Import order checking
make lint-pylint        # Code analysis
make lint-mypy          # Type checking
make lint-bandit        # Security scanning
make lint-secrets       # Secret detection

# Testing
make test               # Run all tests
make test-cov           # Run tests with coverage
make test-file file=test_workflow.py  # Run specific test

# Database
make migrate            # Run migrations
make migrate-create msg="your message"  # Create migration

# Pre-commit hooks
make pre-commit-install # Install git hooks
make pre-commit-run     # Run hooks manually
```

### Pre-commit Hooks

Pre-commit hooks automatically run before each commit to ensure code quality:

1. **Install hooks:**
   ```bash
   make pre-commit-install
   ```

2. **Skip hooks (if needed):**
   ```bash
   git commit -m "message" --no-verify
   ```

3. **Run manually:**
   ```bash
   make pre-commit-run
   ```

## Troubleshooting

### Railway Deployment Issues

1. **Database connection errors:**
   - Ensure PostgreSQL addon is provisioned
   - Check DATABASE_URL is set correctly

2. **Redis connection errors:**
   - Ensure Redis addon is provisioned
   - Check REDIS_URL is set correctly

3. **Build failures:**
   - Check logs: `railway logs`
   - Ensure all dependencies are in requirements.txt

4. **Webhook not receiving data:**
   - Verify webhook URL is correct
   - Check Twilio/VAPI webhook configuration
   - Review logs for errors