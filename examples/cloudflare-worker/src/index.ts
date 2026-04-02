import { Hono } from "hono";
import { x402Facilitator, kvNonceStore } from "@oviato/x402-facilitator-hono";

type Env = {
  Bindings: {
    EVM_PRIVATE_KEY: string;
    RPC_URL_BASE_SEPOLIA: string;
    NONCE_KV: KVNamespace;
  };
};

const app = new Hono<Env>();

app.get("/", (c) => c.text("x402 Facilitator (Cloudflare Worker)"));

// Lazily initialize and cache the facilitator sub-app per isolate
let facilitator: Hono | null = null;

app.all("/facilitator/*", async (c, next) => {
  if (!facilitator) {
    facilitator = await x402Facilitator({
      evm: {
        privateKey: c.env.EVM_PRIVATE_KEY,
        rpcUrls: {
          "eip155:84532": c.env.RPC_URL_BASE_SEPOLIA,
        },
      },
      nonceStore: kvNonceStore(c.env.NONCE_KV),
    });
  }
  // Mount sub-app dynamically
  const subApp = new Hono();
  subApp.route("/facilitator", facilitator);
  return subApp.fetch(c.req.raw);
});

export default app;
