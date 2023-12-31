/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import { dotenvLoad } from "dotenv-mono";
const dotenv = dotenvLoad();

await import("./src/env.mjs");

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: false,

  /**
   * If you are using `appDir` then you must comment the below `i18n` config out.
   *
   * @see https://github.com/vercel/next.js/issues/41980
   */
  i18n: {
    locales: ["default", "pt-BR", "en"],
    defaultLocale: "default",
    localeDetection: false,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "public-learn-ai-m93.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "learn-ai-m93.s3.amazonaws.com",
      },
    ],
  },

  transpilePackages: ["database"],
};

export default config;
