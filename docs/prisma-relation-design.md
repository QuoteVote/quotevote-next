# Prisma Relation Design — MongoDB

## Overview

QuoteVote uses MongoDB with both Mongoose (primary) and Prisma (migration target) reading from the same collections. This document covers key design decisions for Prisma schema alignment.

## Logical References, Not Foreign Keys

MongoDB does not enforce foreign key constraints at the database level. All relations in Prisma are **logical references** managed at the application layer. This means:

- Prisma `@relation` attributes define how the client resolves `include` queries
- No cascading deletes happen automatically — cleanup is application responsibility
- Orphaned references are possible if documents are deleted without updating referrers

## Field Name Mapping (`@map`)

Since Mongoose and Prisma share the same MongoDB collections, Prisma field names must match the actual MongoDB document field names. Where Prisma uses camelCase but MongoDB stores snake_case or prefixed names, `@map()` bridges the gap:

| Prisma Field | MongoDB Field | Mapping |
|---|---|---|
| `User.isAdmin` | `admin` | `@map("admin")` |
| `User.followingIds` | `_followingId` | `@map("_followingId")` |
| `User.followerIds` | `_followersId` | `@map("_followersId")` |
| `Post.enableVoting` | `enable_voting` | `@map("enable_voting")` |
| `MessageRoom.userIds` | `users` | `@map("users")` |
| `Message.mutationType` | `mutation_type` | `@map("mutation_type")` |
| `BotReport.userId` | `_reportedUserId` | `@map("_reportedUserId")` |
| `BotReport.reporterId` | `_reporterId` | `@map("_reporterId")` |
| `UserReport.reportedUserId` | `_reportedUserId` | `@map("_reportedUserId")` |
| `UserReport.reporterId` | `_reporterId` | `@map("_reporterId")` |

## Legacy Index & Field Compatibility

### BotReport & UserReport

Production MongoDB collections `botreports` and `userreports` store legacy field names `_reporterId` and `_reportedUserId`. In addition, legacy documents only contain `createdAt` (no `created` or `updatedAt`).

1. **Field Mapping**: Prisma models map `reporterId` to `_reporterId` and `userId`/`reportedUserId` to `_reportedUserId` using `@map()`.
2. **Optional Timestamps**: Fields `created` and `updatedAt` are optional (`DateTime?`) in Prisma so legacy documents lacking them can be read without `P2032` missing-required-value errors.
3. **Index Preservation**:
   - `BotReport` preserves the exact legacy index set with legacy MongoDB index names:
     - `@@unique([reporterId, userId], map: "_reporterId_1__reportedUserId_1")`
     - `@@index([userId], map: "_reportedUserId_1")`
     - `@@index([createdAt(sort: Desc)], map: "createdAt_-1")`
   - The redundant index `@@index([reporterId])` is omitted because `_reporterId_1__reportedUserId_1` already covers lookups by reporter.
   - This ensures `prisma db push` preserves the legacy unique index and does not remove duplicate protection.

## Model Naming

The Prisma model `Message` maps to the `messages` collection via `@@map("messages")`, matching the Mongoose model name `Message`. The legacy `DirectMessage` model maps to `directmessages` for the old `Messages.js` simple messages.

## Embedded vs Referenced Documents

- **User.reputation**: Mongoose embeds reputation data directly on the User document. Prisma uses an `EmbeddedReputation` composite type to match this.
- **UserReputation**: A separate standalone model also exists (from `UserReputation.ts`), used for detailed reputation tracking with history.
- **Message.readByDetailed / deliveredTo**: Mongoose uses embedded subdocuments. Prisma uses composite types `ReadByDetail` and `DeliveredToDetail`.

## Array Type Decisions

Some Mongoose arrays store plain strings (not ObjectIds):

- `Post.bookmarkedBy`, `Post.rejectedBy`, `Post.approvedBy`, `Post.reportedBy`, `Post.votedBy` — all `String[]` in Prisma (no `@db.ObjectId`)

Arrays that store ObjectId references use `@db.ObjectId`:

- `User.followingIds`, `User.followerIds`, `User.blockedUserIds`, `MessageRoom.userIds`, `Message.readBy`

## Many-to-Many via Arrays

MongoDB handles many-to-many relationships using ObjectId arrays rather than junction tables. For example, `MessageRoom.userIds` stores an array of User ObjectIds. Prisma models this as `String[] @db.ObjectId` since MongoDB Prisma does not support implicit many-to-many relations.
