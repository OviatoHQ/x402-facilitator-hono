import { describe, it, expect, vi, beforeEach } from "vitest";
import { memoryNonceStore } from "../src/nonce/memory.js";
import { kvNonceStore } from "../src/nonce/kv.js";

describe("memoryNonceStore", () => {
  it("returns false for unseen nonces", async () => {
    const store = memoryNonceStore();
    expect(await store.has("nonce-1")).toBe(false);
  });

  it("returns true after a nonce is set", async () => {
    const store = memoryNonceStore();
    await store.set("nonce-1");
    expect(await store.has("nonce-1")).toBe(true);
  });

  it("handles multiple nonces independently", async () => {
    const store = memoryNonceStore();
    await store.set("nonce-1");
    await store.set("nonce-2");
    expect(await store.has("nonce-1")).toBe(true);
    expect(await store.has("nonce-2")).toBe(true);
    expect(await store.has("nonce-3")).toBe(false);
  });

  it("expires nonces after TTL", async () => {
    vi.useFakeTimers();
    const store = memoryNonceStore();
    await store.set("nonce-1", 1); // 1 second TTL
    expect(await store.has("nonce-1")).toBe(true);

    vi.advanceTimersByTime(1500);
    expect(await store.has("nonce-1")).toBe(false);
    vi.useRealTimers();
  });

  it("overwrites existing nonce timer on re-set", async () => {
    vi.useFakeTimers();
    const store = memoryNonceStore();
    await store.set("nonce-1", 2);
    vi.advanceTimersByTime(1000);
    await store.set("nonce-1", 2); // reset the timer
    vi.advanceTimersByTime(1500);
    expect(await store.has("nonce-1")).toBe(true); // still alive
    vi.advanceTimersByTime(1000);
    expect(await store.has("nonce-1")).toBe(false); // now expired
    vi.useRealTimers();
  });
});

describe("kvNonceStore", () => {
  let mockKv: {
    get: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockKv = {
      get: vi.fn(),
      put: vi.fn(),
    };
  });

  it("returns false when KV returns null", async () => {
    mockKv.get.mockResolvedValue(null);
    const store = kvNonceStore(mockKv);
    expect(await store.has("nonce-1")).toBe(false);
    expect(mockKv.get).toHaveBeenCalledWith("nonce-1");
  });

  it("returns true when KV returns a value", async () => {
    mockKv.get.mockResolvedValue("1");
    const store = kvNonceStore(mockKv);
    expect(await store.has("nonce-1")).toBe(true);
  });

  it("calls put with expiration TTL", async () => {
    mockKv.put.mockResolvedValue(undefined);
    const store = kvNonceStore(mockKv);
    await store.set("nonce-1");
    expect(mockKv.put).toHaveBeenCalledWith("nonce-1", "1", { expirationTtl: 86400 });
  });

  it("supports custom TTL", async () => {
    mockKv.put.mockResolvedValue(undefined);
    const store = kvNonceStore(mockKv);
    await store.set("nonce-1", 3600);
    expect(mockKv.put).toHaveBeenCalledWith("nonce-1", "1", { expirationTtl: 3600 });
  });
});
