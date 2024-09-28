/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds and Linting.
 */
!process.env.SKIP_ENV_VALIDATION && (await import("./src/env.mjs"));

/** @type {import("next").NextConfig} */
const config = {
  /** Enables hot reloading for local packages without a build step */
  transpilePackages: ["@fissa/api", "@fissa/auth", "@fissa/db", "@fissa/utils"],
  /** We already do linting and typechecking as separate tasks in CI */
  eslint: { ignoreDuringBuilds: !!process.env.CI },
  typescript: { ignoreBuildErrors: !!process.env.CI },
  images: {
    domains: ["play.google.com", "tools.applemediaservices.com", 'i.scdn.co', "misc.scdn.co", "image-cdn-ak.spotifycdn.com", "mosaic.scdn.co"],
  },
};

export default config;
