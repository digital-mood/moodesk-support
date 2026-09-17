# moodesk-support

Public documentation and support portal for **mooDesk**, a product by **digitalMood**.

- Documentation site: https://support.moodesk.io
- Bug reports, feature requests and documentation issues: [GitHub Issues](https://github.com/digital-mood/moodesk-support/issues/new/choose)

This repository does not contain the mooDesk source code.

## Local development

Requires Node.js 20 or later.

```bash
npm ci
npm run docs:dev      # local dev server
npm run docs:build    # production build (docs/.vitepress/dist)
npm run docs:preview  # preview the production build
```

The site is built with [VitePress](https://vitepress.dev) and deployed to GitHub Pages by
`.github/workflows/deploy.yml` on every push to `main`.

## Known issues

- `npm audit` reports advisories in `esbuild` / `vite` (transitive dependencies of
  VitePress 1.6.4) with no fix available on the 1.x line. They only affect the local
  development server (`docs:dev`), not the static site that is published. Upgrading to
  VitePress 2 (currently alpha) is deliberately postponed.

## Reporting sensitive issues

Issues are public. Never post credentials, personal data or production dumps. If a report
involves a security vulnerability, do not open a public issue; contact digitalMood directly.
