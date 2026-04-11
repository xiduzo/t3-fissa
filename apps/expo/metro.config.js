// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

// Create the default Metro config
const config = getDefaultConfig(projectRoot);

// Add the additional `cjs` extension to the resolver
config.resolver.sourceExts.push("cjs");
config.resolver.sourceExts.push("ts");

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];
// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. Ensure only one copy of react is used (prevents "Invalid hook call" in monorepo)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react" || moduleName === "react/jsx-runtime" || moduleName === "react/jsx-dev-runtime") {
    return {
      filePath: require.resolve(moduleName, { paths: [path.resolve(workspaceRoot, "node_modules")] }),
      type: "sourceFile",
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

// 4. Block server-only Node.js packages that must never reach the React Native bundle.
config.resolver.blockList = /.*\/node_modules\/postgres\/.*/;

module.exports = withNativeWind(config, { input: "./global.css" });
