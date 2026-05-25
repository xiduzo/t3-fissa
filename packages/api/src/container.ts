import { type DB } from "@fissa/db";

import { SpotifyService } from "./infrastructure/SpotifyService";

import { AuthService } from "./service/AuthService";
import { FissaService } from "./service/FissaService";
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
  const trackRepo = new TrackRepository(db);
  const voteRepo = new VoteRepository(db);
  const userRepo = new UserRepository(db);
  const outboxRepo = new OutboxRepository(db);
  const walletRepo = new WalletRepository(db);

  // External services
  const spotify = new SpotifyService();

  // Domain services (wired bottom-up: no circular deps). Points earning is
  // written to the outbox here and folded into Wallets/Badges by the drainer
  // (ADR-0001); only spending touches a Wallet synchronously.
  const voteService = new VoteService(voteRepo, db, outboxRepo);
  const trackService = new TrackService(trackRepo, voteService, outboxRepo);
  const fissaService = new FissaService(fissaRepo, trackRepo, spotify, outboxRepo, db, session);
  const walletService = new WalletService(walletRepo, db);
  const authService = new AuthService(userRepo, spotify, session);

  return { fissaService, trackService, voteService, walletService, authService };
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
