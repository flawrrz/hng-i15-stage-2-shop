import type { NextConfig } from "next";
import withRspack from "next-rspack";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // Product photos are re-hosted in the public Supabase Storage bucket
        // `product-images` (see scripts/seed-plants.mjs) — without this entry
        // next/image 400s on every catalogue image.
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

// Bundle with Rspack instead of Webpack (faster builds on Windows).
// next-rspack replaces Webpack in Next's pipeline; it only activates when
// the CLI runs WITHOUT --webpack/--turbopack flags, which is why the dev and
// build scripts in package.json are plain `next dev` / `next build`.
// If it ever misbehaves, remove the wrapper + restore the flags to fall
// back to Webpack.
export default withRspack(nextConfig);