# Setup Lint + Type Checking CI

## Metadata
- **Priority:** Low
- **Status:** Pending
- **Estimated time:** ~30min
- **Dependencies:** None

## Problem

No lint script in `package.json`. No type check in CI. Code style drifts. `bun test` is the only gate, which doesn't catch style issues or type errors that TypeScript reports.

## Solution

### 1. Add tsc type checking

Add a `tsc` script using Bun's built-in TypeScript support:

```json
// package.json
{
  "scripts": {
    "typecheck": "bun tsc --noEmit",
    "test": "bun test",
    "precommit": "bun run typecheck && bun test"
  }
}
```

Note: Bun `tsc` requires `typescript` as a dep. If not present, use `bunx tsc --noEmit` or install:

```bash
bun add -d typescript
```

### 2. Add ESLint

```bash
bun add -d eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

Create `eslint.config.js` (flat config for ESLint 9+):

```javascript
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
  {
    files: ["src/**/*.ts"],
    languageOptions: { parser: tsparser },
    plugins: { "@typescript-eslint": tseslint },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "warn",
    },
  },
];
```

Add lint script:

```json
{ "scripts": { "lint": "eslint src/" } }
```

### 3. CI workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI
on: [pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run lint
      - run: bun run typecheck
      - run: bun test
```

### 4. Pre-commit (optional)

```bash
bun add -d husky lint-staged
```

Config `lint-staged` for staged file checks.

## Acceptance Criteria

- [ ] `bun run lint` passes on current code (or initial warnings documented)
- [ ] `bun run typecheck` passes
- [ ] CI workflow runs lint + typecheck + test on every PR
- [ ] `bun run precommit` available as shorthand
