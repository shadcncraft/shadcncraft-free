#!/usr/bin/env node
import { readFileSync } from "node:fs";

import { z } from "zod";

import { definitions, eventsFor, formatIssues, guidance as packageGuidance, samples, validateSpec } from "../validate.js";

const usage = `Usage:
  shadcncraft-json-render check <file.json|-> [...] [--actions a,b] [--guidance file] [--no-guidance] [--info] [--json]
  shadcncraft-json-render catalog [Component] [--json]

check    Validate JSON Render documents. Exit 1 when any document has errors.
         --actions   host action names; bindings to others become errors
         --info      also print info-level notes (ideal lengths, dynamic props)
catalog  List components, or print one component's props, events and guidance.`;

function parseArgs(argv) {
  const flags = { json: false, info: false, guidance: undefined, actions: undefined };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = () => {
      if (arg.includes("=")) return arg.slice(arg.indexOf("=") + 1);
      if (i + 1 >= argv.length) fail(`${arg} needs a value.`);
      return argv[++i];
    };
    if (arg === "--json") flags.json = true;
    else if (arg === "--info") flags.info = true;
    else if (arg === "--no-guidance") flags.guidance = false;
    else if (arg === "--guidance" || arg.startsWith("--guidance=")) flags.guidance = value();
    else if (arg === "--actions" || arg.startsWith("--actions=")) flags.actions = value().split(",").map((s) => s.trim()).filter(Boolean);
    else if (arg === "-h" || arg === "--help") {
      console.log(usage);
      process.exit(0);
    } else if (arg.startsWith("--")) fail(`Unknown option ${arg}.`);
    else positional.push(arg);
  }
  return { flags, positional };
}

function fail(message) {
  console.error(`${message}\n\n${usage}`);
  process.exit(2);
}

function readJSON(file) {
  const text = file === "-" ? readFileSync(0, "utf8") : readFileSync(file, "utf8");
  return JSON.parse(text);
}

function loadGuidance(flag) {
  if (flag === false) return false;
  if (typeof flag === "string") {
    try {
      return readJSON(flag);
    } catch (error) {
      fail(`Cannot read guidance ${flag}: ${error.message}`);
    }
  }
  return packageGuidance;
}

function check(files, flags) {
  if (!files.length) fail("check needs at least one file (use - for stdin).");
  const guidance = loadGuidance(flags.guidance);
  const reports = [];
  for (const file of files) {
    let spec;
    try {
      spec = readJSON(file);
    } catch (error) {
      const code = error instanceof SyntaxError ? "invalid_json" : "unreadable_file";
      const issue = { severity: "error", code, elementId: null, path: "", message: error.message, hint: code === "invalid_json" ? "Fix the JSON syntax first." : "" };
      reports.push({ file, ok: false, errors: [issue], warnings: [], info: [] });
      continue;
    }
    reports.push({ file, ...validateSpec(spec, { actions: flags.actions, guidance }) });
  }
  if (flags.json) {
    console.log(JSON.stringify(files.length === 1 ? reports[0] : reports, null, 2));
  } else {
    for (const report of reports) {
      const counts = [`${report.errors.length} error${report.errors.length === 1 ? "" : "s"}`, `${report.warnings.length} warning${report.warnings.length === 1 ? "" : "s"}`];
      if (flags.info) counts.push(`${report.info.length} info`);
      console.log(`${report.ok ? "ok  " : "FAIL"} ${report.file}: ${counts.join(", ")}`);
      const body = formatIssues(report, { info: flags.info });
      if (body) console.log(body.replace(/^/gm, "  "));
      if (!flags.info && report.info.length) console.log(`  ${report.info.length} note${report.info.length === 1 ? "" : "s"} (e.g. copy outside the ideal length) hidden; add --info to see ${report.info.length === 1 ? "it" : "them"}.`);
    }
  }
  process.exit(reports.every((report) => report.ok) ? 0 : 1);
}

function firstSentence(text = "") {
  const match = text.match(/^.*?[.!?](\s|$)/);
  return (match ? match[0] : text).trim();
}

function propType(schema) {
  if (!schema) return "any";
  if (schema.anyOf) return [...new Set(schema.anyOf.map(propType))].join(" | ");
  if (schema.enum) return schema.enum.map((v) => JSON.stringify(v)).join(" | ");
  if (schema.type === "array") return `${propType(schema.items)}[]${schema.maxItems != null ? ` (max ${schema.maxItems})` : ""}`;
  if (schema.type === "number" || schema.type === "integer") return schema.minimum != null && schema.maximum != null ? `number ${schema.minimum}–${schema.maximum}` : "number";
  if (schema.type === "string" && schema.format === "uri") return "URL";
  if (schema.type === "string" && schema.pattern?.startsWith("^\\/")) return "/root-path";
  if (schema.type === "string") return schema.minLength ? "text" : "string";
  if (schema.type === "object" && schema.properties) {
    const required = new Set(schema.required ?? []);
    const fields = Object.entries(schema.properties).map(([key, value]) => `${key}${required.has(key) ? "" : "?"}: ${propType(value)}`);
    return `{ ${fields.join(", ")} }`;
  }
  return schema.type ?? "any";
}

function describe(name, guidance) {
  const definition = definitions[name];
  const json = z.toJSONSchema(definition.props, { io: "input", unrepresentable: "any" });
  const required = new Set(json.required ?? []);
  const notes = guidance?.components?.[name] ?? null;
  const limits = notes?.content ?? {};
  const props = Object.entries(json.properties ?? {}).map(([prop, schema]) => {
    const rule = limits[prop] ?? {};
    const parts = [];
    if (rule.idealChars) parts.push(`ideal ${rule.idealChars[0]}–${rule.idealChars[1]} chars`);
    if (rule.maxChars) parts.push(`max ${rule.maxChars} chars`);
    if (rule.idealItems) parts.push(`ideal ${rule.idealItems[0]}–${rule.idealItems[1]} items`);
    if (rule.maxItems) parts.push(`max ${rule.maxItems} items`);
    if (rule.itemMaxChars) parts.push(`item max ${rule.itemMaxChars} chars`);
    if (rule.fields) parts.push(Object.entries(rule.fields).map(([field, limit]) => `${field} max ${limit.maxChars}`).join(", ") + " chars");
    const sample = samples?.components?.[name]?.[prop];
    return { name: prop, type: propType(schema), required: required.has(prop), limits: parts.join(", "), description: schema.description ?? "", sample };
  });
  return { name, description: definition.description, slots: definition.slots, events: eventsFor(name, definition), props, guidance: notes };
}

function catalog(names, flags) {
  const guidance = loadGuidance(flags.guidance);
  const all = Object.keys(definitions);
  if (!names.length) {
    const rows = all.map((name) => ({
      name,
      children: definitions[name].slots.length ? "children" : "leaf",
      events: eventsFor(name).join(",") || "-",
      summary: guidance?.components?.[name]?.summary ?? firstSentence(definitions[name].description),
    }));
    if (flags.json) return console.log(JSON.stringify(rows, null, 2));
    const width = Math.max(...all.map((n) => n.length));
    for (const row of rows) console.log(`${row.name.padEnd(width)}  ${row.children.padEnd(8)}  events ${row.events.padEnd(17)}  ${row.summary}`);
    console.log(`\nDetails: shadcncraft-json-render catalog <Component>`);
    return;
  }
  const output = [];
  for (const name of names) {
    if (!Object.hasOwn(definitions, name)) {
      const lower = name.toLowerCase();
      const guess = all.find((n) => n.toLowerCase() === lower);
      console.error(`Unknown component "${name}".${guess ? ` Did you mean "${guess}"?` : ""} Available: ${all.join(", ")}.`);
      process.exit(1);
    }
    output.push(describe(name, guidance));
  }
  if (flags.json) return console.log(JSON.stringify(output.length === 1 ? output[0] : output, null, 2));
  for (const info of output) {
    const lines = [`${info.name}  ${info.slots.length ? `slots: ${info.slots.join(", ")}` : "leaf (children: [])"}  events: ${info.events.join(", ") || "none"}`, info.description];
    lines.push("props:" + (info.props.some((p) => p.sample !== undefined) ? " (omitted props render the sample shown; set every one you can see)" : ""));
    const width = Math.max(4, ...info.props.map((p) => p.name.length));
    for (const prop of info.props) {
      lines.push(`  ${prop.name.padEnd(width)}  ${prop.type}${prop.required ? " (required)" : ""}${prop.limits ? `  — ${prop.limits}` : ""}`);
      if (prop.description) lines.push(`  ${" ".repeat(width)}  ${prop.description}`);
      if (prop.sample !== undefined) lines.push(`  ${" ".repeat(width)}  sample if omitted: ${JSON.stringify(prop.sample).slice(0, 90)}`);
    }
    const g = info.guidance;
    if (g) {
      const traits = ["layout", "surface", "media"].filter((k) => g[k]).map((k) => `${k} ${g[k]}`);
      if (g.summary) lines.push(`guidance: ${g.summary}`);
      if (traits.length) lines.push(`  ${traits.join(" · ")}`);
      for (const [key, label] of [["bestFor", "best for"], ["avoidWhen", "avoid when"], ["pairsWith", "pairs with"]]) {
        if (Array.isArray(g[key]) && g[key].length) lines.push(`  ${label}: ${g[key].join("; ")}`);
      }
      if (Array.isArray(g.notes)) for (const note of g.notes) lines.push(`  note: ${note}`);
    }
    console.log(lines.join("\n") + "\n");
  }
}

const [command, ...rest] = process.argv.slice(2);
const { flags, positional } = parseArgs(rest);
if (command === "check") check(positional, flags);
else if (command === "catalog") catalog(positional, flags);
else if (!command || command === "help" || command === "-h" || command === "--help") console.log(usage);
else fail(`Unknown command "${command}".`);
