import type { NextConfig } from "next";

const nextConfig = {
  env: {
    ADDRESSABLE_API_KEY: process.env.ADDRESSABLE_API_KEY,
  },
  /* config options here */
} as any;

export default nextConfig;
