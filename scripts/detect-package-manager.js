#!/usr/bin/env node

/**
 * Detect package manager and monorepo configuration
 *
 * Detection priority:
 * 1. pnpm: if pnpm-lock.yaml exists OR packageManager field starts with "pnpm@"
 * 2. npm: if package-lock.json exists
 * 3. Default: npm
 *
 * Monorepo detection:
 * - pnpm: pnpm-workspace.yaml exists
 * - npm/yarn: workspaces field in package.json
 */

const fs = require('fs');
const path = require('path');

function detectPackageManager() {
  const cwd = process.cwd();

  const result = {
    manager: 'npm',
    isMonorepo: false,
    workspaces: [],
    lockFile: null
  };

  // Check for pnpm
  const pnpmLockPath = path.join(cwd, 'pnpm-lock.yaml');
  if (fs.existsSync(pnpmLockPath)) {
    result.manager = 'pnpm';
    result.lockFile = 'pnpm-lock.yaml';
  }

  // Check package.json for packageManager field
  const pkgJsonPath = path.join(cwd, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    try {
      const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));

      // Check packageManager field
      if (pkgJson.packageManager?.startsWith('pnpm@')) {
        result.manager = 'pnpm';
      }

      // Check for workspaces
      if (pkgJson.workspaces) {
        result.isMonorepo = true;
        result.workspaces = Array.isArray(pkgJson.workspaces)
          ? pkgJson.workspaces
          : pkgJson.workspaces.packages || [];
      }
    } catch (error) {
      // Invalid package.json, continue with defaults
    }
  }

  // Override with npm if npm lock exists (unless pnpm was detected via packageManager)
  const npmLockPath = path.join(cwd, 'package-lock.json');
  if (fs.existsSync(npmLockPath) && result.manager !== 'pnpm') {
    result.manager = 'npm';
    result.lockFile = 'package-lock.json';
  }

  // Check for pnpm workspace config
  const pnpmWorkspacePath = path.join(cwd, 'pnpm-workspace.yaml');
  if (fs.existsSync(pnpmWorkspacePath)) {
    result.isMonorepo = true;
    result.manager = 'pnpm';

    // Parse workspace patterns
    try {
      const workspaceContent = fs.readFileSync(pnpmWorkspacePath, 'utf8');
      const packages = workspaceContent
        .split('\n')
        .filter(line => line.trim().startsWith('- '))
        .map(line => line.trim().substring(2).replace(/['"]/g, ''));

      if (packages.length > 0) {
        result.workspaces = packages;
      }
    } catch (error) {
      // Could not parse, keep empty workspaces
    }
  }

  return result;
}

function main() {
  const config = detectPackageManager();

  console.log(JSON.stringify(config, null, 2));

  // Exit codes for script usage
  if (config.manager === 'pnpm') {
    process.exit(1);
  } else if (config.manager === 'npm') {
    process.exit(0);
  } else {
    process.exit(2);
  }
}

if (require.main === module) {
  main();
}

module.exports = { detectPackageManager };