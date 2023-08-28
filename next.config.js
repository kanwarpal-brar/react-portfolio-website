/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        port: "",
        pathname: "/kanwarpal-brar/repo-images/main/**",
      },
      {
        protocol: "https",
        hostname: "https://kanwarpal-github-repos.imgix.net",
        port: "",
        pathname: "/",
      },
    ],
  },
};

module.exports = nextConfig;
