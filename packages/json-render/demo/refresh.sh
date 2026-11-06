#!/bin/sh
# Rebuild the package, pack it under a new local version and install it here.
# Usage: sh refresh.sh <version>   (e.g. 0.1.0-local.2)
set -e
version="$1"
[ -n "$version" ] || { echo "usage: sh refresh.sh <version>"; exit 1; }
here="$(cd "$(dirname "$0")" && pwd)"
repo="$here/../../.."
node -e "const f='$here/../package.base.json';const p=require(f);p.version='$version';require('fs').writeFileSync(f,JSON.stringify(p,null,2)+'\n')"
(cd "$repo" && node_modules/.bin/tsx src/scripts/json-render/build-package.mts >/dev/null)
(cd "$here/.." && rm -f shadcncraft-json-render-*.tgz && npm pack --silent >/dev/null)
node -e "const f='$here/package.json';const p=require(f);p.dependencies['@shadcncraft/json-render']='file:../shadcncraft-json-render-$version.tgz';require('fs').writeFileSync(f,JSON.stringify(p,null,2)+'\n')"
(cd "$here" && CI=true npx -y pnpm@10 install --ignore-workspace --no-frozen-lockfile >/dev/null)
echo "installed @shadcncraft/json-render@$version; restart Vite with --force"
