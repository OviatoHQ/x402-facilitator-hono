# x402 Facilitator — Cloudflare Worker Example

Minimal Cloudflare Worker running an x402 facilitator using `@oviato/x402-facilitator-hono` with KV-backed nonce store.

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Create a KV namespace:
   ```bash
   wrangler kv namespace create NONCE_KV
   ```
   Copy the output `id` into `wrangler.toml`.

3. Set secrets:
   ```bash
   wrangler secret put EVM_PRIVATE_KEY
   wrangler secret put RPC_URL_BASE_SEPOLIA
   ```

4. For local development, copy `.dev.vars.example` to `.dev.vars` and fill in your values.

## Development

```bash
pnpm dev
```

## Deploy

```bash
pnpm deploy
```

## Endpoints

Once deployed, the following endpoints are available:

- `GET /facilitator/supported` — List supported networks and schemes
- `POST /facilitator/verify` — Verify a payment payload
- `POST /facilitator/settle` — Settle a payment on-chain
