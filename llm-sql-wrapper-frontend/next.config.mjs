/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
      MOTHERDUCK_TOKEN: process.env.MOTHERDUCK_TOKEN,
    },
  };
  
  export default nextConfig;