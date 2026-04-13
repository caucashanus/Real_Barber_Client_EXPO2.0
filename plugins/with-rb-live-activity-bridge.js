const { createRunOncePlugin, withXcodeProject, IOSConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Copies ActivityKit + RCT bridge into the iOS *application* target only (not the widget extension).
 */
function withRbLiveActivityBridge(config) {
  return withXcodeProject(config, (cfg) => {
    const projectRoot = cfg.modRequest.projectRoot;
    const platformRoot = cfg.modRequest.platformProjectRoot;
    // Paths expect repo root (glob `ios/*/AppDelegate`). If AppDelegate is not there yet, fall back to app.json name.
    const projectName = IOSConfig.XcodeUtils.getHackyProjectName(projectRoot, cfg);
    const sourceDir = path.join(projectRoot, 'native', 'rb-live-activity');
    const destDir = path.join(platformRoot, projectName, 'RBLiveActivity');
    const groupPath = `${projectName}/RBLiveActivity`;

    fs.mkdirSync(destDir, { recursive: true });
    for (const file of ['RBActivityBridge.swift', 'RBActivityBridge.m']) {
      fs.copyFileSync(path.join(sourceDir, file), path.join(destDir, file));
    }

    const project = cfg.modResults;
    IOSConfig.XcodeUtils.ensureGroupRecursively(project, groupPath);

    IOSConfig.XcodeUtils.addBuildSourceFileToGroup({
      filepath: `${groupPath}/RBActivityBridge.swift`,
      groupName: groupPath,
      project,
      verbose: true,
    });
    IOSConfig.XcodeUtils.addBuildSourceFileToGroup({
      filepath: `${groupPath}/RBActivityBridge.m`,
      groupName: groupPath,
      project,
      verbose: true,
    });

    return cfg;
  });
}

module.exports = createRunOncePlugin(withRbLiveActivityBridge, 'with-rb-live-activity-bridge');
