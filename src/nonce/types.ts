/**
 * Pluggable nonce replay protection store.
 *
 * The facilitator checks this store to prevent replay attacks.
 * Two implementations are shipped: {@link kvNonceStore} for Cloudflare KV
 * and {@link memoryNonceStore} for single-instance deployments.
 * Operators can provide their own implementation (Redis, D1, DynamoDB, etc.).
 */
export interface NonceStore {
  /** Returns `true` if the nonce has already been used. */
  has(nonce: string): Promise<boolean>;
  /** Stores a nonce. Implementations should expire entries after `ttlSeconds` (default 86400 = 24h). */
  set(nonce: string, ttlSeconds?: number): Promise<void>;
}
