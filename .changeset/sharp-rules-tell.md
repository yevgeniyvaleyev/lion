---
'providence-analytics': patch
---

- Allow target dependencies via cli:
  When `--target-dependencies` is applied without argument, it will act as boolean and include all dependencies: for all search targets, will include all its dependencies (node_modules and bower_components).
  When a regex is supplied like `--target-dependencies /^my-brand-/`, it will filter all packages
  that comply with the regex.
- fix: Correct gatherFilesConfig references/targets
- fix: Provide target/reference result match
- fix: "from-import-to-export" helper function without filesystem lookup. This will allow to supply
  target/reference result matches to "match-imports" analyzer
