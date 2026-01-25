# AI Face Aging Demo + Accounts (Node + HTML/CSS)

Fully working lab demo with:
- Email/password signup & login
- Secure password hashing (bcryptjs)
- Session tokens in httpOnly cookies
- User-specific saved generation history ("My Results")
- Face aging simulation using Sharp (filters + overlays) — no external AI API

## Run locally
```bash
npm install
npm start
```
Open: http://localhost:3000

## Deploy (Render-style)
Build: `npm install`
Start: `npm start`

## Data storage
This kit uses file-based JSON storage under `storage/data/` for simplicity.
On free hosts, disk can be ephemeral (may reset on redeploy). For “real” persistence,
swap to Postgres later.
