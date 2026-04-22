import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/audio-analysis/analyze": ["./node_modules/ffmpeg-static/ffmpeg"],
    "/api/library/submit": ["./node_modules/ffmpeg-static/ffmpeg"],
    "/api/library/submissions/*": ["./node_modules/ffmpeg-static/ffmpeg"],
  },
  serverExternalPackages: ["ffmpeg-static"],
};

export default nextConfig;
