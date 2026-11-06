#!/usr/bin/env node
// Full-page screenshots of a content set for visual review.
//   node checks/shots.mjs <set> <width> <light|dark> <out.png> [--port 5241] [--session free-jr]
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";

import { buildSets } from "./content-sets.mjs";

const [set, width, theme, out] = process.argv.slice(2);
const option = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const port = option("port", "5241");
const session = option("session", "free-jr");
const pkg = new URL("../node_modules/@shadcncraft/json-render/", import.meta.url);
const guidance = JSON.parse(readFileSync(new URL("guidance.json", pkg)));
const examples = Object.fromEntries(
  readdirSync(new URL("examples/", pkg))
    .filter((f) => f.endsWith(".json"))
    .map((f) => [
      f.replace(/\.json$/, ""),
      JSON.parse(readFileSync(new URL(`examples/${f}`, pkg))),
    ])
);
const spec = buildSets(examples, guidance)[set];
const run = (...cmd) =>
  execFileSync("agent-browser", ["--session", session, ...cmd], { encoding: "utf8" });
run("set", "viewport", width, "900");
run("open", `http://127.0.0.1:${port}/`);
run("wait", "--fn", "typeof window.__render === 'function'");
run(
  "eval",
  `window.__theme(${theme === "dark"}); window.__render(${JSON.stringify(spec)}); true`
);
run("wait", "800");
run("screenshot", "--full", out);
console.log(out);
