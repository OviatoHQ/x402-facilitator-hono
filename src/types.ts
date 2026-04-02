import type { NonceStore } from "./nonce/types.js";

/**
 * EVM chain configuration for the facilitator.
 */
export interface EvmConfig {
  /** Hex-encoded private key (0x-prefixed). Used as the gas wallet for settlement transactions. */
  privateKey: string;
  /** Mapping of CAIP-2 network identifier to JSON-RPC URL. */
  rpcUrls: Record<string, string>;
}

/**
 * SVM (Solana) configuration for the facilitator.
 */
export interface SvmConfig {
  /** Base58-encoded private key. Used as the fee payer for settlement transactions. */
  privateKey: string;
  /** Mapping of CAIP-2 network identifier to JSON-RPC URL. */
  rpcUrls: Record<string, string>;
}

/**
 * Configuration for the x402 facilitator Hono sub-app.
 *
 * At least one of `evm` or `svm` must be provided. The facilitator will only
 * advertise support for chains that have been configured.
 */
export interface FacilitatorConfig {
  /** EVM chain configuration. Omit to disable EVM support. */
  evm?: EvmConfig;
  /** SVM (Solana) chain configuration. Omit to disable Solana support. */
  svm?: SvmConfig;
  /** Pluggable nonce store for replay protection. Defaults to in-memory. */
  nonceStore?: NonceStore;
}
