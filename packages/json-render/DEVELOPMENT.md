# Developing @shadcncraft/json-render

The package is generated from the free registry. Nothing under `modules/`,
`types/`, `styles/`, `data/` or `examples/` is edited by hand.

## Where things live

| What | Where |
| --- | --- |
| Block source (typed props, defaults = sample content) | `src/registry/pro-marketing/blocks/**` |
| Per-block catalog (Zod props, events), adapter, example | `src/registry/json-render/<item>/` |
| Block list, export names, events | `src/registry/json-render/contracts.json` |
| Agent guidance and copy limits | `src/registry/json-render/guidance.json` |
| Scoped base styles (no global reset) | `src/registry/json-render/base.css` |
| Example pages | `src/registry/json-render/pages/` |
| Builder | `src/scripts/json-render/build-package.mts` |
| Hand-written package files | `packages/json-render/*.js`, `*.d.ts`, `bin/`, `skills/`, `README.md` |

## Adding a block

1. Give the block typed, optional props whose defaults are its current
   content, so a registry install renders exactly as before.
2. Add `src/registry/json-render/<item>/catalog.ts`, `components.tsx` and
   `example.json` (set every prop), an entry in `contracts.json` and guidance in
   `guidance.json`.
3. Run the checks below.

## Checks

From the repo root:

```sh
pnpm json-render:check   # default renders unchanged; contracts render their examples
pnpm json-render:build
```

From `packages/json-render/demo/` (a bare Vite app that installs the packed tarball):

```sh
sh refresh.sh 0.1.0-local.N        # rebuild, pack, install a new local version
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5241 --force   # keep running
node checks/layout.mjs --port 5241 # agent-browser: 11 blocks × 3 widths × 2 themes × 5 content sets + actions
node checks/validate.mjs           # validator issue codes, shipped examples, CLI
node node_modules/typescript/bin/tsc -p checks/types                         # strict NodeNext consumer
node node_modules/typescript/bin/tsc -p checks/types/tsconfig.bundler.json   # strict Bundler consumer
node checks/shots.mjs long 375 dark out.png                                  # screenshot a content set
```

`checks/layout.mjs` needs the `agent-browser` CLI. Use a new local version for
every rebuild of an installed tarball, and restart Vite with `--force`.

`refresh.sh` stamps the local version on the generated `package.json` only;
`package.base.json` keeps the release version.

## Releasing

`package.base.json` holds the release version, and `npm publish` runs from
`packages/json-render` after `pnpm json-render:build`. The
`.github/workflows/publish-json-render.yml` workflow does both, with npm
provenance, when a `json-render-v<version>` tag is pushed:

```sh
pnpm json-render:check && pnpm json-render:build
(cd packages/json-render && npm publish --dry-run)
git tag json-render-v0.1.0 && git push origin json-render-v0.1.0
```

The tag must match `package.base.json`. Versions with a prerelease suffix
publish to the `next` dist-tag. The workflow authenticates with npm trusted
publishing once it's configured for the package (workflow
`publish-json-render.yml`, environment `npm`), or an `NPM_TOKEN` repository
secret before then.
