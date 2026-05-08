const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withFirebasePatch = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const iosRoot = config.modRequest.platformProjectRoot;
      const projectRoot = config.modRequest.projectRoot;
      const podfile = path.join(iosRoot, 'Podfile');
      
      // 1. Patch Firestore headers in node_modules to fix modularity issues
      const firestoreDir = path.join(projectRoot, 'node_modules/@react-native-firebase/firestore/ios/RNFBFirestore');
      const filesToPatch = ['RNFBFirestoreCommon.h', 'RNFBFirestoreCollectionModule.h', 'RNFBFirestoreDocumentModule.h', 'RNFBFirestoreModule.h', 'RNFBFirestoreTransactionModule.h'];
      
      filesToPatch.forEach(filename => {
        const filePath = path.join(firestoreDir, filename);
        if (fs.existsSync(filePath)) {
          let content = fs.readFileSync(filePath, 'utf8');
          // Replace modular import with module import to satisfy Clang's strict rules in the New Arch
          if (content.includes('#import <React/RCTBridgeModule.h>')) {
            content = content.replace('#import <React/RCTBridgeModule.h>', '@import React;');
            fs.writeFileSync(filePath, content);
          }
        }
      });

      // 2. Patch Podfile
      if (fs.existsSync(podfile)) {
        let contents = fs.readFileSync(podfile, 'utf8');

        const modularPods = [
          "  pod 'FirebaseCore', :modular_headers => true",
          "  pod 'FirebaseAuth', :modular_headers => true",
          "  pod 'FirebaseFirestore', :modular_headers => true",
          "  pod 'FirebaseFirestoreInternal', :modular_headers => true",
          "  pod 'RNFBApp', :path => '../node_modules/@react-native-firebase/app', :modular_headers => true",
          "  pod 'RNFBAuth', :path => '../node_modules/@react-native-firebase/auth', :modular_headers => true",
          "  pod 'RNFBFirestore', :path => '../node_modules/@react-native-firebase/firestore', :modular_headers => true"
        ].join('\n');

        if (!contents.includes("'RNFBFirestore'")) {
           contents = contents.replace(
             /use_expo_modules!/g,
             `use_expo_modules!\n${modularPods}`
           );
        }

        const postInstallPatches = [
          "    # --- PRODUCTION HARDENING & RNFB MODULARITY FIX START ---",
          "    installer.pods_project.targets.each do |target|",
          "      target.build_configurations.each do |config|",
          "        # Force consistent deployment target",
          "        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'",
          "        ",
          "        # Suppress duplicate library warnings",
          "        if config.build_settings['OTHER_LDFLAGS']",
          "          config.build_settings['OTHER_LDFLAGS'].delete('-lc++')",
          "        end",
          "        ",
          "        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'",
          "        ",
          "        if target.name.start_with?('RNFB') || target.name.include?('Firebase')",
          "          config.build_settings['DEFINES_MODULE'] = 'YES'",
          "          config.build_settings['USE_HEADER_MAP'] = 'NO'",
          "          ",
          "          paths = [",
          "            '$(inherited)',",
          "            '${PODS_ROOT}/Headers/Public/React-Core',",
          "            '${PODS_ROOT}/Headers/Public/FirebaseCore',",
          "            '${PODS_ROOT}/Headers/Public/FirebaseAuth',",
          "            '${PODS_ROOT}/Headers/Public/FirebaseFirestore',",
          "            '${PODS_CONFIGURATION_BUILD_DIR}/React-Core/React.framework/Headers'",
          "          ]",
          "          config.build_settings['HEADER_SEARCH_PATHS'] = paths.join(' ')",
          "          config.build_settings['OTHER_CFLAGS'] ||= ['$(inherited)']",
          "          config.build_settings['OTHER_CFLAGS'] << '-Wno-non-modular-include-in-framework-module'",
          "        end",
          "      end",
          "    end",
          "    # --- RNFB MODULARITY FIX END ---"
        ].join('\n');

        if (!contents.includes('PRODUCTION HARDENING')) {
          contents = contents.replace(
            /ccache_enabled => ccache_enabled\?\(podfile_properties\),\n    \)/g,
            `ccache_enabled => ccache_enabled?(podfile_properties),\n    )\n${postInstallPatches}`
          );
          fs.writeFileSync(podfile, contents, 'utf8');
        }
      }

      return config;
    },
  ]);
};

module.exports = withFirebasePatch;
