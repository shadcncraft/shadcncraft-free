- Use pnpm as the package manager

# Shadcraft Registry

shadcn/ui-compatible registry of components, blocks, hooks, styles + preview UI.

## Commands

- `pnpm dev` — Dev server
- `pnpm build` — Full prod build (includes registry:build)
- `pnpm registry:build` — Regen registry JSON + __index__.tsx

## Key Concepts

- Registry items live in `src/registry/`
- Generated files (`public/r/`, `registry.json`) — DO NOT EDIT

## See Also

- [docs/REGISTRY.md](docs/REGISTRY.md) — Full registry documentation
- [src/registry/AGENTS.md](src/registry/AGENTS.md) — Registry-specific guidance

## JSON Render package (`packages/json-render`)

`@shadcncraft/json-render` is built from this registry: each free block takes
typed props (defaults = the current sample content), and
`src/registry/json-render/<item>/` holds its catalog, adapter and example.
See [packages/json-render/DEVELOPMENT.md](packages/json-render/DEVELOPMENT.md).

- `pnpm json-render:check` — default renders unchanged + contracts.
- `pnpm json-render:build` — regenerate the package.
- Block prop changes must keep `default-markup.mts --check` passing; update the
  baseline only for intended visual changes.
