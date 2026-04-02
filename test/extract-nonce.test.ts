import { describe, it, expect } from "vitest";
import { extractNonce } from "../src/nonce/extract.js";
import type { PaymentPayload } from "@x402/core/types";

function makePayload(payload: Record<string, unknown>): PaymentPayload {
  return {
    x402Version: 2,
    accepted: {
      scheme: "exact",
      network: "eip155:84532" as `${string}:${string}`,
      asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      amount: "100000",
      payTo: "0x0000000000000000000000000000000000000001",
      maxTimeoutSeconds: 30,
      extra: {},
    },
    payload,
  };
}

describe("extractNonce", () => {
  it("extracts EIP-3009 nonce from payload.nonce", () => {
    const nonce = extractNonce(makePayload({ nonce: "0xabc123" }));
    expect(nonce).toBe("0xabc123");
  });

  it("extracts Permit2 nonce from payload.permit.nonce", () => {
    const nonce = extractNonce(
      makePayload({
        permit: { nonce: "12345", deadline: "999999" },
        signature: "0xsig",
      }),
    );
    expect(nonce).toBe("12345");
  });

  it("extracts SVM nonce from payload.transaction", () => {
    const nonce = extractNonce(makePayload({ transaction: "base64encodedtx" }));
    expect(nonce).toBe("base64encodedtx");
  });

  it("returns undefined for empty payload", () => {
    const nonce = extractNonce(makePayload({}));
    expect(nonce).toBeUndefined();
  });

  it("prefers top-level nonce over nested permit nonce", () => {
    const nonce = extractNonce(
      makePayload({
        nonce: "0xtoplevel",
        permit: { nonce: "nested" },
      }),
    );
    expect(nonce).toBe("0xtoplevel");
  });
});
