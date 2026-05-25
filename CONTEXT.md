# Fissa

The collaborative listening party. Guests queue tracks, the crowd votes them up or
down, and the highest-scored track plays next. Modelled as **three small aggregates**
— Fissa, Track, Wallet — that coordinate by domain events rather than a shared
transaction.

## Language

### Aggregates

**Fissa**:
A live listening party, root `pin`. A *small* aggregate: owner, the `currentlyPlaying`
pointer, `expectedEndTime`, and the member roster. References its Tracks and Wallets by
id — it does **not** contain them. Owns: the pointer aims at a real Track or nothing;
lifecycle; owner-only actions.
_Avoid_: Room, session, "the whole party object".

**Track**:
A queued song, root `(pin, trackId)`, owning its **Votes** and **Score**. The voting
consistency boundary — a vote locks one Track, not the party. Owns: re-vote replaces the
prior vote (delta `new − previous`); a guest never earns from voting on their own track.
_Avoid_: Song, queue item.

**Wallet** (= Membership):
A guest's participation in one Fissa, root `(pin, userId)`, holding their **Points**
balance. Owns the **`points >= 0` on spend** invariant — the reason it's a separate
aggregate. Starts at 50.
_Avoid_: Player row, participant, account.

### Values

**Vote**:
A guest's up (+1) / down (−1) reaction to a Track, unique per `(pin, trackId, user)`.
Lives inside the Track aggregate.

**Score**:
A Track's current net votes, driving queue order (highest plays next); resets to 0 when
the track plays. `totalScore` is the lifetime net and never resets.
_Avoid_: Rank, weight.

**Points**:
A spendable per-Fissa currency held by a Wallet. Governed by one principle:
**earning is eventual, spending is transactional** (see below).
_Avoid_: Score (that belongs to a Track), coins, credits.

**Badge**:
A lifetime, cross-Fissa counter per `(user, name)`. A **projection**, not an aggregate:
it folds domain events into counts and protects no invariant. Some badges debounce
(max once per 24h).
_Avoid_: Achievement object, points aggregate.

### Coordination

**Earning is eventual, spending is transactional**:
Vote-credit, play-reward, and skip-penalty raise **PointsAwarded** events that the Wallet
folds shortly after the cause commits (a ~50ms balance lag is accepted). Spending is a
synchronous **Wallet** command that checks `points >= 0` against committed state, so the
floor always holds.

**Outbox**:
Domain events are written to an outbox table in the same transaction as their cause and
drained by a worker — at-least-once delivery. Folds must be **idempotent** (dedupe by
event id) so redelivery never double-credits.

**Domain events**:
**PointsAwarded** `{eventId, walletPin, userId, amount, reason}` ·
**VoteCast** `{byUser, forUser, direction}` · **TrackAdded** `{userId, count}` ·
**FissaCreated** `{userId}` · **MemberJoined** `{userId}`. Raised by an aggregate, drained
from the outbox into the Badge projection and Wallets.

## Flagged ambiguities

- **Score** is overloaded: a *Track's* net votes vs. a *Badge's* counter. Always qualify
  ("track score", "badge score").
- **Points floor**: hard clamp at 0 everywhere, or floor only on explicit spend while skip
  penalties may go negative? Undecided — resolve when the first spend command lands.

## Example dialogue

> **Dev:** A vote comes in on someone else's track. What's the consistency boundary?
> **Domain expert:** Just that one Track. Its score moves and the vote is recorded
> atomically — the party isn't locked. The owner's reward isn't part of that transaction;
> the Track raises a `PointsAwarded` event.
> **Dev:** So when does the owner's balance go up?
> **Domain expert:** A beat later — the worker drains the outbox and the owner's Wallet
> folds the event. Earning is eventual. But if that owner tries to *spend*, that's a
> synchronous command on their Wallet that checks the balance can't go below zero.
> Spending never waits on an event.
