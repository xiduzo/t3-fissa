import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createContainer } from "../container";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import type { Context } from "../utils/context";

/**
 * Resolve the Spotify client + the signed-in user's access token from the
 * container — the one place every Spotify read authenticates.
 */
const withSpotify = async (ctx: Context, userId: string) => {
  const { userRepo, spotify } = createContainer(ctx);
  const accessToken = await userRepo.getSpotifyAccessToken(userId);
  if (!accessToken) throw new TRPCError({ code: "UNAUTHORIZED", message: "No Spotify access token" });
  return { spotify, accessToken };
};

export const spotifyRouter = createTRPCRouter({
  searchTracks: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { spotify, accessToken } = await withSpotify(ctx, ctx.session.user.id);
      return { tracks: await spotify.searchTracks(accessToken, input.query) };
    }),

  getMyPlaylists: protectedProcedure.query(async ({ ctx }) => {
    const { spotify, accessToken } = await withSpotify(ctx, ctx.session.user.id);
    return spotify.getMyPlaylists(accessToken);
  }),

  getPlaylistTracks: protectedProcedure
    .input(z.object({ playlistId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { spotify, accessToken } = await withSpotify(ctx, ctx.session.user.id);
      return spotify.getPlaylistTracks(accessToken, input.playlistId);
    }),

  surpriseMe: protectedProcedure.mutation(async ({ ctx }) => {
    const { spotify, accessToken } = await withSpotify(ctx, ctx.session.user.id);
    return spotify.surpriseMeTracks(accessToken);
  }),
});
