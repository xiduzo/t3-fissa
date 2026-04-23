//@ts-check

// Fixes build failure with Xcode 26 / iOS 26 SDK where FOLLY_HAS_COROUTINES
// is enabled by the compiler but folly/coro/Coroutine.h is not bundled with
// the React Native version in use.
// References:
// https://github.com/facebook/react-native/issues/xxxxx

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { withDangerousMod } = require("expo/config-plugins");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");

const PATCH_MARKER = "FOLLY_CFG_NO_COROUTINES";

const PATCH = `
    # Fix for Xcode 26 / iOS 26 SDK: folly/coro/Coroutine.h file not found
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        flags = config.build_settings['OTHER_CPLUSPLUSFLAGS'] || '$(inherited)'
        unless flags.include?('-DFOLLY_CFG_NO_COROUTINES=1')
          config.build_settings['OTHER_CPLUSPLUSFLAGS'] = "#{flags} -DFOLLY_CFG_NO_COROUTINES=1"
        end
      end
    end`;

/** @type {import("expo/config-plugins").ConfigPlugin} */
module.exports = (config) => {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, "Podfile");
      let contents = fs.readFileSync(podfilePath, "utf-8");

      if (!contents.includes(PATCH_MARKER)) {
        contents = contents.replace(
          "react_native_post_install(",
          `${PATCH}\n    react_native_post_install(`,
        );
        fs.writeFileSync(podfilePath, contents);
      }

      return config;
    },
  ]);
};
