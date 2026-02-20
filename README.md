# Facets Sandbox — Configuration Software

A full-stack insurance benefits configuration platform built for Render deployment.

## Features

- **Members** — Enrollment, eligibility management, plan assignment
- **Products** — Insurance product catalog (medical, dental, vision, pharmacy, behavioral)
- **Plans** — Plan configuration with deductibles, OOP maximums, premiums
- **Benefits** — Per-plan benefit rules, copays, coinsurance, prior auth flags
- **Pricing** — Premium rate tables by tier and effective date
- **Claims** — Claims submission, adjudication, and processing workflow
- **Audit Log** — Full change history with diff viewer for compliance

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Auth**: JWT (8-hour sessions)
- **Frontend**: Vanilla JS + custom CSS (no frameworks)

## Quick Start (Local)

```bash
# 1. Clone and install
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# 3. Initialize database
node scripts/init-db.js

# 4. Start server
npm run dev
# → http://localhost:3000
```

## Deploy to Render

1. Push code to GitHub
2. Create new Render Web Service → connect your repo
3. Use `render.yaml` for automatic setup (Web Service + PostgreSQL)
4. After deploy, run init script via Render Shell:
   ```
   node scripts/init-db.js
   ```

## Demo Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | password | Administrator |
| jsmith | password | Manager |
| mjohnson | password | Analyst |
| lwilliams | password | Viewer |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for JWT signing (generate random) |
| `PORT` | Server port (default: 3000) |
| `NODE_ENV` | `development` or `production` |

