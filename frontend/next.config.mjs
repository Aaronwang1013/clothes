/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["next-auth"],
  images: {
    remotePatterns: [
      {
        // 本地開發 MinIO
        protocol: "http",
        hostname: "localhost",
        port: "9000",
      },
      {
        // AWS S3 presigned URLs（生產）
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
