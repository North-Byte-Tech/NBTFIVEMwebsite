/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // The Dev Dashboard compares applied migrations against the folders on
    // disk; without this they aren't bundled into the serverless function.
    outputFileTracingIncludes: {
      "/admin/dev": ["./prisma/migrations/**/*"],
    },
  },
};

export default nextConfig;
