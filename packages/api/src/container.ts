import { type DB } from "@fissa/db";

import { SpotifyService } from "./infrastructure/SpotifyService";

import { AuthService } from "./service/AuthService";
import { FissaService } from "./service/FissaService";
import { PlaybackService } from "./service/PlaybackService";
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
import { WalletProjection } from "./projection/WalletProjection";
import { OutboxDrainer } from "./orchestration/OutboxDrainer";
import type { Context } from "./utils/context";

/**
 * Per-request services plus the repositories procedures call directly. A
 * repository is exposed here when its reads/writes need no orchestration
 * beyond the repo's own transactional methods — `TrackRepository` (queue
 * add/delete/read) and `VoteRepository` (raw vote rows + score read model).
 */
export type ServiceContainer = {
  fissaService: FissaService;
  playbackService: PlaybackService;
  trackRepo: TrackRepository;
  voteRepo: VoteRepository;
  userRepo: UserRepository;
  voteService: VoteService;
  walletService: WalletService;
  authService: AuthService;
  spotify: SpotifyService;
};

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
  const voteService = new VoteService(db, trackRepo);
  const playbackService = new PlaybackService(fissaRepo, trackRepo, spotify, db, session);
  const fissaService = new FissaService(fissaRepo, trackRepo, playbackService, outboxRepo, db);
  const walletService = new WalletService(walletRepo, db);
  const authService = new AuthService(userRepo, spotify, session);

  return { fissaService, playbackService, trackRepo, voteRepo, userRepo, voteService, walletService, authService, spotify };
};

/**
 * Builds the process-level outbox drainer (ADR-0001). Not per-request — the
 * server starts a single instance so event folds stay serialized and idempotent.
 */
export const createOutboxDrainer = (db: DB): OutboxDrainer => {
  return new OutboxDrainer(db, new OutboxRepository(db), [
    new WalletProjection(new WalletRepository(db)),
    new BadgeProjection(db),
  ]);
};
