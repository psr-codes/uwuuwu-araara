/** @type {import('next').NextConfig} */
const nextConfig = {
  // For Render Static Site deployment
  output: "export",

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  // Ensure trailing slashes for static hosting
  trailingSlash: true,
};

module.exports = nextConfig;
