import { networkInterfaces } from "os";
import type { NextConfig } from "next";

const lanHosts = Object.values(networkInterfaces())
  .flat()
  .filter((addr) => addr && (addr.family === "IPv4" || String(addr.family) === "4") && !addr.internal)
  .map((addr) => addr!.address);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    ...lanHosts,
    "10.150.234.75",
    "*.trycloudflare.com",
    "*.ngrok-free.app",
    "*.ngrok.io",
    "*.loca.lt",
    "*.up.railway.app",
    "*.onrender.com"
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" }
    ]
  }
};

export default nextConfig;
