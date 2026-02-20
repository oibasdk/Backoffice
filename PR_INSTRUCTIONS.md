PR workflow (local)

1. Create a branch with the changes made in this workspace and push to origin:

```bash
git checkout -b feature/e2e-playwright-and-test-fixes
git add -A
git commit -m "chore(test): add Playwright E2E skeleton and stabilize unit tests"
git push -u origin feature/e2e-playwright-and-test-fixes
```

2. Open a Pull Request on GitHub and request CI run (Actions -> CI - Manual Dispatch).

3. After CI artifacts are uploaded, download `vitest.log` and `build.log` from the workflow run and paste here for further fixes.

If you prefer, I can prepare a patch/PR branch for you — but I cannot push to your remote from this environment without credentials.
