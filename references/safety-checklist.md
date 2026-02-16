# Safety Checklist for Package Installation

Before recommending installation, verify ALL of the following:

## ✓ Package Legitimacy

- [ ] Package name is spelled correctly (no typosquatting)
- [ ] Publisher is verified or well-known
- [ ] Package has significant usage (>1K weekly downloads OR established maintainer)
- [ ] Package repository link is valid and matches publisher

**Typosquatting patterns to watch:**
- Single character differences from popular packages (e.g., `requst` vs `request`)
- Hyphen/underscore variations (e.g., `lodash-utils` when official is `lodash.utils`)
- Common typos (e.g., `cross-env` → `crossenv`)

## ✓ Maintenance Status

- [ ] NOT marked as deprecated
- [ ] Last publish within 2 years (preferably 1 year)
- [ ] No abandonment warnings in README
- [ ] Repository is active (not archived on GitHub)

**If package is inactive but widely used:**
- Check if there's an official successor
- Verify no known security issues
- Warn user about maintenance risk

## ✓ Security Verification

- [ ] Run `npm audit` check (will happen post-install)
- [ ] No critical/high vulnerabilities in latest version
- [ ] Check for security advisories (GitHub Security tab if available)
- [ ] Verify dependencies are reasonable (not excessive or suspicious)

**Red flags:**
- Obfuscated code in package
- Unexpected network calls
- Cryptocurrency mining references
- Unusual post-install scripts

## ✓ License Compliance

- [ ] License is clearly stated
- [ ] License is compatible with user's project
- [ ] If GPL/AGPL, explicitly warn about copyleft implications

**When in doubt:**
- Disclose license prominently
- Link to license details
- Let user make informed decision

## ✓ Compatibility

- [ ] Node.js version requirements are met (check `engines` field)
- [ ] Peer dependencies are compatible with existing project
- [ ] ESM/CJS format matches project type
- [ ] TypeScript version compatibility (if applicable)

## ✓ Bundle Size (for browser contexts)

- [ ] Check bundlephobia.com data if available
- [ ] Warn if package adds >100KB minified+gzipped
- [ ] Verify tree-shaking support for large libraries

## ✓ Breaking Change Risk

- [ ] Check if major version upgrade required
- [ ] Review CHANGELOG for breaking changes
- [ ] Warn about migration effort if needed

## ✓ Monorepo Considerations

- [ ] If monorepo detected, confirm target workspace
- [ ] Verify workspace exists
- [ ] Check if package should be in workspace vs root

## Pre-Installation Verification Script

Before running installation, check:
```bash
# 1. Verify package exists
npm view <package-name> name

# 2. Check for deprecation
npm view <package-name> deprecated

# 3. Preview what will be installed
npm view <package-name> version engines peerDependencies

# 4. Dry-run installation
npm install <package-name> --dry-run
```

## Post-Installation Validation

After installation completes:

1. **Audit**: Run security audit immediately
2. **Tests**: If project has tests, run them
3. **Type Check**: If TypeScript project, run `tsc --noEmit`
4. **Build**: If build script exists, attempt build

**If any validation fails:**
- Report failure clearly
- Suggest rollback: `npm uninstall <package>`
- Help diagnose issue

## Emergency Rollback

If user reports issues after installation:
```bash
# Uninstall package
<package-manager> uninstall <package-name>

# Restore previous state (if lock file was committed)
git restore package.json <lock-file>
<package-manager> install
```

## Documentation

Always provide after installation:
- Installation command used
- Package version installed
- Basic import/usage example
- Link to official documentation
- Next steps (configuration, setup)