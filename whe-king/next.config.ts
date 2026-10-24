import type { NextConfig } from "next";

// `npm run build:pages` sets PAGES=1: static export served from
// https://<user>.github.io/orbit-royale/king/ . Normal dev/build stays at "/".
const pages = process.env.PAGES === "1";

const nextConfig: NextConfig = {
  ...(pages && {
    output: "export" as const,
    basePath: "/orbit-royale/king",
    trailingSlash: true,
    images: { unoptimized: true },
  }),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
