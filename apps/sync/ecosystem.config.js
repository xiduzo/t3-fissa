module.exports = {
  apps: [
    {
      name: "sync",
      script: "./src/index.ts",
      env: {
        VERCEL_URL: "https://t3-fissa-nextjs.vercel.app",
      },
      env_development: {
        VERCEL_URL: "http://localhost:3000",
      },
    },
  ],
};
