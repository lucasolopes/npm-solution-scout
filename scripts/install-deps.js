#!/usr/bin/env node

/**
 * Install npm package with safety checks and validation
 *
 * Usage: node install-deps.js <package-name> [--workspace <workspace-name>]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function detectPackageManager() {
  const cwd = process.cwd();

  // Check for pnpm
  if (fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }

  // Check package.json for packageManager field
  const pkgJsonPath = path.join(cwd, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    try {
      const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
      if (pkgJson.packageManager?.startsWith('pnpm@')) {
        return 'pnpm';
      }
    } catch (error) {
      // Continue with default
    }
  }

  // Check for npm
  if (fs.existsSync(path.join(cwd, 'package-lock.json'))) {
    return 'npm';
  }

  return 'npm'; // Default
}

function verifyPackageExists(packageName) {
  try {
    execSync(`npm view ${packageName} name`, {
      stdio: 'pipe',
      encoding: 'utf8'
    });
    return true;
  } catch (error) {
    return false;
  }
}

function checkDeprecation(packageName) {
  try {
    const result = execSync(`npm view ${packageName} deprecated`, {
      stdio: 'pipe',
      encoding: 'utf8'
    }).trim();
    return result || null;
  } catch (error) {
    return null;
  }
}

function installPackage(packageName, workspace = null) {
  const manager = detectPackageManager();

  let cmd;
  if (manager === 'pnpm') {
    if (workspace) {
      cmd = `pnpm add ${packageName} --filter ${workspace}`;
    } else {
      cmd = `pnpm add ${packageName}`;
    }
  } else {
    if (workspace) {
      cmd = `npm install ${packageName} --workspace=${workspace}`;
    } else {
      cmd = `npm install ${packageName}`;
    }
  }

  console.error(`Executing: ${cmd}`);

  try {
    const output = execSync(cmd, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    return {
      success: true,
      manager,
      command: cmd,
      output
    };
  } catch (error) {
    return {
      success: false,
      manager,
      command: cmd,
      error: error.message,
      stderr: error.stderr
    };
  }
}

function runAudit() {
  const manager = detectPackageManager();
  const cmd = manager === 'pnpm' ? 'pnpm audit --json' : 'npm audit --json';

  try {
    const output = execSync(cmd, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const audit = JSON.parse(output);
    return {
      success: true,
      vulnerabilities: audit.metadata?.vulnerabilities || audit.vulnerabilities || {},
      advisories: audit.advisories || []
    };
  } catch (error) {
    // npm audit exits with non-zero if vulnerabilities found
    try {
      const audit = JSON.parse(error.stdout || '{}');
      return {
        success: false,
        vulnerabilities: audit.metadata?.vulnerabilities || audit.vulnerabilities || {},
        advisories: audit.advisories || []
      };
    } catch (parseError) {
      return {
        success: false,
        error: 'Could not parse audit results'
      };
    }
  }
}

function runTests() {
  const pkgJsonPath = path.join(process.cwd(), 'package.json');

  if (!fs.existsSync(pkgJsonPath)) {
    return { skipped: true, reason: 'No package.json found' };
  }

  try {
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));

    if (!pkgJson.scripts?.test) {
      return { skipped: true, reason: 'No test script defined' };
    }

    const manager = detectPackageManager();
    const cmd = manager === 'pnpm' ? 'pnpm test' : 'npm test';

    execSync(cmd, {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 60000 // 60 second timeout
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      note: 'Test failure does not rollback installation'
    };
  }
}

function runLint() {
  const pkgJsonPath = path.join(process.cwd(), 'package.json');

  if (!fs.existsSync(pkgJsonPath)) {
    return { skipped: true, reason: 'No package.json found' };
  }

  try {
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));

    if (!pkgJson.scripts?.lint) {
      return { skipped: true, reason: 'No lint script defined' };
    }

    const manager = detectPackageManager();
    const cmd = manager === 'pnpm' ? 'pnpm lint' : 'npm run lint';

    execSync(cmd, {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 60000 // 60 second timeout
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      note: 'Lint failure does not rollback installation'
    };
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node install-deps.js <package-name> [--workspace <workspace-name>]');
    process.exit(1);
  }

  const packageName = args[0];
  let workspace = null;

  const workspaceIndex = args.indexOf('--workspace');
  if (workspaceIndex !== -1 && args[workspaceIndex + 1]) {
    workspace = args[workspaceIndex + 1];
  }

  // Pre-installation checks
  console.error('Verifying package exists...');
  if (!verifyPackageExists(packageName)) {
    console.error(JSON.stringify({
      error: `Package "${packageName}" not found in npm registry`
    }, null, 2));
    process.exit(1);
  }

  console.error('Checking for deprecation...');
  const deprecation = checkDeprecation(packageName);
  if (deprecation) {
    console.error(JSON.stringify({
      warning: `Package is deprecated: ${deprecation}`
    }, null, 2));
  }

  // Install
  console.error('Installing package...');
  const installResult = installPackage(packageName, workspace);

  if (!installResult.success) {
    console.error(JSON.stringify({
      error: 'Installation failed',
      details: installResult
    }, null, 2));
    process.exit(1);
  }

  // Post-installation validation
  console.error('Running security audit...');
  const auditResult = runAudit();

  console.error('Running tests (if available)...');
  const testResult = runTests();

  console.error('Running linter (if available)...');
  const lintResult = runLint();

  // Output results
  const result = {
    installation: installResult,
    audit: auditResult,
    tests: testResult,
    lint: lintResult
  };

  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  main();
}

module.exports = { installPackage, runAudit, runTests, runLint };