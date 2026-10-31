# Contributing to Quote.Vote

Thank you for considering a contribution to Quote.Vote.

Quote.Vote is an open-source, text-first platform for thoughtful civic conversation. People can publish posts, quote specific passages, vote on ideas, and discuss them in connected conversations. Our aim is to make disagreement more constructive, participation more accessible, and claims easier to examine.

We try to practice the same principles in this repository: **reflection over reaction, transparency about uncertainty, respect for different perspectives, and coordination without pressure**. Maintainers are responsible for code quality, security, integration, and releases; contributors have agency over what work they take on and when they participate.

**The source code is publicly available under [AGPL-3.0](LICENSE).** The hosted community may require an invitation to join; an invitation is not required to read the code or propose a contribution.

## Ways to contribute

Contributions include more than code:

- **Engineering:** frontend, backend, GraphQL, tests, accessibility, performance, security hardening, and documentation.
- **Product and design:** explain a usability problem, propose alternatives, review interaction details, or improve accessibility.
- **Research and quality assurance:** report reproducible bugs, compare behavior with the existing application, write test cases, or document edge cases.
- **Community and documentation:** improve onboarding, clarify trade-offs, or make technical decisions easier to understand.

Small, well-scoped contributions are welcome. You can raise a concern or propose an approach without volunteering to implement it.

## Find or propose work

1. Browse [open issues](https://github.com/QuoteVote/quotevote-next/issues). `good first issue` and `help wanted` can be useful starting points. A `Ready` label signals work that may be actionable; `Not Ready` signals a dependency or unresolved decision.
2. For work tied to the 2.0 release, start with [#637 — Path to 2.0](https://github.com/QuoteVote/quotevote-next/issues/637). Read the relevant issue and its newest comments: migration dependencies and ownership can change quickly.
3. Comment on the issue with your interest, an initial approach, and any questions. A maintainer can clarify dependencies, confirm ownership, or suggest a smaller slice.
4. If the issue is large, propose a focused PR or child issue before implementation. Reference the parent issue (for example, `Part of #633`). Umbrella issues are coordination tools; they need not be assigned to one person.
5. For a new bug or feature, first search existing issues. Open an issue describing the observed behavior, expected behavior, impact, and evidence or alternative approaches. Avoid posting personal or security-sensitive data.

**Please coordinate before beginning substantial work**, particularly on issues with existing assignees, open PRs, or release dependencies. An issue assignment records a point of coordination, rather than exclusive ownership of ideas.

## Working together

- **Voluntary participation:** Contributors choose their commitments. No fixed weekly hours, daily status reports, or response-time obligations apply to volunteers.
- **Clear coordination:** One primary active assignment is a useful default; additional work is welcome when it is manageable and coordinated.
- **Visible decisions:** Discuss technical choices in issues and PRs where possible. Summarize a decision and its reasoning when discussion happens elsewhere.
- **Constructive disagreement:** Critique proposals and evidence rather than people. State assumptions, explain trade-offs, and remain open to revision.
- **Maintainer responsibility:** Maintainers review security, architecture, user impact, dependencies, and release timing. They may request changes, defer a feature, or decline a PR with an explanation.
- **Respect and inclusion:** Make room for different experience levels and perspectives. Harassment, threats, discriminatory abuse, and intimidation are unacceptable. Raise concerns with maintainers, privately when the situation warrants it.

### Progress updates and availability

An issue comment or draft PR is usually enough to show progress. If you encounter a blocker, need an extended break, or would like to step away, a short note helps others coordinate. You do not need to give a personal explanation.

Maintainers may check in after roughly **a week without visible activity**, particularly on release-critical assignments. If another week passes without a response, they may make the issue available to another contributor after leaving a clear notice. These are **flexible coordination guidelines, not deadlines or penalties**. Existing work and attribution should be preserved, and contributors are welcome to return.

Maintainers also owe contributors timely communication. We aim to acknowledge PRs promptly, explain requests for changes, and say when review capacity is limited.

## Repository and local setup

This repository contains:

- `quotevote-frontend/` — Next.js App Router, React, TypeScript, Apollo Client, Tailwind/shadcn and Jest/Playwright.
- `quotevote-backend/` — Express, Apollo GraphQL, TypeScript, Prisma and MongoDB, with some legacy Mongoose paths still being retired.
- `docs/` — technical and migration guidance.

The GitHub CI workflow uses **Node.js 24 and pnpm 9**. See the [frontend README](quotevote-frontend/README.md), [backend README](quotevote-backend/README.md), and [migration rules](docs/Migration-Rules.md) for setup instructions and conventions.

```bash
git clone https://github.com/QuoteVote/quotevote-next.git
cd quotevote-next

# In separate terminals, with appropriate local environment configuration:
cd quotevote-frontend && pnpm install && pnpm dev
cd quotevote-backend && pnpm install && pnpm dev
```

Run each package's commands from its own directory. Backend development and integration tests may need a local MongoDB replica set and environment variables; use isolated development credentials and follow the package documentation.

## Important rules during the 2.0 migration

The following release-specific rules apply while the legacy application and migrated backend coexist. [#637](https://github.com/QuoteVote/quotevote-next/issues/637) is the current source for changes in sequencing.

1. **Protect the current beta.** The hosted beta continues to use the legacy API until a coordinated cutover. Most compatible changes target `main`. Frontend changes that require the new GraphQL contract (for example, Group → Tag and Buddy API migration) should target **`staging`**, following the issue's instructions and maintainer confirmation.
2. **Preserve existing data.** The Prisma models map to legacy MongoDB collections and fields. Test against legacy-shaped fixtures, including absent optional fields and older records. Never run `prisma db push`, `pnpm prisma:push`, destructive migrations, or data backfills against production or a shared database without an explicitly reviewed plan and authorization.
3. **Keep frontend and backend contracts aligned.** Backend CI runs `pnpm check:contract` to validate frontend GraphQL documents, including whether root resolvers exist. Frontend CI runs `pnpm validate:graphql` against its configured schema snapshot. Coordinate intentional staging-only changes and keep documented exceptions accurate; do not hand-edit a schema snapshot merely to silence failures.
4. **Preserve authorization and privacy.** Enforce permissions server-side for writes and reads, including room membership, cross-account actions, blocked users, public-user field selection, and disabled or deleted content. Include negative tests.
5. **Respect product decisions and dependencies.** Voting semantics, deletion and retention, Terms acceptance, and other policy-sensitive changes may need explicit product decisions before implementation. Surface assumptions in the issue rather than choosing a policy silently.
6. **Use isolated environments.** Never access, export, attach, or disclose real members' private messages, personal information, tokens, keys, or production database records in issues, PRs, fixtures, logs, or screenshots. Use synthetic or properly anonymized data. Deployment, staging credentials, backfills, and the production cutover are coordinated by maintainers.

## Make a focused pull request

1. Branch from the appropriate target (`main` by default; `staging` for explicitly approved new-contract frontend work). Avoid unrelated refactoring in the same PR.
2. Implement the smallest coherent change. Reuse existing project patterns, add tests around the behavior and edge cases, and keep authorization checks on the server.
3. Run relevant checks and state what you actually ran. Examples:

   | Frontend (`quotevote-frontend/`) | Backend (`quotevote-backend/`) |
   | --- | --- |
   | `pnpm lint` | `pnpm lint` |
   | `pnpm type-check` | `pnpm type-check` |
   | `pnpm test` | `pnpm test` |
   | `pnpm validate:graphql` | `pnpm check:contract` |
   | `pnpm build` | `pnpm build` |

   Playwright E2E tests may require browsers, a configured test environment, and test credentials. State explicitly if they were skipped or could not run. Automated CI checks supplement, rather than replace, testing actual user journeys.
4. In the PR description include:
   - **Issue:** `Closes #123` for a complete fix, or `Part of #123` for incremental work.
   - **Why and what:** the problem, main changes, and any behavior or accessibility impact.
   - **Evidence:** tests and commands run, relevant outcomes, and sanitized screenshots when helpful.
   - **Risks:** legacy-data compatibility, API-contract changes, security/privacy implications, and known limitations.
   - **Dependencies:** branch target, other PRs, required backend/frontend changes, or deployment sequencing.
5. Open a **draft PR** when you want feedback before finishing. Mark it ready when the scope is reviewable. Answer review comments with the change or a reasoned alternative; disagreement and questions are welcome.
6. Allow maintainers to merge after review and required checks. Describe any follow-up work in the issue so incomplete functionality remains visible.

For code changes, aim for tests that would fail before the fix and pass afterward. Prioritize tests for security boundaries and legacy-data behavior when relevant. A passing mocked unit test alone may miss a mismatch in real MongoDB or GraphQL behavior.

## Security, privacy, and responsible disclosure

For a suspected exploitable vulnerability or exposure of private data, **avoid posting exploit details, credentials, or user records in a public GitHub issue**. Contact the maintainers privately at **admin@quote.vote**, with a minimal description and safe reproduction steps. Wait for a coordinated disclosure approach before publishing sensitive details.

For ordinary bugs, include minimal reproduction steps, expected versus actual behavior, affected environment, and relevant redacted logs.

Do not test against other members' accounts, messages, or production records without explicit authorization.

## License, attribution, and continuity

Quote.Vote's source is licensed under [GNU AGPL-3.0](LICENSE). Submit only material you have the rights to contribute under the repository's license, and identify third-party material or licensing questions before using it.

GitHub commits and PRs preserve authorship. When work changes hands, maintainers should credit prior contributors and keep useful branches, findings, and discussion available.

Thank you for helping build a public-interest platform with the same care, transparency, and curiosity we hope to foster in its conversations.
