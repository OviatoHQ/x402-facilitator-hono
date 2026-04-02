import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { toFacilitatorEvmSigner } from "@x402/evm";
import { ExactEvmScheme } from "@x402/evm/exact/facilitator";
import type { x402Facilitator } from "@x402/core/facilitator";
import type { EvmConfig } from "../types.js";

/**
 * Registers EVM scheme handlers on the facilitator for all configured networks.
 *
 * Creates viem wallet + public clients per-network and registers an `ExactEvmScheme` for each.
 *
 * @param facilitator - The `x402Facilitator` instance to register schemes on.
 * @param config - EVM configuration with private key and RPC URLs.
 */
export function registerEvmSchemes(
  facilitator: InstanceType<typeof x402Facilitator>,
  config: EvmConfig,
): void {
  const account = privateKeyToAccount(config.privateKey as `0x${string}`);

  for (const [network, rpcUrl] of Object.entries(config.rpcUrls)) {
    const transport = http(rpcUrl);

    const publicClient = createPublicClient({ transport });
    const walletClient = createWalletClient({ account, transport });

    const signer = toFacilitatorEvmSigner({
      address: account.address,
      getCode: (args: { address: `0x${string}` }) => publicClient.getCode(args),
      readContract: (args: {
        address: `0x${string}`;
        abi: readonly unknown[];
        functionName: string;
        args?: readonly unknown[];
      }) => publicClient.readContract({ ...args, args: args.args ?? [] }),
      verifyTypedData: (args: {
        address: `0x${string}`;
        domain: Record<string, unknown>;
        types: Record<string, unknown>;
        primaryType: string;
        message: Record<string, unknown>;
        signature: `0x${string}`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) => publicClient.verifyTypedData(args as any),
      writeContract: (args: {
        address: `0x${string}`;
        abi: readonly unknown[];
        functionName: string;
        args: readonly unknown[];
        gas?: bigint;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) => walletClient.writeContract(args as any),
      sendTransaction: (args: { to: `0x${string}`; data: `0x${string}` }) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        walletClient.sendTransaction(args as any),
      waitForTransactionReceipt: (args: { hash: `0x${string}` }) =>
        publicClient.waitForTransactionReceipt(args),
    });

    facilitator.register(
      network as `${string}:${string}`,
      new ExactEvmScheme(signer, { deployERC4337WithEIP6492: true }),
    );
  }
}
