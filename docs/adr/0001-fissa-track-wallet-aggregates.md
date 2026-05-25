---
status: accepted
---

# Split the Fissa domain into three aggregates coordinated by events

We model a listening party as **three small aggregates** — **Fissa** (`pin`: owner,
`currentlyPlaying` pointer, roster, end time), **Track** (`(pin, trackId)`: votes and
score), and **Wallet** (`(pin, userId)`: the spendable per-Fissa points balance) — rather
than one Fissa aggregate that contains its tracks, votes, and member balances. The
aggregates reference each other by id and coordinate through domain events drained from an
**outbox**, not through a shared transaction.

The governing principle for the points economy is **earning is eventual, spending is
transactional**: vote-credit, play-reward, and skip-penalty raise `PointsAwarded` events
that a Wallet folds shortly after the cause commits; spending is a synchronous Wallet
command that enforces `points >= 0` against committed state.

## Considered options

- **One fat Fissa aggregate** (load the whole party, mutate, save with an optimistic-lock
  version). Gives atomic point movements and keeps every invariant in one boundary, but a
  single vote must load every track + vote of the party and locks the whole Fissa,
  serialising concurrent voters. Rejected: the contention and load cost are paid on the
  hottest path (voting) for an atomicity guarantee earning does not actually need.
- **Track as the only aggregate, no Fissa aggregate.** Rejected: a Track cannot own a
  per-user points balance (a guest's balance spans all their tracks), and "what plays
  next" is a decision over *all* tracks — neither fits inside one track. Making Track an
  aggregate forces points out into a Wallet aggregate and leaves Fissa owning the playback
  pointer, hence three aggregates, not one.

## Consequences

- **Eventual balances.** A guest's Wallet lags the cause that credited it by roughly the
  outbox drain interval (~tens of ms). Acceptable because earning only ever adds; the
  floor is enforced on spend, which is synchronous.
- **An outbox + worker is required infrastructure**, not optional. Event folds **must be
  idempotent** (dedupe by `eventId`) so at-least-once redelivery never double-credits.
  Without the outbox, a crash between commit and dispatch would silently lose an earn.
- **Badges are a projection**, not an aggregate — they fold the same events and protect no
  invariant.
- This supersedes the earlier direction (one aggregate, same-transaction event dispatch)
  reached mid-design before the voting-contention and currency-floor constraints were
  weighed.

See `CONTEXT.md` for the ubiquitous language (Fissa, Track, Wallet, Points, Badge, the
earn/spend principle).
