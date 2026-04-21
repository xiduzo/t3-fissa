import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { SpotifyService } from "../infrastructure/SpotifyService";
import { UserRepository } from "../repository";

export const spotifyRouter = createTRPCRouter({
  searchTracks: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const userRepo = new UserRepository(ctx.database);
      const accessToken = await userRepo.getSpotifyAccessToken(ctx.session.user.id);
      if (!accessToken) throw new TRPCError({ code: "UNAUTHORIZED", message: "No Spotify access token" });
      const spotifyService = new SpotifyService();
      const tracks = await spotifyService.searchTracks(accessToken, input.query);
      return { tracks };
    }),

  getMyPlaylists: protectedProcedure.query(async ({ ctx }) => {
    const userRepo = new UserRepository(ctx.database);
    const accessToken = await userRepo.getSpotifyAccessToken(ctx.session.user.id);
    if (!accessToken) throw new TRPCError({ code: "UNAUTHORIZED", message: "No Spotify access token" });
    const spotifyService = new SpotifyService();
    return spotifyService.getMyPlaylists(accessToken);
  }),

  getPlaylistTracks: protectedProcedure
    .input(z.object({ playlistId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const userRepo = new UserRepository(ctx.database);
      const accessToken = await userRepo.getSpotifyAccessToken(ctx.session.user.id);
      if (!accessToken) throw new TRPCError({ code: "UNAUTHORIZED", message: "No Spotify access token" });
      const spotifyService = new SpotifyService();
      return spotifyService.getPlaylistTracks(accessToken, input.playlistId);
    }),

  surpriseMe: protectedProcedure.mutation(async ({ ctx }) => {
    const userRepo = new UserRepository(ctx.database);
    const accessToken = await userRepo.getSpotifyAccessToken(ctx.session.user.id);
    if (!accessToken) throw new TRPCError({ code: "UNAUTHORIZED", message: "No Spotify access token" });
    const spotifyService = new SpotifyService();
    return spotifyService.surpriseMeTracks(accessToken);
  }),
});
