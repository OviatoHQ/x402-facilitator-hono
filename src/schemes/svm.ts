import { base58 } from "@scure/base";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { toFacilitatorSvmSigner } from "@x402/svm";
import { ExactSvmScheme } from "@x402/svm/exact/facilitator";
import type { x402Facilitator } from "@x402/core/facilitator";
import type { SvmConfig } from "../types.js";

/**
 * Registers SVM (Solana) scheme handlers on the facilitator for all configured networks.
 *
 * @param facilitator - The `x402Facilitator` instance to register schemes on.
 * @param config - SVM configuration with private key and RPC URLs.
 */
export async function registerSvmSchemes(
  facilitator: InstanceType<typeof x402Facilitator>,
  config: SvmConfig,
): Promise<void> {
  const keypairSigner = await createKeyPairSignerFromBytes(base58.decode(config.privateKey));
  const signer = toFacilitatorSvmSigner(keypairSigner);

  for (const network of Object.keys(config.rpcUrls)) {
    facilitator.register(network as `${string}:${string}`, new ExactSvmScheme(signer));
  }
}
