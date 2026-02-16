#!/usr/bin/env node

/**
 * Evaluate npm package candidates
 *
 * Fetches detailed metadata and applies scoring heuristics
 * Usage: node evaluate-candidates.js pkg1 pkg2 pkg3 ...
 */

const { execSync } = require('child_process');
const https = require('https');

function getPackageInfo(packageName) {
  try {
    const cmd = `npm view ${packageName} --json`;
    const output = execSync(cmd, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    return JSON.parse(output);
  } catch (error) {
    throw new Error(`Failed to fetch info for ${packageName}: ${error.message}`);
  }
}

function getDownloadStats(packageName) {
  return new Promise((resolve, reject) => {
    const url = `https://api.npmjs.org/downloads/point/last-week/${packageName}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const stats = JSON.parse(data);
          resolve(stats.downloads || 0);
        } catch (error) {
          resolve(0); // Default to 0 on parse error
        }
      });
    }).on('error', () => {
      resolve(0); // Default to 0 on network error
    });
  });
}

function calculateMaintenanceScore(pkg) {
  let score = 0;

  const now = new Date();
  const lastPublish = new Date(pkg.time?.modified || pkg.time?.created || 0);
  const monthsSincePublish = (now - lastPublish) / (1000 * 60 * 60 * 24 * 30);

  if (monthsSincePublish < 6) {
    score += 3;
  } else if (monthsSincePublish < 12) {
    score += 2;
  } else if (monthsSincePublish < 24) {
    score += 1;
  } else if (monthsSincePublish > 36) {
    score -= 5;
  }

  // Check for deprecated flag
  if (pkg.deprecated) {
    score = 0; // Automatic disqualification
  }

  // Regular releases indicator
  const versions = Object.keys(pkg.time || {}).filter(v => v !== 'created' && v !== 'modified');
  if (versions.length > 10) {
    score += 2;
  } else if (versions.length > 5) {
    score += 1;
  }

  return Math.max(0, Math.min(10, score));
}

function calculatePopularityScore(downloads) {
  if (downloads >= 10000000) return 10;
  if (downloads >= 1000000) return 8;
  if (downloads >= 100000) return 6;
  if (downloads >= 10000) return 4;
  if (downloads >= 1000) return 2;
  return 1;
}

function calculateQualityScore(pkg) {
  let score = 0;

  // TypeScript support
  if (pkg.types || pkg.typings) {
    score += 3;
  } else if (pkg.name.startsWith('@types/')) {
    score += 2;
  }

  // Has repository
  if (pkg.repository) {
    score += 1;
  }

  // Has keywords
  if (pkg.keywords && pkg.keywords.length > 0) {
    score += 1;
  }

  // Has homepage/docs
  if (pkg.homepage) {
    score += 1;
  }

  // Active maintainers
  if (pkg.maintainers && pkg.maintainers.length > 0) {
    score += 1;
  }

  return Math.min(10, score);
}

function calculateSecurityScore(pkg) {
  let score = 10;

  // Deprecated packages
  if (pkg.deprecated) {
    score -= 8;
  }

  // Suspicious patterns (basic heuristics)
  const name = pkg.name.toLowerCase();
  if (name.includes('test') && name.includes('package')) {
    score -= 3;
  }

  // Very few downloads might indicate abandoned or suspicious
  // (will be cross-referenced with download stats)

  return Math.max(0, score);
}

function detectLicense(pkg) {
  if (typeof pkg.license === 'string') {
    return pkg.license;
  }
  if (pkg.license?.type) {
    return pkg.license.type;
  }
  if (pkg.licenses && Array.isArray(pkg.licenses)) {
    return pkg.licenses.map(l => l.type || l).join(', ');
  }
  return 'Unknown';
}

function isLicenseCompatible(license) {
  const compatible = ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'CC0-1.0', '0BSD'];
  const problematic = ['GPL-3.0', 'AGPL-3.0', 'AGPL'];

  const upperLicense = license.toUpperCase();

  if (compatible.some(l => upperLicense.includes(l.toUpperCase()))) {
    return 'compatible';
  }
  if (problematic.some(l => upperLicense.includes(l.toUpperCase()))) {
    return 'problematic';
  }
  return 'unknown';
}

async function evaluatePackage(packageName) {
  try {
    const pkg = getPackageInfo(packageName);
    const downloads = await getDownloadStats(packageName);

    const maintenance = calculateMaintenanceScore(pkg);
    const popularity = calculatePopularityScore(downloads);
    const quality = calculateQualityScore(pkg);
    const security = calculateSecurityScore(pkg);

    const license = detectLicense(pkg);
    const licenseCompatibility = isLicenseCompatible(license);

    // Composite score (weighted)
    const compositeScore = (
      quality * 0.15 +
      maintenance * 0.25 +
      security * 0.20 +
      popularity * 0.10
    ) + 3.0; // Fit score placeholder (will be determined by context)

    return {
      name: packageName,
      version: pkg.version,
      description: pkg.description,
      downloads,
      lastPublish: pkg.time?.modified || pkg.time?.created,
      deprecated: pkg.deprecated || false,
      license,
      licenseCompatibility,
      repository: pkg.repository?.url,
      homepage: pkg.homepage,
      hasTypes: !!(pkg.types || pkg.typings),
      keywords: pkg.keywords || [],
      maintainers: pkg.maintainers?.length || 0,
      scores: {
        maintenance,
        popularity,
        quality,
        security,
        composite: Math.round(compositeScore * 10) / 10
      }
    };
  } catch (error) {
    return {
      name: packageName,
      error: error.message,
      scores: {
        maintenance: 0,
        popularity: 0,
        quality: 0,
        security: 0,
        composite: 0
      }
    };
  }
}

async function main() {
  const packages = process.argv.slice(2);

  if (packages.length === 0) {
    console.error('Usage: node evaluate-candidates.js pkg1 pkg2 pkg3 ...');
    process.exit(1);
  }

  const evaluations = await Promise.all(
    packages.map(pkg => evaluatePackage(pkg))
  );

  console.log(JSON.stringify(evaluations, null, 2));
}

if (require.main === module) {
  main();
}

module.exports = { evaluatePackage };