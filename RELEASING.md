# Releasing

This package is published manually by maintainers. There is no automated publish pipeline.

## Steps

1. Ensure `main` is up to date and all CI checks pass.
2. Update the version in `package.json` following [semver](https://semver.org/):
   - Patch (1.0.x): bug fixes
   - Minor (1.x.0): new features, new NonceStore implementations, new chain support
   - Major (x.0.0): breaking changes to config, NonceStore interface, or route behavior
3. Update `CHANGELOG.md` with the changes in this release.
4. Commit: `git commit -am "chore: release v1.x.x"`
5. Tag: `git tag v1.x.x`
6. Push: `git push && git push --tags`
7. Publish:
   ```bash
   pnpm build
   pnpm test
   npm publish --access public
   ```
8. Create a GitHub Release from the tag with release notes.

## Why manual?

This package configures private keys for financial settlement infrastructure. We use npm passkeys (device-bound, phishing-resistant) for publish authentication. This ensures that even if the GitHub repository is compromised, no malicious package can be pushed to npm.

Automated publishing may be introduced in the future with additional safeguards.
