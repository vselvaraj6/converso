# Critical Mandates

- **Mandatory Local Testing:** YOU MUST ALWAYS run the full local test suite (`docker compose run --rm -e APP_ENV=testing app pytest`) and a local build (`docker compose build`) before pushing any changes to GitHub. NEVER push unverified code.
- **CI/CD Integrity:** If CI/CD fails, you must immediately reproduce the failure locally, fix it, and verify with a full test run before re-pushing.
