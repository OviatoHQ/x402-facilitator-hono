import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { x402Facilitator, memoryNonceStore } from "@oviato/x402-facilitator-hono";

const app = new Hono();

app.get("/", (c) => c.text("x402 Facilitator (Node.js)"));

async function main() {
  const facilitator = await x402Facilitator({
    evm: {
      privateKey: process.env.EVM_PRIVATE_KEY!,
      rpcUrls: {
        "eip155:84532": process.env.RPC_URL_BASE_SEPOLIA!,
      },
    },
    nonceStore: memoryNonceStore(),
  });

  app.route("/facilitator", facilitator);

  const port = Number(process.env.PORT ?? 4020);
  console.log(`x402 facilitator listening on http://localhost:${port}`);
  serve({ fetch: app.fetch, port });
}

main().catch(console.error);
