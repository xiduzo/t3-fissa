/**
 * Domain events raised by the Fissa, Track, and Wallet aggregates.
 *
 * Events are the coordination substrate between aggregates (see ADR-0001):
 * earning points is eventual, carried by `PointsAwarded`, while the aggregate
 * that raised the event has already committed its own state. Every event
 * carries an `eventId` so the outbox can be drained at-least-once and folds
 * stay idempotent.
 */

export type PointsReason = "voteReceived" | "playReward" | "skipPenalty";

export type VoteDirection = 1 | -1;

interface DomainEventBase {
  readonly eventId: string;
  readonly occurredAt: Date;
}

export interface PointsAwarded extends DomainEventBase {
  readonly type: "PointsAwarded";
  readonly pin: string;
  readonly userId: string;
  readonly amount: number;
  readonly reason: PointsReason;
}

export interface VoteCast extends DomainEventBase {
  readonly type: "VoteCast";
  readonly pin: string;
  readonly byUser: string;
  readonly forUser: string | null;
  readonly direction: VoteDirection;
}

export interface TrackAdded extends DomainEventBase {
  readonly type: "TrackAdded";
  readonly pin: string;
  readonly userId: string;
  readonly count: number;
}

export interface FissaCreated extends DomainEventBase {
  readonly type: "FissaCreated";
  readonly pin: string;
  readonly userId: string;
}

export interface MemberJoined extends DomainEventBase {
  readonly type: "MemberJoined";
  readonly pin: string;
  readonly userId: string;
}

export type DomainEvent =
  | PointsAwarded
  | VoteCast
  | TrackAdded
  | FissaCreated
  | MemberJoined;

export type DomainEventType = DomainEvent["type"];

/** Payload of an event without the envelope fields the factory fills in. */
type EventBody<E extends DomainEvent> = Omit<E, keyof DomainEventBase | "type">;

const envelope = (): DomainEventBase => ({
  eventId: crypto.randomUUID(),
  occurredAt: new Date(),
});

export const pointsAwarded = (body: EventBody<PointsAwarded>): PointsAwarded => ({
  type: "PointsAwarded",
  ...envelope(),
  ...body,
});

export const voteCast = (body: EventBody<VoteCast>): VoteCast => ({
  type: "VoteCast",
  ...envelope(),
  ...body,
});

export const trackAdded = (body: EventBody<TrackAdded>): TrackAdded => ({
  type: "TrackAdded",
  ...envelope(),
  ...body,
});

export const fissaCreated = (body: EventBody<FissaCreated>): FissaCreated => ({
  type: "FissaCreated",
  ...envelope(),
  ...body,
});

export const memberJoined = (body: EventBody<MemberJoined>): MemberJoined => ({
  type: "MemberJoined",
  ...envelope(),
  ...body,
});
