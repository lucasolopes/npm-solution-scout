# Package Evaluation Criteria

This document defines how to evaluate and score npm packages for recommendation.

## Scoring Dimensions

### 1. Maintenance Score (0-10)

**Indicators of good maintenance:**
- Last published within 6 months: +3 points
- Last published within 1 year: +2 points
- Last published within 2 years: +1 point
- Over 2 years: 0 points

**Activity signals:**
- Regular release cadence: +2 points
- Active issue response: +1 point
- Recent commits (check GitHub if available): +1 point

**Red flags:**
- Deprecated flag: automatic disqualification
- No updates in 3+ years: -5 points
- Open critical issues with no response: -2 points

### 2. Popularity Score (0-10)

Based on weekly downloads:
- 10M+: 10 points
- 1M-10M: 8 points
- 100K-1M: 6 points
- 10K-100K: 4 points
- 1K-10K: 2 points
- <1K: 1 point

**Adjustments:**
- Recent surge (10x growth in 3 months): +1 point
- Declining trend: -1 point

### 3. Quality Score (0-10)

**TypeScript support:**
- Native TS implementation: +3 points
- Excellent type definitions (@types or bundled): +2 points
- Basic type definitions: +1 point
- No types: 0 points

**Testing:**
- Test coverage >80%: +2 points
- Test coverage 50-80%: +1 point
- CI/CD visible: +1 point

**Documentation:**
- Comprehensive docs: +2 points
- Examples present: +1 point
- API reference: +1 point

### 4. Fit Score (0-10)

How well does it solve the specific problem?

- Perfect match for use case: 10 points
- Solves problem but with extra features: 7 points
- Requires additional work/adaptation: 5 points
- Partial solution: 3 points
- Tangentially related: 1 point

**Considerations:**
- Runtime compatibility (Node/browser)
- Framework integration
- Bundle size for browser contexts
- ESM/CJS compatibility
- Peer dependency conflicts

### 5. Security Score (0-10)

Start at 10, deduct for issues:

- Known vulnerabilities: -5 points per critical, -2 per high
- Suspicious patterns (obfuscation, network calls): -8 points
- No security policy: -1 point
- Unmaintained dependencies: -2 points
- Typosquatting risk (similar to popular package): -3 points

### 6. License Compatibility (Pass/Fail)

**Compatible licenses (for most projects):**
- MIT
- Apache-2.0
- BSD-2-Clause, BSD-3-Clause
- ISC
- CC0-1.0

**Potentially problematic:**
- GPL-3.0 (copyleft implications)
- AGPL (network copyleft)
- Custom/proprietary licenses

Always disclose license. If user has constraints, filter accordingly.

## Composite Scoring

**Overall Score** = weighted average:
- Fit: 30%
- Maintenance: 25%
- Security: 20%
- Quality: 15%
- Popularity: 10%

Packages scoring <5.0 overall should not be recommended unless no alternatives exist.

## Comparison Matrix

When presenting 3-7 options, use this table format:

| Package | Version | DL/week | Last Pub | Maint | Security | TS | Score | Key Notes |
|---------|---------|---------|----------|-------|----------|-------|-------|-----------|
| pkg-a   | 2.1.0   | 5M      | 2m ago   | 9/10  | 10/10    | ✓     | 8.5   | Most popular, excellent docs |
| pkg-b   | 1.4.2   | 500K    | 1y ago   | 5/10  | 8/10     | ✗     | 6.2   | Lightweight but stale |

## Special Considerations

### Framework-Specific Packages

For React, Vue, Angular, etc., prioritize:
- Official framework support
- Hooks/composition API compatibility
- SSR/SSG compatibility
- Community adoption within that ecosystem

### Performance-Critical Use Cases

For high-performance needs:
- Benchmark data (if available)
- Memory footprint
- Bundle size impact
- Native addon availability

### Enterprise Context

Red flags for enterprise:
- Single maintainer with no bus factor mitigation
- No security disclosure process
- Frequent breaking changes
- Poor backward compatibility