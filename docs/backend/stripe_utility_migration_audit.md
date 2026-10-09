# Stripe Utility Prisma Migration Audit (Issue #509)

> [!IMPORTANT]
> **Verdict: #509 has no code to migrate.** The Stripe utility functions contain zero database access — Mongoose was never imported in that directory, and no Prisma access exists either. Five of the issue's six tasks are vacuous. The only substantive deliverable is the investigation result in this document.

- **Issue:** [#509 — 7.77.9 Migrate Stripe Utility Data Access to Prisma](https://github.com/QuoteVote/quotevote-next/issues/509)
- **Umbrella:** #500 (7.77 Domain Resolver Prisma Migration) · **Contributes to:** #144 (7.36)
- **Declared dependency:** #153 (7.45 Typed Context) — **CLOSED 2026-09-15**, satisfied
- **Audit date:** 2026-09-28
- **Branch:** `feat/509-stripe-utility-prisma-audit`
- **Code changes required:** none

## TL;DR

The issue asks to migrate the database-access portion of `app/data/resolvers/utils/stripe/` from Mongoose to Prisma. That data-access portion does not exist. The three exported helpers are pure Stripe SDK wrappers; they call the Stripe REST API and nothing else.

The null result is genuine, not a search failure. A parallel audit of the sibling ticket decomposed in the same batch (#510) found that #510 enumerated the shared resolver utilities with **actual Mongoose call counts** — `reputation.ts` (13 calls), `scores.ts` (7 calls) — and **omitted `stripe/` entirely**. The batch was code-analyzed correctly everywhere except #509, which appears to have been generated from the existence of a `stripe/` directory rather than from its contents.

In the course of the audit, four pre-existing defects were discovered in this area. One of them — an operation-wide authentication bypass in `requireAuth` — is more severe than anything #509 covers, is unrelated to Stripe, and should be triaged independently.

## Scope of the investigation

The issue names four files as the migration target:

| File | Lines | Database access |
| --- | --- | --- |
| `app/data/resolvers/utils/stripe/createStripeCustomer.ts` | 43 | none |
| `app/data/resolvers/utils/stripe/createStripePaymentMethod.ts` | 18 | none |
| `app/data/resolvers/utils/stripe/getStripeAuth.ts` | 27 | none |
| `app/data/resolvers/utils/stripe/index.ts` | 4 | none (barrel) |

`createStripeCustomer` composes a display name, calls `createStripePaymentMethod(card)`, then calls `stripe.customers.create(...)`. `createStripePaymentMethod` calls `stripe.paymentMethods.create(...)`. `getStripeAuth` selects a sandbox or live secret key from `process.env` and constructs a `Stripe` client. None of the three imports `mongoose`, a model, or `@prisma/client`.

## Methodology

Every conclusion below is reproducible with the commands in [Reproduction](#reproduction). The load-bearing claims were established four independent ways:

1. **Import scan** — `rg` for `mongoose|prisma|User|models/` across the stripe directory returns zero matches.
2. **History scan** — `git log -p --all` over the directory shows only two commits (`6eaea93`, `3597fb7`), both TypeScript typing and Stripe SDK work. Mongoose was never introduced.
3. **Field provenance** — `rg "stripeCustomerId"` over `app/` and `scripts/` returns exactly three hits, all *declarations*: a TypeScript interface member, a Prisma record type, and a Mongoose schema field. No read and no write exists in production code.
4. **Consumer scan** — `rg` across `quotevote-backend/app` and `quotevote-frontend/{src,e2e}` finds exactly one importer of the utilities: the barrel `app/data/resolvers/utils/index.ts`, which itself has zero importers.

## Findings

### D1 — `addStripeCustomer` is declared but has no resolver

`app/data/type_definition/mutation_definition.ts:69-70` declares the mutation:

```graphql
" Create a Stripe customer record "
addStripeCustomer(stripeCustomer: StripeCustomerInput!): JSON
```

No `stripeResolver.ts` exists, the field is absent from the resolvers array in `app/data/schema.ts:22-46`, and no file registers one. This violates `.cursor/rules/backend-graphql.mdc:27` ("Resolvers must exist for every Query/Mutation field declared in `server.ts`").

**Measured runtime behavior** (executed against the built schema, not inferred):

```
resolverPresent=false
result={"data":{"addStripeCustomer":null}}
```

`makeExecutableSchema` accepts the orphan field, so the schema builds without error. At execution the default field resolver reads a property from an empty root value, and the mutation **returns `null` with no error and no warning**. A caller cannot distinguish "not implemented" from "succeeded with no result." This silent failure is the most consequential property of the defect, because it can mask the absence of the feature indefinitely.

> [!NOTE]
> The stub `app/data/resolvers/index.ts` — which exports `tagResolver` and nothing else — is not used by the schema builder and is not related to this finding. `app/data/schema.ts` imports each resolver by path directly. It is dead code and was left untouched by this audit.

### D2 — The one write these utilities should own was never implemented, in any ORM

`User.stripeCustomerId` is declared in both ORMs but is never populated or read:

| Location | Declaration |
| --- | --- |
| `app/data/models/User.ts:18` | `stripeCustomerId: { type: String, trim: true }` (Mongoose) |
| `prisma/schema/user.prisma:16` | `stripeCustomerId String?` (Prisma) |
| `app/types/common.ts:93` | `stripeCustomerId?: string;` (`Common.User`) |
| `app/data/utils/userPrismaMapper.ts:44` | `stripeCustomerId?: string \| null;` (`PrismaUserRecord`) |

There is no `PaymentMethod`, `Plan`, `Subscription`, or `Payment` model in the Prisma schema. The Prisma-side destination for this field already exists, so had a migration been required, it would have needed no schema change and no `prisma:push` cycle — relevant because `docs/prisma-migration-strategy.md:5` forbids `prisma migrate dev` on MongoDB.

A secondary inconsistency: `toPublicUser()` (`app/data/utils/userPrismaMapper.ts:102-153`) does not copy `stripeCustomerId` through to `Common.User`, even though both the input type and the output type declare it. The value is never actually delivered, because `app/context.ts:70-82` selects ten specific fields and `stripeCustomerId` is not among them.

### D3 — A payment mutation sits on the unauthenticated allowlist

`app/data/utils/requireAuth.ts:15` lists `addStripeCustomer` in `PUBLIC_QUERIES`, so the request bypasses authentication at the context layer. Combined with D1 this is currently inert — the mutation returns `null` regardless. It becomes live the moment any implementation is added, which makes this entry a trap for the next contributor.

### D4 — `requireAuth` matches by substring, allowing operation-wide auth bypass

**This is the highest-severity finding in this audit and it is unrelated to Stripe.** `app/data/utils/requireAuth.ts:88` implements the public check as a substring search over the raw query text:

```ts
for (const publicQuery of PUBLIC_QUERIES) {
  const isFound = query.includes(publicQuery);
  if (isFound) {
    requiresAuth = false;
    break;
  }
}
```

The `break` exits on the first match, and the flag is computed for the **entire document** rather than per root field. Any request document containing a public operation name anywhere — including inside a variable name, a comment, or a sibling field — unauthenticates the whole request. A caller can prepend a trivial public selection to an arbitrary mutation and skip the check for everything in the same document.

**Measured blast radius.** Executing `requireAuth` against every root field in the built schema:

| Measurement | Value |
| --- | --- |
| Mutation fields declared in the schema | 56 |
| Mutation fields with an implemented resolver | 14 |
| Mutation fields that bypass the `requireAuth` gate | **23** |
| Bypassing fields that are *also* implemented | 2 — `updateUser`, `updateUserAvatar` |
| Bypassing fields that are declared but unimplemented | 21 |

The trigger is overwhelmingly an **argument name**, not a public root field. `post` is on the allowlist, and the schema's most common argument is `postId`, which contains that substring:

```ts
requireAuth('mutation { deletePost(postId: "a") }')  // false — no auth required
requireAuth('mutation { deletePost }')                // true  — auth required
```

A string literal or variable name is sufficient on its own: `mutation { createPost(title: "my posts") }` also returns `false`.

**Why this is not a live data breach, and why it still matters.** Of the 23 bypassing fields, 21 are declared but unimplemented and therefore resolve to `null`. The two that are implemented — `updateUser` (`app/data/resolvers/userResolver.ts:91`) and `updateUserAvatar` (`:288`) — each perform their own `context.user?._id` check and raise `UNAUTHENTICATED`, followed by an ownership-or-admin authorization check raising `FORBIDDEN`. There is therefore **no current unauthenticated data access**, and the vulnerability is latent rather than active.

The risk is prospective. The allowlist contains short, common substrings — `post`, `user`, `tag`, `messages` — that collide with the schema's own argument names. Any future mutation that relies on `requireAuth` alone for authentication and accepts an argument such as `postId`, `userId`, or `tagId` will be reachable without a token. Because the guard returns the correct answer for most operations, it reads as working and invites exactly that reliance. Fixing it requires parsing the document and matching root fields, which is a behavior change with a full test-matrix implication and should be scheduled as its own issue.

### D5 — Raw card data is modeled to transit the server

`app/data/inputs/CardPaymentMethodInput.ts` requires `number`, `exp_month`, `exp_year`, and `cvc`, and `app/data/inputs/StripeCustomerInput.ts` requires `card` as non-null. This models raw PAN and CVC passing through the Quote.Vote backend, which materially widens PCI-DSS scope and is explicitly discouraged by Stripe in favor of client-side tokenization.

The frontend already follows the recommended path: `quotevote-frontend/src/components/StripePaymentDialog/StripePaymentDialog.tsx` loads `https://js.stripe.com/v3/buy-button.js` with a hardcoded Buy Button ID and a publishable key. It never calls `addStripeCustomer`. **The mutation is therefore both dangerous and unreachable** — there is no live client for it anywhere in this repository.

### D6 — Zero consumers

No production code imports the utilities other than the dead barrel. No frontend or E2E spec references `addStripeCustomer` or `StripeCustomerInput`. No REST route or webhook handler references Stripe at all. The `stripe@^20.4.1` dependency's only consumer is `getStripeAuth.ts` and its unit test.

## Conformance with the issue's tasks

| # | Task | Reality | Verdict |
| --- | --- | --- | --- |
| 1 | Verify how Stripe mutations are exposed | Not exposed. Declared at `mutation_definition.ts:70`; no resolver; not registered in `schema.ts` | **Complete** — this document |
| 2 | Identify Mongoose-backed DB operations | Zero exist | Vacuous |
| 3 | Replace those operations with Prisma | No operations to replace | Vacuous |
| 4 | Preserve Stripe API behavior, validation, error handling, user/customer relationships | Undefined — no Stripe API is reachable through this path | Vacuous |
| 5 | Remove unnecessary Mongoose imports | None exist | Vacuous |
| 6 | Add or update tests for migrated data-access behavior | No data-access behavior to test | Vacuous |

## Conformance with the acceptance criteria

| Criterion | Assessment under a no-code change |
| --- | --- |
| Quote.Vote database access in the Stripe utilities uses Prisma | Vacuously true. No database access exists to be migrated; the criterion can be *confirmed*, not *achieved* |
| Existing Stripe behavior is preserved | Trivially satisfied. Changing nothing is the strongest possible form of preservation |
| No unnecessary Mongoose dependency remains in the utilities | Already true; there is nothing to remove |
| Relevant tests, type-check, and build pass | **Inherited from the status quo.** Verified green on 2026-09-28 (see [Verification](#verification)) |

> [!WARNING]
> Both plausible *code* responses to this issue — implementing the resolver, or deleting the mutation — would **violate** the "existing Stripe behavior is preserved" criterion. The measured current behavior of `addStripeCustomer` is to return `null`; implementing it changes that observable behavior, and deleting it changes both the public schema and the authentication allowlist. A no-code disposition is the only response that satisfies all four criteria simultaneously.

## Recommended disposition

Three separate pieces of work, deliberately not combined.

### 1. Close #509 as not applicable

Post the conformance tables above as an issue comment and close. The comment should present the `#510` call-count evidence, because it is what distinguishes a genuine null result from an oversight in the whole batch.

### 2. File a retirement ticket (model it on #508)

> [!TIP]
> #508 — "7.77.8 Retire Legacy Roster/Buddy Domain and Separate Surviving Responsibilities" — is the batch's existing precedent for a domain with nothing to migrate. Retirement belongs in its own ticket, not folded into #509.

Proposed deletions:

- `addStripeCustomer` from `app/data/type_definition/mutation_definition.ts:69-70`
- `app/data/inputs/StripeCustomerInput.ts`, `app/data/inputs/CardPaymentMethodInput.ts`, and their registrations in `app/data/inputs/index.ts`
- All four files in `app/data/resolvers/utils/stripe/`
- The re-exports at `app/data/resolvers/utils/index.ts:22-26`
- `'addStripeCustomer'` from `app/data/utils/requireAuth.ts:15`
- `__tests__/unit/resolverUtils/stripe.test.ts`
- The coverage exclusion at `jest.config.ts:41`
- The `stripe@^20.4.1` dependency from `package.json`

**Retain** `User.stripeCustomerId` in both schemas. Dropping a column from the live Mongoose model destroys data for no benefit, and the field is the natural hook if payments are ever rebuilt correctly via client-side PaymentIntents.

> [!CAUTION]
> **Blocking gate.** This repository is a migration target; the legacy `quotevote-monorepo` frontend is not present in this workspace and may still be deployed against this backend. Confirm no external consumer calls `addStripeCustomer` before deleting the SDL field. If one exists, the change becomes a deprecation rather than a deletion.

Without a retirement ticket, this code persists permanently: #510 does not list it, and #169 ("Remove Mongoose After Prisma Migration") will never collect it because it is not Mongoose.

### 3. File the `requireAuth` bypass as its own, higher-priority issue

D4 is a pre-existing authentication weakness affecting all 19 public operations, independent of Stripe. It should be ranked above both items above.

## Verification

Executed on branch `feat/509-stripe-utility-prisma-audit` at `2026-09-28` with `pnpm install` completed and the Prisma client generated.

| Check | Command | Result |
| --- | --- | --- |
| Install | `pnpm install` | pass (Prisma Client v6.19.2 generated) |
| Type check | `pnpm type-check` | pass — exit 0, no diagnostics |
| Lint | `pnpm lint` | pass — exit 0, no findings |
| Tests | `pnpm test` | **910 passed, 0 failed** across 107 suites |

One suite, `__tests__/unit/resolvers/rosterResolver.test.ts`, was reported as `Test suite failed to run` during the parallel run, with a jest worker terminated by `SIGKILL`. This is a sandbox memory limit in the worker pool, not a code or assertion failure: the suite passes deterministically in isolation.

```
$ npx jest __tests__/unit/resolvers/rosterResolver.test.ts --coverage=false --runInBand
Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

> [!NOTE]
> The backend suite is memory-hungry under parallel execution. In memory-constrained environments use `npx jest --runInBand` or `--maxWorkers=2` to avoid spurious `SIGKILL` worker terminations being misread as test failures.

Because the recommended disposition changes no code, these results are inherited rather than newly produced — but they were confirmed so that closing #509 does not mask a pre-existing red build.

## Reproduction

All commands run from the repository root unless noted.

```bash
# The core claim: no database access in the Stripe utilities
rg -n "mongoose|prisma|User|models/" quotevote-backend/app/data/resolvers/utils/stripe/
# → no matches

# Mongoose was never present in that directory
git log -p --all -- quotevote-backend/app/data/resolvers/utils/stripe/ \
  | rg "^\+.*(mongoose|User\.find|models/User)"
# → no matches

# stripeCustomerId is declared three times and never used
rg -n "stripeCustomerId" quotevote-backend/app quotevote-backend/scripts
# → common.ts:93, userPrismaMapper.ts:44, models/User.ts:18  (declarations only)

# The mutation is declared but never implemented
rg -n "addStripeCustomer" quotevote-backend/app
# → mutation_definition.ts:70, requireAuth.ts:15  (no resolver)

# No frontend consumer
rg -n "addStripeCustomer|StripeCustomerInput" quotevote-frontend/src quotevote-frontend/e2e
# → no matches
```

The runtime behavior in D1 was measured by executing the built schema through `graphql()` and asserting on the result, rather than inferred from `makeExecutableSchema` semantics.

### D4 blast-radius probe

The D4 measurements were produced by importing `requireAuth` and the built schema into a temporary Jest test, then enumerating root fields:

```ts
import { schema } from '~/data/schema';
import { requireAuth } from '~/data/utils/requireAuth';

const fields = schema.getMutationType()!.getFields();
for (const [name, f] of Object.entries(fields)) {
  const args = f.args.map((a) => `${a.name}: $v`).join(', ');
  const doc = `mutation { ${name}(${args}) }`;
  if (!requireAuth(doc)) console.log('bypasses auth gate:', name);
}
```

The probe was temporary and was removed after collecting results, so that this audit remains a no-code change. Turning it into a permanent regression test belongs to the `requireAuth` remediation, where the expected values will change once the gate is fixed.


## Evidence index

| Claim | Source of proof |
| --- | --- |
| No Mongoose or Prisma import in the stripe utils | `rg` over `app/data/resolvers/utils/stripe/` |
| Mongoose never existed in that directory | `git log -p --all` — only `6eaea93`, `3597fb7` |
| `stripeCustomerId` never read or written | `rg` over `app/`, `scripts/` — 3 declaration sites |
| `addStripeCustomer` has no resolver | `mutation_definition.ts:70`; absent from `schema.ts:22-46` |
| Mutation returns silent `null` | Measured against the built schema |
| No REST or webhook Stripe surface | `rg "stripe\|webhook"` over `server.ts`, `resolvers/*` |
| No frontend caller | `rg` over `quotevote-frontend/{src,e2e}` |
| `resolvers/utils/index.ts` barrel is unimported | `rg "from '~/data/resolvers/utils'"` — no matches |
| Sibling #510 was code-analyzed with real call counts | `gh issue view 510` — `reputation.ts` 13, `scores.ts` 7, `stripe/` absent |
| #508 is the batch's retirement precedent | `gh issue view 508` |
| #153 dependency satisfied | `gh issue view 153` — CLOSED 2026-09-15 |
| No roadmap intent to make Stripe live | `gh issue view 500` — no payment or Stripe intent beyond the title |
| `stripe` dependency has no other consumer | `__mocks__/` contains only `logger.ts`; the Stripe mock is inline in the one test file |

## Resolution — #554 (2026-10-06)

The blocking gate was cleared: `addStripeCustomer` in `QuoteVote/quotevote-monorepo` appears only under `server/` (5 hits, including a real legacy resolver at `server/app/data/resolvers/mutations/stripe/addStripeCustomer.js`); a code search scoped to `path:frontend` returns 0 hits. No retained legacy frontend caller exists, so the full deletion proposed above was executed on branch `chore/554-retire-stripe-surface`.

Executed deletions: the `addStripeCustomer` SDL field, `StripeCustomerInput` + `CardPaymentMethodInput` GraphQL input types, all four files under `app/data/resolvers/utils/stripe/`, the `resolvers/utils/index.ts` barrel re-exports, the `PUBLIC_QUERIES` entry, the `stripe` dependency, the `jest.config.ts` coverage exclusion, `__tests__/unit/resolverUtils/stripe.test.ts`, the Stripe cases in `requireAuth.test.ts` and `inputs.test.ts`, the orphan `test-validation.ts` script, and the three corresponding blocks in `quotevote-frontend/schema.graphql`.

Retained: `User.stripeCustomerId` in both schemas and all its declaration sites. Future payment capability remains separately scoped product work.
