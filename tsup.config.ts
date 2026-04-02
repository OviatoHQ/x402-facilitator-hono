import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["hono", "@x402/core", "@x402/evm", "@x402/svm", "viem", "@solana/kit"],
});
