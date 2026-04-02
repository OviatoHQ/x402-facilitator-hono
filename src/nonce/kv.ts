import type { NonceStore } from "./types.js";

/** Cloudflare KV `KVNamespace` — typed here to avoid a hard runtime dependency. */
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

const DEFAULT_TTL_SECONDS = 86_400; // 24 hours

/**
 * Creates a {@link NonceStore} backed by Cloudflare KV.
 *
 * Nonces are stored with a 24-hour TTL by default.
 *
 * @param kv - A Cloudflare `KVNamespace` binding.
 * @returns A `NonceStore` suitable for distributed, multi-instance deployments.
 *
 * @example
 * ```ts
 * import { x402Facilitator, kvNonceStore } from "@oviato/x402-facilitator-hono";
 *
 * app.route("/facilitator", x402Facilitator({
 *   evm: { privateKey: env.EVM_PRIVATE_KEY, rpcUrls: { "base-sepolia": env.RPC_URL } },
 *   nonceStore: kvNonceStore(env.NONCE_KV),
 * }));
 * ```
 */
export function kvNonceStore(kv: KVNamespace): NonceStore {
  return {
    async has(nonce: string): Promise<boolean> {
      const value = await kv.get(nonce);
      return value !== null;
    },
    async set(nonce: string, ttlSeconds: number = DEFAULT_TTL_SECONDS): Promise<void> {
      await kv.put(nonce, "1", { expirationTtl: ttlSeconds });
    },
  };
}
