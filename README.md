# Tokenized Securities Exchange – Pro Demo (JS)

A fully working educational simulation of:
- Tokenized securities (AAPL/MSFT/TSLA) + 24/7 trading
- Limit + Market orders with a matching engine (price-time priority)
- Settlement mode toggle: INSTANT vs simulated T+1 (delayed settlement + batch netting)
- Regulator dashboard controls (freeze account, revoke KYC, suspicious flags)
- Circuit breakers (volatility halt)
- Permissioned nodes (simulated validator signatures per ledger block)
- Multi-agency tenants (each agency has its own users, settings, books, and compliance controls)

## Run locally
1. Install Node.js 18+
2. In this folder:
   ```bash
   npm install
   npm start
   ```
3. Open http://localhost:3000

## Demo admin key
- ADMIN_DEMO_KEY

## Notes
- This is an educational simulation (not financial advice, not production-ready).
- "T+1" is simulated as a short delay (default 30 seconds) so you can see queue/netting live.
