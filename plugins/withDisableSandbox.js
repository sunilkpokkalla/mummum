const { withProjectBuildProperties } = require('expo/config-plugins');

/**
 * Expo Config Plugin to disable User Script Sandboxing in Xcode.
 * This resolves the "Sandbox: bash deny" error during [CP] Copy Pods Resources.
 */
const withDisableSandbox = (config) => {
  return withProjectBuildProperties(config, {
    ios: {
      enableUserScriptSandboxing: false,
    },
  });
};

module.exports = withDisableSandbox;
