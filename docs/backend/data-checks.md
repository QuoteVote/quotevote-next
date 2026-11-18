# Data checks (#183)

`pnpm data:check` is a read-only check of the database at `DATABASE_URL`. It's meant for the staging copy restored from a backup, before the full test, and for comparing index lists around the switch.

It sends only read commands (`listCollections`, `listIndexes`, and `aggregate` with `$match`, `$count`, `$facet` and `$group`). The report holds counts, field names and index keys, never document contents, ids or the connection string.

## Running it

```bash
# Write a report (default name: data-check-<database>-<timestamp>.json) and print a summary
DATABASE_URL=... pnpm data:check [--out report.json]

# Compare two reports; exits with 1 if anything differs
pnpm data:check --compare first.json second.json [--indexes-only]
```

Report files are ignored by git.

## What the report holds

- **Records:** accounts, posts, votes, comments, quotes, conversations, messages, follows, buddy relationships, blocks, tags, notifications and invites.
- **Collections:** for every collection in the database, mapped in Prisma or not, the number of documents and the index list.
- **Field problems:** for every collection Prisma maps, the number of records with each problem below. The checks are built from the Prisma schema, so they follow it as models change.
- **Missing collections:** collections in the Prisma schema that don't exist in the database yet.

## Field problems

Prisma converts stored values as it reads them. These are the cases that fail, or read differently from what's stored:

| Problem              | What's stored                                                                                             | What happens on a Prisma read                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `missing-required`   | A required field with no static default (none, `now()` or `@updatedAt`) is missing or null                | A read that includes the field fails                                      |
| `default-filled`     | A required field with a static default is missing or null                                                 | The default is returned, but `where` filters on the field skip the record |
| `wrong-type`         | A value Prisma can't convert, such as a string in a Boolean or Int field, or a number in a DateTime field | A read that includes the field fails                                      |
| `unknown-enum`       | A value outside the enum                                                                                  | A read that includes the field fails                                      |
| `not-a-list`         | A list field that holds something other than an array                                                     | A read that includes the field fails                                      |
| `wrong-list-element` | A list element of the wrong type                                                                          | A read that includes the field fails                                      |

These convert without an error, so they aren't reported: an ObjectId in a String field, a long or double in an Int field (a double is truncated), a missing or null list (read as empty), and any value in a Json field.

Resolvers that `select` other fields keep working on records with these problems. The report shows which fields a full-record read, or a new `select`, would trip on. Legacy records, for example, use `created` and have no `createdAt` or `updatedAt`.

## Comparing reports

- **Backup against the restored copy:** run the check on both and compare. They should match, with no differences.
- **Around the switch:** compare with `--indexes-only`, since the counts change as people use the site but the indexes shouldn't.
