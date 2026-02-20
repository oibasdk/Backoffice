# Testing & Build — Backoffice

Run these commands locally in the repository root to validate the project:

```bash
# install exact dependencies
npm ci

# run unit tests
npm test

# run build
npm run build
```

Troubleshooting:
- If `npm ci` fails with `ENOVERSIONS` about a package, remove or correct that dependency in `package.json` and run `npm ci` again.
- If tests fail due to `useNavigate` or router hooks, ensure tests wrap components with `MemoryRouter` or rely on the global `setupTests.ts` to provide necessary mocks.
- If tests fail because of missing `@iconify/react`, we've included a local shim at `src/components/icons/IconifyShim.tsx`. You can optionally install `@iconify/react`.

Accessibility checks:
- For CI axe/Lighthouse runs we recommend using `axe-playwright` or running Lighthouse in a headless browser in CI.

If you run the commands above and paste `npm-test.log` and `npm-build.log` here, I'll analyze failures and push fixes.

Quick diagnostics you can run locally (copy/paste the output here):

```bash
# generate feature flag report
npm run feature-flags && cat feature-flag-report.json | sed -n '1,120p'

# run unit tests (include verbose logs)
npm test -- --reporter verbose > npm-test.log 2>&1 || true
tail -n 200 npm-test.log

# run accessibility smoke (enable via env)
RUN_A11Y=1 npm test -- src/tests/a11y/axe.test.ts
```
