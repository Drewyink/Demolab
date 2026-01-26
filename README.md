# AI Ethics Simulator (Web Sandbox) — v2

This is a web-based AI Ethics / Governance simulator with a blockchain-style audit ledger.

## Features
- 30+ scenarios (plus generated scenarios)
- Approve / Override / Audit actions
- Metrics: Trust / Fairness / Profit / Safety / Compliance
- **Audit Budget / Credits** (prevents audit spam)
- **Daily Challenge Mode** (deterministic scenario stream using daily seed)
- **Compliance rule:** High-risk decisions must be audited; repeated breaches trigger shutdown
- Blockchain-style **SHA-256 audit ledger** with chain validation
- Node.js backend for leaderboard + score submissions
- **Admin endpoint** to view recent score submissions (token-protected)

## Run locally
```bash
npm install
npm start
```
Open: http://localhost:3000

## Deploy on Render (Web Service)
- Build command: `npm install`
- Start command: `npm start`
- Add environment variable:
  - `ADMIN_TOKEN` = a strong random string (for /api/admin/scores)

Admin endpoint:
- `https://YOUR-APP.onrender.com/api/admin/scores?token=YOUR_ADMIN_TOKEN`

## Embed in WordPress
Use a Custom HTML block:

```html
<iframe
  src="https://yourgame.onrender.com"
  style="width:100%; height:720px; border:0; border-radius:16px;"
  allow="fullscreen"
></iframe>
```
