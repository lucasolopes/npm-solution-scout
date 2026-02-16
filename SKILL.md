---
name: npm-solution-scout
description: Intelligent npm package discovery and installation assistant. When users describe Node.js/JavaScript development problems, this skill searches the npm ecosystem, evaluates packages based on maintenance, security, and fit, recommends solutions, and optionally installs them after explicit confirmation.
---

# npm-solution-scout

An intelligent assistant for discovering, evaluating, and installing npm packages that solve specific development problems.

## When to Use This Skill

Trigger this skill when the user:
- Describes a Node.js/JavaScript development problem needing a library solution
- Asks "what package should I use for X?"
- Requests help finding npm packages for a specific use case
- Mentions needing a library/module/package for their project
- Examples: "I need a library for parsing CSV", "what's the best way to handle dates in JS?", "I need JWT authentication"

Do NOT trigger for:
- Questions about npm CLI usage itself
- Package-specific documentation questions (use web search)
- Debugging existing package issues
- General JavaScript questions not requiring external packages

## Workflow

### 1. Problem Understanding

Extract from user's request:
- **Core problem**: What are they trying to solve?
- **Runtime**: Node.js, browser, or both?
- **Language**: TypeScript or JavaScript?
- **Framework**: React, Vue, Express, Next.js, etc.
- **Environment constraints**: Bundle size, tree-shaking, ESM/CJS
- **License requirements**: MIT, Apache, permissive only?

If critical information is missing, ask UP TO 4 targeted questions. Keep it concise.

### 2. Package Discovery

Execute `scripts/search-npm.js` to find candidate packages:
```bash
node scripts/search-npm.js "<search-query>" [--limit 20]
```

The script uses `npm search --json` for reliable results. If it fails, it falls back to HTTP requests to registry.npmjs.org.

Load `references/package-evaluation.md` to understand evaluation criteria.

### 3. Deep Evaluation

For the top 10-15 candidates from search, run:
```bash
node scripts/evaluate-candidates.js <pkg1> <pkg2> <pkg3> ...
```

This fetches detailed metadata using `npm view --json` and applies scoring heuristics.

### 4. Ranking and Recommendation

Present 3-7 evaluated options in a comparison table with:
- Package name and version
- Downloads/week
- Last publish date
- Maintenance score
- License
- Key strengths/weaknesses
- TypeScript support
- ESM/CJS compatibility

**Recommend**:
- 1 primary choice with full justification
- 1 alternative with trade-off explanation

Load `references/safety-checklist.md` and verify recommendations pass safety checks.

### 5. Installation (Only After Explicit Confirmation)

**CRITICAL**: Never install without user confirmation phrases like:
- "install it"
- "yes, install"
- "go ahead"
- "install now"

When authorized, run:
```bash
node scripts/detect-package-manager.js
```

This detects:
- `pnpm` if `pnpm-lock.yaml` exists OR `packageManager` field in package.json starts with `pnpm@`
- `npm` if `package-lock.json` exists
- Defaults to `npm` otherwise
- Detects monorepo via `pnpm-workspace.yaml` or `workspaces` in package.json

For monorepos, ASK which workspace should receive the dependency.

Then execute:
```bash
node scripts/install-deps.js <package-name> [--workspace <workspace-name>]
```

### 6. Post-Installation Validation

After installation, automatically run:

1. **Audit**: `npm audit` or `pnpm audit` (report vulnerabilities)
2. **Tests**: If `test` script exists in package.json, run it (non-blocking)
3. **Lint**: If `lint` script exists, run it (non-blocking)

Report results. If tests/lint fail, inform user but don't rollback automatically.

### 7. Final Response

Provide:
- Installed package name and version
- Installation command used
- Audit results summary
- Next steps (import examples, configuration needed)
- Link to package documentation

## Safety Rules

- Never install deprecated packages
- Warn about packages with no activity in 2+ years
- Flag packages with known vulnerabilities
- Verify license compatibility
- Detect potential typosquatting (similar names to popular packages)
- Never auto-install without explicit user confirmation

## Example Usage

### Example 1: CSV Parsing

**User**: "I need to parse large CSV files in Node.js"

**Behavior**:
1. Extract: runtime=Node.js, use-case=CSV parsing, constraint=large files
2. Search: `node scripts/search-npm.js "csv parser"`
3. Evaluate top candidates: csv-parser, papaparse, fast-csv, csv-parse
4. Recommend: papaparse (streams, browser+Node) vs fast-csv (Node-only, faster)
5. Wait for confirmation
6. If confirmed: detect package manager → install → audit → report

### Example 2: Date Manipulation

**User**: "What's the best library for handling dates? I'm using TypeScript in a React app"

**Behavior**:
1. Extract: runtime=browser, language=TS, framework=React
2. Ask: "Do you need timezone support? Any bundle size constraints?"
3. Search and evaluate: date-fns, dayjs, luxon, moment (deprecated)
4. Recommend: date-fns (tree-shakeable, TS, modern) vs dayjs (smaller, simpler API)
5. Wait for confirmation

### Example 3: JWT Authentication

**User**: "I need JWT auth for my Express API"

**Behavior**:
1. Extract: runtime=Node.js, framework=Express, use-case=JWT
2. Search: jsonwebtoken, jose, fast-jwt
3. Evaluate and recommend: jsonwebtoken (standard, widely used) vs jose (modern, spec-compliant)
4. Mention security considerations (secret management, expiration)
5. Wait for confirmation
6. Post-install: suggest middleware setup example

## File Reference Guide

- **Load `references/package-evaluation.md`** before ranking packages (step 3)
- **Load `references/safety-checklist.md`** before final recommendation (step 4)
- **Execute `scripts/detect-package-manager.js`** before installation (step 5)
- **Execute `scripts/search-npm.js`** during discovery (step 2)
- **Execute `scripts/evaluate-candidates.js`** during evaluation (step 3)
- **Execute `scripts/install-deps.js`** during installation (step 5)

## Dry-Run Mode

By default, this skill operates in recommendation-only mode. It will:
- Search packages ✓
- Evaluate and rank ✓
- Recommend solutions ✓
- Install packages ✗ (only after explicit user confirmation)

This ensures safe, deliberate dependency management.