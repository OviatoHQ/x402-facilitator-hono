import { describe, it, expect, vi, beforeAll } from "vitest";
import { Hono } from "hono";
import type { FacilitatorConfig } from "../src/types.js";
import { memoryNonceStore } from "../src/nonce/memory.js";

/**
 * Integration tests for the x402Facilitator Hono sub-app.
 *
 * These tests mock the @x402/core facilitator class so we can test
 * the HTTP layer without real blockchain interactions.
 */

// Mock the x402 facilitator and scheme modules
const mockVerify = vi.fn();
const mockSettle = vi.fn();
const mockGetSupported = vi.fn();
const mockRegister = vi.fn();

vi.mock("@x402/core/facilitator", () => ({
  x402Facilitator: vi.fn().mockImplementation(() => ({
    verify: mockVerify,
    settle: mockSettle,
    getSupported: mockGetSupported,
    register: mockRegister,
  })),
}));

vi.mock("../src/schemes/evm.js", () => ({
  registerEvmSchemes: vi.fn(),
}));

vi.mock("../src/schemes/svm.js", () => ({
  registerSvmSchemes: vi.fn(),
}));

// Import after mocking
const { x402Facilitator: x402FacilitatorFactory } = await import("../src/index.js");

describe("x402Facilitator Hono sub-app", () => {
  let app: Hono;
  let nonceStore: ReturnType<typeof memoryNonceStore>;

  const config: FacilitatorConfig = {
    evm: {
      privateKey: "0x0000000000000000000000000000000000000000000000000000000000000001",
      rpcUrls: {
        "eip155:84532": "https://rpc.example.com",
      },
    },
  };

  beforeAll(async () => {
    nonceStore = memoryNonceStore();
    const facilitatorApp = await x402FacilitatorFactory({
      ...config,
      nonceStore,
    });

    app = new Hono();
    app.route("/facilitator", facilitatorApp);

    mockGetSupported.mockReturnValue({
      kinds: [
        { x402Version: 2, scheme: "exact", network: "eip155:84532" },
      ],
      extensions: [],
      signers: { "eip155:*": ["0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf"] },
    });
  });

  describe("GET /facilitator", () => {
    it("returns package info", async () => {
      const res = await app.request("/facilitator");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.name).toBe("@oviato/x402-facilitator-hono");
      expect(body.version).toBe("1.0.0");
      expect(body.supported).toBeInstanceOf(Array);
      expect(body.docs).toBe("https://github.com/OviatoHQ/x402-facilitator-hono");
    });
  });

  describe("GET /facilitator/supported", () => {
    it("returns supported kinds", async () => {
      const res = await app.request("/facilitator/supported");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.kinds).toHaveLength(1);
      expect(body.kinds[0].network).toBe("eip155:84532");
      expect(body.kinds[0].scheme).toBe("exact");
    });
  });

  describe("POST /facilitator/verify", () => {
    it("returns 400 for missing body fields", async () => {
      const res = await app.request("/facilitator/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Missing paymentPayload or paymentRequirements");
    });

    it("delegates to facilitator.verify and returns response", async () => {
      mockVerify.mockResolvedValue({ isValid: true, payer: "0xabc" });

      const res = await app.request("/facilitator/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentPayload: {
            x402Version: 2,
            accepted: { scheme: "exact", network: "eip155:84532", asset: "0x1", amount: "100", payTo: "0x2", maxTimeoutSeconds: 30, extra: {} },
            payload: { nonce: "0xfresh" },
          },
          paymentRequirements: {
            scheme: "exact",
            network: "eip155:84532",
            asset: "0x1",
            amount: "100",
            payTo: "0x2",
            maxTimeoutSeconds: 30,
            extra: {},
          },
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.isValid).toBe(true);
    });

    it("rejects replayed nonces", async () => {
      await nonceStore.set("0xreplayednonce");

      const res = await app.request("/facilitator/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentPayload: {
            x402Version: 2,
            accepted: { scheme: "exact", network: "eip155:84532", asset: "0x1", amount: "100", payTo: "0x2", maxTimeoutSeconds: 30, extra: {} },
            payload: { nonce: "0xreplayednonce" },
          },
          paymentRequirements: {
            scheme: "exact",
            network: "eip155:84532",
            asset: "0x1",
            amount: "100",
            payTo: "0x2",
            maxTimeoutSeconds: 30,
            extra: {},
          },
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.isValid).toBe(false);
      expect(body.invalidReason).toBe("nonce_already_used");
    });

    it("returns 500 on internal error", async () => {
      mockVerify.mockRejectedValue(new Error("Something broke"));

      const res = await app.request("/facilitator/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentPayload: {
            x402Version: 2,
            accepted: { scheme: "exact", network: "eip155:84532", asset: "0x1", amount: "100", payTo: "0x2", maxTimeoutSeconds: 30, extra: {} },
            payload: { nonce: "0xunique123" },
          },
          paymentRequirements: {
            scheme: "exact",
            network: "eip155:84532",
            asset: "0x1",
            amount: "100",
            payTo: "0x2",
            maxTimeoutSeconds: 30,
            extra: {},
          },
        }),
      });

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Something broke");
    });
  });

  describe("POST /facilitator/settle", () => {
    it("returns 400 for missing body fields", async () => {
      const res = await app.request("/facilitator/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Missing paymentPayload or paymentRequirements");
    });

    it("delegates to facilitator.settle and stores nonce on success", async () => {
      mockSettle.mockResolvedValue({
        success: true,
        transaction: "0xtxhash",
        network: "eip155:84532",
        payer: "0xabc",
      });

      const res = await app.request("/facilitator/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentPayload: {
            x402Version: 2,
            accepted: { scheme: "exact", network: "eip155:84532", asset: "0x1", amount: "100", payTo: "0x2", maxTimeoutSeconds: 30, extra: {} },
            payload: { nonce: "0xsettlenonce" },
          },
          paymentRequirements: {
            scheme: "exact",
            network: "eip155:84532",
            asset: "0x1",
            amount: "100",
            payTo: "0x2",
            maxTimeoutSeconds: 30,
            extra: {},
          },
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.transaction).toBe("0xtxhash");

      // Nonce should be stored after successful settlement
      expect(await nonceStore.has("0xsettlenonce")).toBe(true);
    });

    it("does not store nonce on failed settlement", async () => {
      mockSettle.mockResolvedValue({
        success: false,
        transaction: "",
        network: "eip155:84532",
        errorReason: "verification_failed",
      });

      const res = await app.request("/facilitator/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentPayload: {
            x402Version: 2,
            accepted: { scheme: "exact", network: "eip155:84532", asset: "0x1", amount: "100", payTo: "0x2", maxTimeoutSeconds: 30, extra: {} },
            payload: { nonce: "0xfailednonce" },
          },
          paymentRequirements: {
            scheme: "exact",
            network: "eip155:84532",
            asset: "0x1",
            amount: "100",
            payTo: "0x2",
            maxTimeoutSeconds: 30,
            extra: {},
          },
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(false);

      // Nonce should NOT be stored on failure
      expect(await nonceStore.has("0xfailednonce")).toBe(false);
    });

    it("returns 500 on internal error", async () => {
      mockSettle.mockRejectedValue(new Error("Network timeout"));

      const res = await app.request("/facilitator/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentPayload: {
            x402Version: 2,
            accepted: { scheme: "exact", network: "eip155:84532", asset: "0x1", amount: "100", payTo: "0x2", maxTimeoutSeconds: 30, extra: {} },
            payload: { nonce: "0xerrornonce" },
          },
          paymentRequirements: {
            scheme: "exact",
            network: "eip155:84532",
            asset: "0x1",
            amount: "100",
            payTo: "0x2",
            maxTimeoutSeconds: 30,
            extra: {},
          },
        }),
      });

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Network timeout");
    });
  });
});

describe("x402Facilitator config validation", () => {
  it("throws when neither evm nor svm is configured", async () => {
    const { x402Facilitator: factory } = await import("../src/index.js");
    await expect(factory({})).rejects.toThrow(
      "At least one of `evm` or `svm` must be configured.",
    );
  });
});
