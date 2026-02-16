# npm-solution-scout

> Intelligent npm package discovery and installation assistant for Claude Code

## 🎯 What it does

This skill helps you find, evaluate, and install the best npm packages for your Node.js/JavaScript projects. Just describe your problem, and it will:

- 🔍 Search the npm ecosystem
- ⚡ Evaluate packages based on maintenance, security, and fit
- 📊 Compare alternatives with detailed metrics
- ✅ Recommend the best solution
- 📦 Install packages (after your confirmation)

## 📥 Installation

### Option 1: Install from npm (once published)

```bash
claude code skill install @your-username/npm-solution-scout
```

### Option 2: Install from local directory

```bash
claude code skill install /home/olopes/npm-solution-scout
```

### Option 3: Install from GitHub (once pushed)

```bash
claude code skill install github:YOUR_USERNAME/npm-solution-scout
```

## 🚀 Usage

Just ask Claude about npm packages in natural language:

- "I need a library for parsing CSV files"
- "What's the best way to handle dates in TypeScript?"
- "I need JWT authentication for my Express API"

The skill will automatically activate when you describe a development problem that needs a package solution.

## 📋 Features

- Smart package discovery using npm search
- Detailed evaluation based on:
  - Download statistics
  - Maintenance activity
  - Security vulnerabilities
  - TypeScript support
  - License compatibility
  - Bundle size and tree-shaking
- Automatic package manager detection (npm/pnpm)
- Monorepo support
- Post-installation validation (audit, tests)
- Safety checks against deprecated/vulnerable packages

## 🛡️ Safety

This skill follows strict safety rules:
- Never auto-installs without explicit confirmation
- Checks for deprecation and vulnerabilities
- Verifies license compatibility
- Detects potential typosquatting
- Warns about unmaintained packages

## 📚 License

MIT
