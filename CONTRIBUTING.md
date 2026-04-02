# Contributing to @oviato/x402-facilitator-hono

Thank you for your interest in contributing! This package is maintained by [Oviato](https://oviato.com) and open to contributions from the community.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this code.

## How to Contribute

### Reporting Bugs

Open a GitHub issue with:
- A clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Your environment (runtime, Hono version, OS)

### Suggesting Features

Open a GitHub issue tagged `enhancement` with:
- The problem you're trying to solve
- Your proposed solution
- Any alternatives you considered

### Submitting Changes

1. **Fork the repo** and create a branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Make your changes.** Follow the coding standards below.

4. **Add or update tests.** Every new feature or bugfix needs a test.

5. **Run the full check:**
   ```bash
   pnpm lint        # ESLint
   pnpm format      # Prettier check
   pnpm test        # Vitest
   pnpm build       # tsup build
   ```

6. **Commit with a conventional commit message:**
   ```
   feat: add redis nonce store implementation
   fix: handle expired timestamps in verify
   docs: add Bun deployment example
   ```

7. **Open a Pull Request** against `main`. Fill out the PR template.

### What We're Looking For

Contributions we especially welcome:

- **New NonceStore implementations** (Redis, D1, DynamoDB, Upstash, etc.)
- **Additional examples** (Deno, Bun, AWS Lambda, etc.)
- **New chain support** (Polygon, Arbitrum, Optimism, Avalanche, etc.)
- **Documentation improvements**
- **Bug fixes with tests**

## Coding Standards

- **TypeScript strict mode.** No `any` types. No `ts-ignore`.
- **Use the official x402 packages.** Do not reimplement verify/settle logic. If something is missing from `@x402/core`, `@x402/evm`, or `@x402/svm`, open an issue upstream first.
- **Zero runtime opinions.** Do not add middleware (auth, logging, CORS) to the core package. Operators add their own.
- **Test everything.** Aim for coverage on all public API paths.
- **JSDoc all public exports.** Every exported function, type, and interface needs a JSDoc comment.
- **Keep dependencies minimal.** Think twice before adding a new dependency.

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/x402-facilitator-hono.git
cd x402-facilitator-hono

# Install
pnpm install

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Build
pnpm build

# Lint + format
pnpm lint
pnpm format
```

### Testing against a real network

To run integration tests against Base Sepolia:

1. Get test USDC from [Circle Faucet](https://faucet.circle.com/)
2. Get test ETH from [Alchemy Faucet](https://www.alchemy.com/faucets/base-sepolia)
3. Copy `.env.example` to `.env` and fill in your test keys
4. Run `pnpm test:e2e`

## Pull Request Guidelines

- PRs should be focused. One feature or fix per PR.
- All CI checks must pass.
- New features need tests and documentation.
- Breaking changes need discussion in an issue first.
- Maintain backward compatibility where possible.

## Versioning

This package follows [Semantic Versioning](https://semver.org/):

- **Patch** (1.0.x): Bug fixes, documentation
- **Minor** (1.x.0): New features, new NonceStore implementations, new chain support
- **Major** (x.0.0): Breaking changes to `FacilitatorConfig`, `NonceStore` interface, or route behavior

## License

By contributing, you agree that your contributions will be licensed under the [Apache 2.0 License](LICENSE).

## Questions?

Open a GitHub discussion or reach out to the maintainers.
