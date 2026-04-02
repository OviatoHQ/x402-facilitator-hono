import type { PaymentPayload } from "@x402/core/types";

/**
 * Extracts a nonce from a payment payload for replay protection.
 *
 * - EVM EIP-3009: uses `payload.nonce` (bytes32)
 * - EVM Permit2: uses `payload.permit.nonce` (uint256)
 * - SVM: uses the serialized transaction as a unique key
 *
 * @returns The nonce string, or `undefined` if none could be extracted.
 */
export function extractNonce(paymentPayload: PaymentPayload): string | undefined {
  const payload = paymentPayload.payload;

  // EVM EIP-3009 nonce
  if (typeof payload === "object" && payload !== null && "nonce" in payload) {
    return String(payload.nonce);
  }

  // Permit2 nonce
  if (
    typeof payload === "object" &&
    payload !== null &&
    "permit" in payload &&
    typeof payload.permit === "object" &&
    payload.permit !== null &&
    "nonce" in payload.permit
  ) {
    return String((payload.permit as Record<string, unknown>).nonce);
  }

  // SVM: use the transaction payload as a unique key
  if (typeof payload === "object" && payload !== null && "transaction" in payload) {
    return String(payload.transaction);
  }

  return undefined;
}
