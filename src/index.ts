import { Hono } from "hono";
import type { FacilitatorConfig } from "./types.js";
import { buildFacilitator } from "./schemes/registry.js";
import { memoryNonceStore } from "./nonce/memory.js";
import { handleSupported } from "./routes/supported.js";
import { handleVerify } from "./routes/verify.js";
import { handleSettle } from "./routes/settle.js";

// Re-export public API
export { kvNonceStore } from "./nonce/kv.js";
export { memoryNonceStore } from "./nonce/memory.js";
export type { NonceStore } from "./nonce/types.js";
export type { FacilitatorConfig, EvmConfig, SvmConfig } from "./types.js";

/**
 * Package version, injected at build time.
 */
const PACKAGE_VERSION = "1.0.0";

/**
 * Creates a mountable Hono sub-app implementing the x402 facilitator protocol.
 *
 * The returned app exposes three routes:
 * - `GET /supported` — networks and schemes this facilitator supports
 * - `POST /verify` — verify a payment payload against requirements
 * - `POST /settle` — settle a payment on-chain
 *
 * Mount it on any Hono app via `app.route()`:
 *
 * @example
 * ```ts
 * import { Hono } from "hono";
 * import { x402Facilitator } from "@oviato/x402-facilitator-hono";
 *
 * const app = new Hono();
 *
 * app.route("/facilitator", await x402Facilitator({
 *   evm: {
 *     privateKey: env.EVM_PRIVATE_KEY,
 *     rpcUrls: { "eip155:84532": env.RPC_URL_BASE_SEPOLIA },
 *   },
 * }));
 *
 * export default app;
 * ```
 *
 * @param config - Facilitator configuration specifying chains, keys, and optional nonce store.
 * @returns A Hono sub-app with `/supported`, `/verify`, and `/settle` routes.
 */
export async function x402Facilitator(config: FacilitatorConfig): Promise<Hono> {
  if (!config.evm && !config.svm) {
    throw new Error("At least one of `evm` or `svm` must be configured.");
  }

  const facilitator = await buildFacilitator(config);
  const nonceStore = config.nonceStore ?? memoryNonceStore();

  const app = new Hono();

  app.get("/", (c) => {
    const supported = facilitator.getSupported();
    return c.json({
      name: "@oviato/x402-facilitator-hono",
      version: PACKAGE_VERSION,
      supported: supported.kinds,
      docs: "https://github.com/OviatoHQ/x402-facilitator-hono",
    });
  });

  app.get("/supported", handleSupported(facilitator));
  app.post("/verify", handleVerify(facilitator, nonceStore));
  app.post("/settle", handleSettle(facilitator, nonceStore));

  return app;
}
