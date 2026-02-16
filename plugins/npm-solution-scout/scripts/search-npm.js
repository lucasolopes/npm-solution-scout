#!/usr/bin/env node

/**
 * Search npm registry for packages
 *
 * Strategy:
 * 1. Try npm search --json (most reliable)
 * 2. Fallback to registry HTTP API
 *
 * Usage: node search-npm.js "search query" [--limit 20]
 */

const { execSync } = require('child_process');
const https = require('https');

const DEFAULT_LIMIT = 20;

function searchViaCLI(query, limit) {
  try {
    const cmd = `npm search "${query}" --json --long --searchlimit ${limit}`;
    const output = execSync(cmd, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });

    const results = JSON.parse(output);
    return results.map(pkg => ({
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      author: pkg.author,
      date: pkg.date,
      keywords: pkg.keywords || [],
      links: pkg.links || {},
      publisher: pkg.publisher || {},
      maintainers: pkg.maintainers || []
    }));
  } catch (error) {
    throw new Error(`CLI search failed: ${error.message}`);
  }
}

function searchViaHTTP(query, limit) {
  return new Promise((resolve, reject) => {
    const searchQuery = encodeURIComponent(query);
    const url = `https://registry.npmjs.org/-/v1/search?text=${searchQuery}&size=${limit}`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          const results = response.objects.map(obj => ({
            name: obj.package.name,
            version: obj.package.version,
            description: obj.package.description,
            author: obj.package.author,
            date: obj.package.date,
            keywords: obj.package.keywords || [],
            links: obj.package.links || {},
            publisher: obj.package.publisher || {},
            maintainers: obj.package.maintainers || [],
            score: obj.score
          }));
          resolve(results);
        } catch (error) {
          reject(new Error(`Failed to parse HTTP response: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`HTTP request failed: ${error.message}`));
    });
  });
}

async function searchPackages(query, limit = DEFAULT_LIMIT) {
  // Try CLI first
  try {
    const results = searchViaCLI(query, limit);
    return {
      success: true,
      method: 'cli',
      results,
      count: results.length
    };
  } catch (cliError) {
    console.error(`CLI search failed: ${cliError.message}`, { stderr: true });

    // Fallback to HTTP
    try {
      const results = await searchViaHTTP(query, limit);
      return {
        success: true,
        method: 'http',
        results,
        count: results.length
      };
    } catch (httpError) {
      return {
        success: false,
        error: `Both search methods failed. CLI: ${cliError.message}, HTTP: ${httpError.message}`,
        results: []
      };
    }
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node search-npm.js "search query" [--limit 20]');
    process.exit(1);
  }

  let query = args[0];
  let limit = DEFAULT_LIMIT;

  const limitIndex = args.indexOf('--limit');
  if (limitIndex !== -1 && args[limitIndex + 1]) {
    limit = parseInt(args[limitIndex + 1], 10);
    if (isNaN(limit) || limit < 1) {
      limit = DEFAULT_LIMIT;
    }
  }

  searchPackages(query, limit).then(response => {
    console.log(JSON.stringify(response, null, 2));
    process.exit(response.success ? 0 : 1);
  });
}

if (require.main === module) {
  main();
}

module.exports = { searchPackages };