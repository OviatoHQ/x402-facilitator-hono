import type { NonceStore } from "./types.js";

const DEFAULT_TTL_SECONDS = 86_400; // 24 hours

/**
 * Creates a {@link NonceStore} backed by an in-memory `Map`.
 *
 * Nonces are automatically evicted after 24 hours via `setTimeout`.
 * Suitable for single-instance deployments (Node.js, Bun, Deno).
 * For multi-instance or edge deployments, use {@link kvNonceStore} or a custom store.
 *
 * @returns A `NonceStore` backed by an in-memory `Map`.
 *
 * @example
 * ```ts
 * import { x402Facilitator, memoryNonceStore } from "@oviato/x402-facilitator-hono";
 *
 * app.route("/facilitator", x402Facilitator({
 *   evm: { privateKey: env.EVM_PRIVATE_KEY, rpcUrls: { "base-sepolia": env.RPC_URL } },
 *   nonceStore: memoryNonceStore(),
 * }));
 * ```
 */
export function memoryNonceStore(): NonceStore {
  const store = new Map<string, NodeJS.Timeout>();

  return {
    async has(nonce: string): Promise<boolean> {
      return store.has(nonce);
    },
    async set(nonce: string, ttlSeconds: number = DEFAULT_TTL_SECONDS): Promise<void> {
      // Clear any existing timer for this nonce
      const existing = store.get(nonce);
      if (existing !== undefined) {
        clearTimeout(existing);
      }

      const timer = setTimeout(() => {
        store.delete(nonce);
      }, ttlSeconds * 1000);

      // Unref the timer so it doesn't keep the process alive
      if (typeof timer === "object" && "unref" in timer) {
        timer.unref();
      }

      store.set(nonce, timer);
    },
  };
}
