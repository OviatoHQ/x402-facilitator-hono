# x402 Facilitator — Node.js Example

Minimal Node.js server running an x402 facilitator using `@oviato/x402-facilitator-hono` with `@hono/node-server` and in-memory nonce store.

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

3. Fund your gas wallet with test ETH from [Alchemy Faucet](https://www.alchemy.com/faucets/base-sepolia).

## Development

```bash
pnpm dev
```

The server starts on `http://localhost:4020` (or the port specified in `.env`).

## Endpoints

- `GET /facilitator/supported` — List supported networks and schemes
- `POST /facilitator/verify` — Verify a payment payload
- `POST /facilitator/settle` — Settle a payment on-chain
