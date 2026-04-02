import type { Context } from "hono";
import type { x402Facilitator } from "@x402/core/facilitator";

/**
 * Handles `GET /supported`.
 *
 * Returns which networks, schemes, and extensions this facilitator supports,
 * dynamically based on which keys and RPC URLs were configured.
 */
export function handleSupported(facilitator: InstanceType<typeof x402Facilitator>) {
  return (c: Context) => {
    const supported = facilitator.getSupported();
    return c.json(supported);
  };
}
