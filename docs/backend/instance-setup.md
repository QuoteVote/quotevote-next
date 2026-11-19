# Setting up a new instance

A new instance (its own backend, database and frontend) starts with an empty database. Three steps get it ready: the indexes, the first administrator, and optionally some starting tags and posts. Each step is safe to run twice.

The setup ships with the backend, so it runs inside the deployed container as well as from a checkout:

```bash
node dist/app/setup.js <step>      # in the container, from /app
pnpm setup:instance <step>         # from quotevote-backend, with DATABASE_URL set
```

It needs `DATABASE_URL` (and `MONGO_URI` for the index step if it differs), the same ones the backend uses. It prints names and counts only, never passwords or record contents.

## 1. Indexes

```bash
node dist/app/setup.js indexes           # report only, changes nothing
node dist/app/setup.js indexes --apply   # build what's missing
```

The same checks as the switch steps: the model indexes (`pnpm db:model-indexes`, including the collections only Prisma uses) and the unique indexes (`pnpm db:unique-indexes`). Any conflict, or records that would break a unique index, stops it before anything is changed. Nothing is ever dropped. See [model-indexes.md](model-indexes.md).

## 2. First administrator

```bash
node dist/app/setup.js admin
```

Asks for the email, username, display name and password (hidden, 12 characters or more, asked twice). The account is created active, as an administrator with a finished signup.

- Run again with an admin's username or email, it leaves that admin as is.
- Any other account with that username or email (a member, an unfinished request) stops it: nothing is overwritten or promoted.

Further administrators and staff roles are given from the app once this one can sign in.

## 3. Starting tags and posts (optional)

```bash
node dist/app/setup.js demo content.json
```

`content.json` lists the tags and the posts, each post naming one of the tags:

```json
{
  "tags": [
    {
      "title": "Public Policy",
      "description": "Policy questions the group is deliberating."
    }
  ],
  "posts": [
    {
      "tag": "Public Policy",
      "title": "A first topic",
      "text": "The text people vote on and discuss."
    }
  ]
}
```

`instance-setup.example.json` is a full example. Everything is created by the first administrator through the same code the app uses, so posts get their link, discussion room and activity like any other. Tags and posts whose title already exists are kept as they are.
