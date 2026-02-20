# Security Checklist

- Do not commit secrets. Use GitHub Secrets for CI variables.
- Validate dependencies with Dependabot and `npm audit`.
- Enforce CORS only on server side; front-end should call proxied APIs.
- Store tokens in secure httpOnly cookies or secure storage on the backend.
- Run SAST and secret scanning in CI.
