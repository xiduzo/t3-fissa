import { SpotifyService } from "./infrastructure/SpotifyService";

import { AuthService } from "./service/AuthService";
import { BadgeService } from "./service/BadgeService";
import { FissaService } from "./service/FissaService";
import { TrackService } from "./service/TrackService";
import { VoteService } from "./service/VoteService";
import {
  BadgeRepository,
  FissaRepository,
  TrackRepository,
  UserRepository,
  VoteRepository,
} from "./repository";
import type { Context } from "./utils/context";

export type ServiceContainer = {
  fissaService: FissaService;
  trackService: TrackService;
  voteService: VoteService;
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
  const badgeRepo = new BadgeRepository(db);
  const fissaRepo = new FissaRepository(db);
  const trackRepo = new TrackRepository(db);
  const voteRepo = new VoteRepository(db);
  const userRepo = new UserRepository(db);

  // External services
  const spotify = new SpotifyService();

  // Domain services (wired bottom-up: no circular deps)
  const badgeService = new BadgeService(badgeRepo, fissaRepo, db, session);
  const voteService = new VoteService(voteRepo, db, badgeService);
  const trackService = new TrackService(trackRepo, voteService, badgeService);
  const fissaService = new FissaService(fissaRepo, trackRepo, spotify, badgeService, db, session);
  const authService = new AuthService(userRepo, spotify, session);

  return { fissaService, trackService, voteService, authService };
};
