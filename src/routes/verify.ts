import type { Context } from "hono";
import type { x402Facilitator } from "@x402/core/facilitator";
import type { PaymentPayload, PaymentRequirements } from "@x402/core/types";
import type { NonceStore } from "../nonce/types.js";
import { extractNonce } from "../nonce/extract.js";

/**
 * Handles `POST /verify`.
 *
 * Accepts the standard x402 verify request body and delegates to the
 * appropriate scheme handler based on the network field.
 *
 * Checks the `NonceStore` for replay protection before verifying.
 */
export function handleVerify(
  facilitator: InstanceType<typeof x402Facilitator>,
  nonceStore: NonceStore,
) {
  return async (c: Context) => {
    try {
      const body = (await c.req.json()) as {
        paymentPayload?: PaymentPayload;
        paymentRequirements?: PaymentRequirements;
      };

      if (!body.paymentPayload || !body.paymentRequirements) {
        return c.json({ error: "Missing paymentPayload or paymentRequirements" }, 400);
      }

      // Check nonce replay protection
      const nonce = extractNonce(body.paymentPayload);
      if (nonce) {
        const seen = await nonceStore.has(nonce);
        if (seen) {
          return c.json({
            isValid: false,
            invalidReason: "nonce_already_used",
          });
        }
      }

      const response = await facilitator.verify(body.paymentPayload, body.paymentRequirements);
      return c.json(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return c.json({ error: message }, 500);
    }
  };
}
