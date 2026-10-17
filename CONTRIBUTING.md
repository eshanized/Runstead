# Contributing to Runstead

Thanks for considering a contribution. Runstead is a Next.js and TypeScript hosting-business platform project. The repository contains both an interactive demonstration and evolving persistence/integration foundations; contributions must preserve the distinction between simulated behavior and production infrastructure.

## Development environment

Use Node.js 22.6 or newer. CI currently runs Node.js 22. npm is distributed with Node.js.

```bash
git clone https://github.com/eshanized/Runstead.git
cd Runstead
npm ci
npm run dev
```

Copy `.env.example` to `.env.local` only when you need the environment-backed routes or database integration. Never add real tokens, credentials, customer data, or production connection strings to a commit.

## Verification before opening a pull request

Run the same baseline checks locally:

```bash
npm run validate
npm run audit
```

`npm run validate` runs TypeScript type checking, linting, unit tests, and a production build. For browser journeys, install the Playwright browser required by the project and run:

```bash
npx playwright install
npm run test:e2e
```

The PostgreSQL integration suite is separate from the offline unit tests. Configure the database URLs documented in `.env.example`, prepare a test database and the restricted application role, apply migrations, and then run:

```bash
npm run db:validate
npm run db:migrate
npm run test:db
```

CI runs the database integration suite against PostgreSQL and verifies row-level security separately from the offline unit-test job. Check the [CI workflow](https://github.com/eshanized/Runstead/actions/workflows/ci.yml) for the current canonical commands and latest results.

## Contribution expectations

- Keep pull requests focused and describe the user-visible or operational problem they solve.
- Add or update tests for new behavior, bug fixes, state transitions, permission checks, and validation rules.
- Preserve tenant boundaries and PostgreSQL row-level security. Do not introduce an application path that silently bypasses authorization.
- Keep user input validated at system boundaries. Handle rejected promises, network failures, transaction failures, and retries explicitly.
- Preserve the simulation boundary: payments, public DNS updates, and hypervisor/server operations must not be presented as real integrations unless an actual adapter is implemented, configured, and tested.
- Keep documentation and environment examples synchronized with code. Use fake values in examples and never commit secrets.
- Avoid unrelated refactors in bug-fix pull requests. Explain any schema or migration changes, including rollback considerations.

## Pull request checklist

Before requesting review, confirm that:

- [ ] The change solves a specific documented problem.
- [ ] Tests cover the changed behavior and important failure paths.
- [ ] `npm run validate` passes locally, or any environment blocker is reported clearly.
- [ ] `npm run audit` has been run and findings are explained.
- [ ] Documentation and `.env.example` reflect the implementation.
- [ ] No real credentials, customer data, or production side effects were introduced.
- [ ] Simulated capabilities remain clearly distinguished from production integrations.

For bug reports, include a minimal reproduction, expected behavior, actual behavior, and relevant sanitized logs. Please do not publish secrets or sensitive production data in issues.
