import type { Context } from "hono";
import type { x402Facilitator } from "@x402/core/facilitator";
import type { PaymentPayload, PaymentRequirements, SettleResponse } from "@x402/core/types";
import type { NonceStore } from "../nonce/types.js";
import { extractNonce } from "../nonce/extract.js";

/**
 * Handles `POST /settle`.
 *
 * Accepts the standard x402 settle request body and delegates to the
 * appropriate scheme handler which broadcasts the transaction using
 * the configured private key and RPC URL.
 *
 * After successful settlement, the nonce is stored in the configured
 * `NonceStore` to prevent replay attacks.
 */
export function handleSettle(
  facilitator: InstanceType<typeof x402Facilitator>,
  nonceStore: NonceStore,
) {
  return async (c: Context) => {
    let paymentPayload: PaymentPayload | undefined;

    try {
      const body = (await c.req.json()) as {
        paymentPayload?: PaymentPayload;
        paymentRequirements?: PaymentRequirements;
      };
      paymentPayload = body.paymentPayload;

      if (!body.paymentPayload || !body.paymentRequirements) {
        return c.json({ error: "Missing paymentPayload or paymentRequirements" }, 400);
      }

      const response = await facilitator.settle(body.paymentPayload, body.paymentRequirements);

      // Store nonce after successful settlement to prevent replay
      if (response.success) {
        const nonce = extractNonce(body.paymentPayload);
        if (nonce) {
          await nonceStore.set(nonce);
        }
      }

      return c.json(response);
    } catch (error) {
      // Handle settlement abort from hooks
      if (error instanceof Error && error.message.includes("Settlement aborted:")) {
        const abortResponse: SettleResponse = {
          success: false,
          errorReason: error.message.replace("Settlement aborted: ", ""),
          network: (paymentPayload?.accepted?.network ?? "unknown") as `${string}:${string}`,
          transaction: "",
        };
        return c.json(abortResponse);
      }

      const message = error instanceof Error ? error.message : "Unknown error";
      return c.json({ error: message }, 500);
    }
  };
}
