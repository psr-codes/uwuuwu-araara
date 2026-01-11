/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed output: 'export' to enable API routes for Supabase analytics
  // Deploy as Web Service on Render instead of Static Site

  // Disable image optimization for compatibility
  images: {
    unoptimized: true,
  },

  // Ensure trailing slashes for cleaner URLs
  trailingSlash: true,
};

module.exports = nextConfig;
