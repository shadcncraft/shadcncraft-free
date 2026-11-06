#!/usr/bin/env node
// Layout and behaviour checks for the installed package, driven through the
// agent-browser CLI against the running demo (vite in packages/json-render/demo).
//
//   node checks/layout.mjs [--port 5241] [--session free-jr]
//        [--widths 375,768,1280] [--themes light,dark]
//        [--sets example,short,long,hidden,unbroken] [--no-actions]
//
// Results go to checks/results/layout.json; exit code 1 when anything fails.
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { buildSets } from "./content-sets.mjs";
import { measure } from "./measure.mjs";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback;
};
const list = (name, fallback) => option(name, fallback).split(",").filter(Boolean);
const port = option("port", process.env.PORT ?? "5241");
const session = option("session", process.env.AGENT_BROWSER_SESSION ?? "free-jr");
const widths = list("widths", "375,768,1280").map(Number);
const themes = list("themes", "light,dark");
const setNames = list("sets", "example,short,long,hidden,unbroken");

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
const sets = buildSets(examples, guidance);

function browser(cmd, input) {
  const out = execFileSync("agent-browser", ["--session", session, "--json", ...cmd], {
    input,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  });
  const parsed = JSON.parse(out.trim().split("\n").at(-1));
  if (!parsed.success)
    throw new Error(`agent-browser ${cmd[0]} failed: ${JSON.stringify(parsed.error)}`);
  return parsed.data;
}
const evaluate = (fn, input) =>
  browser(
    ["eval", "--stdin"],
    `(${fn.toString()})(${input === undefined ? "" : JSON.stringify(input)})`
  ).result;

const failures = [];
const report = { layout: [], actions: [] };
browser(["open", `http://127.0.0.1:${port}/?doc=pages/product-landing`]);
browser(["wait", "--fn", "typeof window.__render === 'function'"]);

for (const width of widths) {
  browser(["set", "viewport", String(width), "900"]);
  for (const theme of themes)
    for (const set of setNames) {
      const results = JSON.parse(
        evaluate(measure, { spec: sets[set], set, width, theme })
      );
      for (const r of results) {
        report.layout.push({ width, theme, set, ...r });
        for (const p of r.problems)
          failures.push(`${r.item} ${width}px ${theme} ${set}: ${p}`);
      }
    }
}

if (!args.includes("--no-actions")) {
  browser(["set", "viewport", "1280", "900"]);
  const actions = await import("./actions.mjs");
  const results = JSON.parse(evaluate(actions.exercise, { spec: sets.example }));
  report.actions = results;
  for (const r of results) if (!r.ok) failures.push(`action ${r.name}: ${r.detail}`);
  browser(["hover", '[aria-label="More information"]']);
  const tip = JSON.parse(evaluate(actions.tooltip));
  report.actions.push(tip);
  if (!tip.ok) failures.push(`action ${tip.name}: ${tip.detail}`);
  browser(["set", "viewport", "375", "800"]);
  const mobile = JSON.parse(evaluate(actions.mobileMenu));
  report.actions.push(mobile);
  if (!mobile.ok) failures.push(`action ${mobile.name}: ${mobile.detail}`);
}

const out = fileURLToPath(new URL("results/", import.meta.url));
mkdirSync(out, { recursive: true });
writeFileSync(`${out}layout.json`, JSON.stringify(report, null, 2));
const cases = report.layout.length;
console.log(
  `${cases} block cases (${widths.length} widths × ${themes.length} themes × ${setNames.length} sets), ${report.actions.length} action checks`
);
if (failures.length) {
  const unique = [...new Set(failures)];
  console.log(`${unique.length} failures:\n` + unique.slice(0, 80).join("\n"));
  process.exit(1);
}
console.log("All checks passed.");
