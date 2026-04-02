import { x402Facilitator } from "@x402/core/facilitator";
import type { FacilitatorConfig } from "../types.js";
import { registerEvmSchemes } from "./evm.js";
import { registerSvmSchemes } from "./svm.js";

/**
 * Creates an `x402Facilitator` instance and registers scheme handlers
 * based on the provided configuration.
 *
 * @param config - The facilitator configuration.
 * @returns A fully configured `x402Facilitator` instance.
 */
export async function buildFacilitator(
  config: FacilitatorConfig,
): Promise<InstanceType<typeof x402Facilitator>> {
  const facilitator = new x402Facilitator();

  if (config.evm) {
    registerEvmSchemes(facilitator, config.evm);
  }

  if (config.svm) {
    await registerSvmSchemes(facilitator, config.svm);
  }

  return facilitator;
}
