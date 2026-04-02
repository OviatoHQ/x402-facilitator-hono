# @oviato/x402-facilitator-hono

Mountable Hono sub-app implementing the [x402](https://github.com/coinbase/x402) facilitator protocol.

[![npm version](https://img.shields.io/npm/v/@oviato/x402-facilitator-hono)](https://www.npmjs.com/package/@oviato/x402-facilitator-hono)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

## What is this?

In the x402 protocol, a **facilitator** is the service that verifies payment signatures and settles transactions on-chain. Resource servers delegate payment verification and settlement to a facilitator instead of interacting with blockchains directly.

This package wraps the official Coinbase x402 packages (`@x402/core`, `@x402/evm`, `@x402/svm`) into a Hono sub-app with three endpoints. Mount it on any Hono app and you have a working facilitator — on Cloudflare Workers, Node.js, Bun, Deno, or any other Hono-supported runtime.

## Install

```bash
pnpm add @oviato/x402-facilitator-hono
```

## Quick Start

```typescript
import { Hono } from "hono";
import { x402Facilitator } from "@oviato/x402-facilitator-hono";

const app = new Hono();

app.route("/facilitator", await x402Facilitator({
  evm: {
    privateKey: env.EVM_PRIVATE_KEY,
    rpcUrls: {
      "eip155:84532": env.RPC_URL_BASE_SEPOLIA,
    },
  },
}));

export default app;
```

Three endpoints are now live: `GET /facilitator/supported`, `POST /facilitator/verify`, `POST /facilitator/settle`.

## Configuration

```typescript
interface FacilitatorConfig {
  evm?: {
    privateKey: string;              // Hex, 0x-prefixed. Gas wallet.
    rpcUrls: Record<string, string>; // CAIP-2 network ID -> RPC URL
  };
  svm?: {
    privateKey: string;              // Base58. Fee payer wallet.
    rpcUrls: Record<string, string>; // CAIP-2 network ID -> RPC URL
  };
  nonceStore?: NonceStore;           // Optional. Defaults to in-memory.
}
```

At least one of `evm` or `svm` must be provided. Only configured chains appear in `/supported`.

### Network identifiers

Use [CAIP-2](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md) identifiers:

| Chain | CAIP-2 ID |
|-------|-----------|
| Base Sepolia | `eip155:84532` |
| Base | `eip155:8453` |
| Ethereum | `eip155:1` |
| Solana Devnet | `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1` |
| Solana | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` |

### With EVM + Solana

```typescript
app.route("/facilitator", await x402Facilitator({
  evm: {
    privateKey: env.EVM_PRIVATE_KEY,
    rpcUrls: {
      "eip155:84532": env.RPC_URL_BASE_SEPOLIA,
      "eip155:8453": env.RPC_URL_BASE,
    },
  },
  svm: {
    privateKey: env.SVM_PRIVATE_KEY,
    rpcUrls: {
      "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1": env.RPC_URL_SOLANA_DEVNET,
    },
  },
}));
```

## Nonce Stores

The facilitator uses a nonce store for replay protection. Two implementations are included:

### Cloudflare KV (distributed deployments)

```typescript
import { x402Facilitator, kvNonceStore } from "@oviato/x402-facilitator-hono";

app.route("/facilitator", await x402Facilitator({
  evm: { ... },
  nonceStore: kvNonceStore(env.NONCE_KV),
}));
```

### In-memory (single-instance deployments)

```typescript
import { x402Facilitator, memoryNonceStore } from "@oviato/x402-facilitator-hono";

app.route("/facilitator", await x402Facilitator({
  evm: { ... },
  nonceStore: memoryNonceStore(), // this is the default
}));
```

### Custom implementation

Implement the `NonceStore` interface for Redis, D1, DynamoDB, etc.:

```typescript
interface NonceStore {
  has(nonce: string): Promise<boolean>;
  set(nonce: string, ttlSeconds?: number): Promise<void>;
}
```

## Adding Middleware

This package has zero opinions on auth, rate limiting, logging, or CORS. Add whatever middleware you need before the mount:

```typescript
const app = new Hono();

app.use("/facilitator/*", rateLimiter({ max: 100 }));
app.use("/facilitator/*", apiKeyAuth({ header: "X-API-Key" }));

app.route("/facilitator", await x402Facilitator({ ... }));
```

## Connecting Resource Servers

Resource servers using [`@x402/hono`](https://www.npmjs.com/package/@x402/hono) or [`@x402/express`](https://www.npmjs.com/package/@x402/express) point their `facilitatorUrl` at this facilitator:

```typescript
// On the resource server
import { paymentMiddleware } from "@x402/hono";

app.use("/api/*", paymentMiddleware({
  facilitatorUrl: "https://your-facilitator.example.com/facilitator",
  // ...
}));
```

## API Reference

### `GET /supported`

Returns which networks and schemes this facilitator supports.

**Response:**
```json
{
  "kinds": [
    { "x402Version": 2, "scheme": "exact", "network": "eip155:84532" }
  ],
  "extensions": [],
  "signers": {
    "eip155:*": ["0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf"]
  }
}
```

### `POST /verify`

Verifies a payment payload against payment requirements. Checks nonce replay protection.

**Request body:** Standard x402 verify request (`{ paymentPayload, paymentRequirements }`)

**Response:** Standard x402 verify response (`{ isValid, invalidReason?, payer? }`)

### `POST /settle`

Settles a payment on-chain. Stores the nonce after successful settlement.

**Request body:** Standard x402 settle request (`{ paymentPayload, paymentRequirements }`)

**Response:** Standard x402 settle response (`{ success, transaction, network, payer? }`)

## Examples

- [Cloudflare Worker](examples/cloudflare-worker/) — Minimal wrangler project with KV nonce store
- [Node.js](examples/node/) — Minimal Node.js server with `@hono/node-server`

## Gas Costs

The facilitator's private key is used as a gas wallet to broadcast settlement transactions. On Base, gas costs are approximately $0.001 per transaction. Fund the gas wallet with a small amount of ETH (or SOL for Solana).

The gas wallet **only** pays gas fees. It does not hold or custody user funds. Payment tokens (e.g., USDC) are transferred directly from payer to payee via signed authorizations (EIP-3009 / Permit2 on EVM, pre-signed transactions on Solana).

## Security

### Private key handling

- Never commit private keys to source control
- Use environment variables or secret managers (Cloudflare Secrets, AWS Secrets Manager, etc.)
- The private key is used solely to submit settlement transactions — it cannot access or redirect user funds

### What the gas wallet can do

- Submit pre-authorized token transfers on behalf of payers
- Pay gas fees for settlement transactions

### What the gas wallet cannot do

- Transfer tokens without a valid signed authorization from the payer
- Change the recipient of a payment
- Modify the payment amount

### Nonce replay protection

Every payment nonce is checked against the `NonceStore` before verification. After successful settlement, the nonce is stored to prevent the same payment from being settled twice.

## Branch Protection

After creating the GitHub repository, configure these branch protection rules for `main`:

- Require pull request before merging (no direct pushes)
- Require 1 approval
- Dismiss stale PR approvals when new commits are pushed
- Require review from code owners (see `.github/CODEOWNERS`)
- Require status checks to pass before merging
- Require branches to be up to date before merging

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Related

- [x402 Protocol](https://github.com/coinbase/x402) — The x402 protocol specification and official packages
- [@x402/core](https://www.npmjs.com/package/@x402/core) — Core x402 types and facilitator class
- [@x402/evm](https://www.npmjs.com/package/@x402/evm) — EVM payment scheme implementations
- [@x402/svm](https://www.npmjs.com/package/@x402/svm) — Solana payment scheme implementations
- [@x402/hono](https://www.npmjs.com/package/@x402/hono) — Hono middleware for resource servers
- [x402 Facilitator Docs](https://docs.x402.org/core-concepts/facilitator)
- [Hono](https://hono.dev) — Ultrafast web framework for the Edges

## License

[Apache 2.0](LICENSE)
