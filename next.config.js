const withPWA = require("@ducanh2912/next-pwa").default;

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Dev only: lets next/image optimize images from http://localhost:8000
    // (Next blocks local/private IPs by default, which shows as blank images).
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
      },
      {
        protocol: "https",
        hostname: "infinitech-api17.site",
      },
      {
        protocol: "https",
        hostname: "infinitech-api18.site",
        pathname: "/products/**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // No headers() function here anymore — CSP is set in middleware.ts instead
};

module.exports = withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  customWorkerSrc: "worker",
  workboxOptions: {
    disableDevLogs: true,
    skipWaiting: false,
    clientsClaim: true,
  },
})(nextConfig);
