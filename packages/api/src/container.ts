import { type DB } from "@fissa/db";

import { SpotifyService } from "./infrastructure/SpotifyService";

import { AuthService } from "./service/AuthService";
import { FissaService } from "./service/FissaService";
import { PlaybackService } from "./service/PlaybackService";
import { TrackService } from "./service/TrackService";
import { VoteService } from "./service/VoteService";
import { WalletService } from "./service/WalletService";
import {
  FissaRepository,
  OutboxRepository,
  TrackRepository,
  UserRepository,
  VoteRepository,
  WalletRepository,
} from "./repository";
import { BadgeProjection } from "./projection/BadgeProjection";
import { OutboxDrainer } from "./orchestration/OutboxDrainer";
import type { Context } from "./utils/context";

export type ServiceContainer = {
  fissaService: FissaService;
  playbackService: PlaybackService;
  trackService: TrackService;
  voteService: VoteService;
  walletService: WalletService;
  authService: AuthService;
};

/**
 * Wires up the full service graph from a tRPC context.
 * Repositories and services are created fresh per-request so there is no
 * shared mutable state between concurrent requests.
 */
export const createContainer = (ctx: Context): ServiceContainer => {
  const { database: db, session } = ctx;

  // Repositories
  const fissaRepo = new FissaRepository(db);
  const outboxRepo = new OutboxRepository(db);
  const trackRepo = new TrackRepository(db, outboxRepo);
  const voteRepo = new VoteRepository(db);
  const userRepo = new UserRepository(db);
  const walletRepo = new WalletRepository(db);

  // External services
  const spotify = new SpotifyService();

  // Domain services (wired bottom-up: no circular deps). Points earning is
  // written to the outbox here and folded into Wallets/Badges by the drainer
  // (ADR-0001); only spending touches a Wallet synchronously.
  const voteService = new VoteService(voteRepo, db, trackRepo);
  const trackService = new TrackService(trackRepo, voteService, outboxRepo);
  const playbackService = new PlaybackService(fissaRepo, trackRepo, spotify, db, session);
  const fissaService = new FissaService(fissaRepo, trackRepo, playbackService, outboxRepo, db);
  const walletService = new WalletService(walletRepo, db);
  const authService = new AuthService(userRepo, spotify, session);

  return { fissaService, playbackService, trackService, voteService, walletService, authService };
};

/**
 * Builds the process-level outbox drainer (ADR-0001). Not per-request — the
 * server starts a single instance so event folds stay serialized and idempotent.
 */
export const createOutboxDrainer = (db: DB): OutboxDrainer => {
  return new OutboxDrainer(
    db,
    new OutboxRepository(db),
    new WalletRepository(db),
    new BadgeProjection(db),
  );
};
