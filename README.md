# Ethical Governance Ledger (Demo)

## Run locally (recommended)
1) Install dependencies:
```bash
npm install
```

2) Start server:
```bash
npm start
```

3) Open:
- http://localhost:3000

## Notes
- The game stores a simple in-memory leaderboard (resets when you restart the server).
- The ledger hashing uses WebCrypto when available; otherwise it falls back to a demo-only hash so it won't crash.

