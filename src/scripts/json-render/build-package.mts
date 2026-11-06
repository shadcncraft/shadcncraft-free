/**
 * Builds packages/json-render from the free registry source.
 *
 * Each block's catalog, adapter and native component are staged with their
 * import closure, Tailwind classes are prefixed with `scraft:` so they never
 * collide with the host's utilities, and modules are compiled one-to-one so
 * separately imported blocks share the same React contexts.
 *
 * Usage: pnpm json-render:build
 */
import { existsSync } from "node:fs";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import tailwindcss from "@tailwindcss/postcss";
import { transform as compile } from "esbuild";
import postcss from "postcss";
import ts from "typescript";
import { z } from "zod";

import {
  namespacePackageClasses,
  PACKAGE_PREFIX,
} from "@/lib/json-render/namespace-classes";

const root = process.cwd();
const sourceRoot = path.join(root, "src");
const contractRoot = path.join(sourceRoot, "registry/json-render");
const packageRoot = path.join(root, "packages/json-render");
const generated = ["modules", "types", "styles", "data", "examples"];

type Contract = { component: string; export: string; block: string; events: string[] };
const contracts: Record<string, Contract> = JSON.parse(
  await readFile(path.join(contractRoot, "contracts.json"), "utf8")
);
const rootManifest = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const versions: Record<string, string> = {
  ...rootManifest.devDependencies,
  ...rootManifest.dependencies,
};
/** Supplied by the host application. Everything else is a package dependency. */
const peers = ["react", "react-dom", "@json-render/core", "@json-render/react", "zod"];
const schemaPackages = ["zod", "@json-render/core", "@json-render/react/schema"];

type Module = {
  destination: string;
  source: string;
  packages: Set<string>;
  schema: boolean;
};
const modules = new Map<string, Module>();
const stageRoot = await mkdtemp(path.join(root, "node_modules/.json-render-stage-"));

function resolveSource(filename: string) {
  const found = [
    filename,
    `${filename}.ts`,
    `${filename}.tsx`,
    `${filename}/index.ts`,
    `${filename}/index.tsx`,
  ].find((candidate) => existsSync(candidate) && /\.(tsx?|json)$/.test(candidate));
  if (!found) throw new Error(`Unresolved package source: ${filename}`);
  return found;
}

const utilsSource = `import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({ prefix: "${PACKAGE_PREFIX}" });

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;

async function stage(file: string, schema: boolean): Promise<string> {
  const filename = resolveSource(file);
  const relative = path.relative(sourceRoot, filename);
  const allowed =
    relative.startsWith("registry/pro-marketing/") ||
    relative.startsWith("registry/json-render/") ||
    relative.startsWith("components/ui/") ||
    relative === "lib/utils.ts";
  if (!allowed || relative.includes(".."))
    throw new Error(`Source outside the package boundary: ${relative}`);
  if (modules.has(relative)) return relative;
  const record: Module = {
    destination: relative,
    source: "",
    packages: new Set(),
    schema,
  };
  modules.set(relative, record);
  let source =
    relative === "lib/utils.ts" ? utilsSource : await readFile(filename, "utf8");
  if (schema && filename.endsWith(".tsx"))
    throw new Error(`Catalog imports JSX: ${relative}`);
  if (!schema && relative !== "lib/utils.ts")
    source = namespacePackageClasses(source, relative);

  const ast = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
  const specifiers: ts.StringLiteral[] = [];
  ast.forEachChild(function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    )
      specifiers.push(node.moduleSpecifier);
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword)
      throw new Error(`Dynamic import in package source: ${relative}`);
    ts.forEachChild(node, visit);
  });
  const edits: { start: number; end: number; value: string }[] = [];
  for (const specifier of specifiers) {
    const name = specifier.text;
    if (!name.startsWith("@/") && !name.startsWith(".")) {
      const packageName = name.startsWith("@")
        ? name.split("/").slice(0, 2).join("/")
        : name.split("/")[0];
      if (!versions[packageName])
        throw new Error(`Undeclared dependency ${name} in ${relative}`);
      if (schema && !schemaPackages.includes(name))
        throw new Error(`Catalog module ${relative} imports runtime package ${name}`);
      record.packages.add(packageName);
      continue;
    }
    const target = name.startsWith("@/")
      ? path.join(sourceRoot, name.slice(2))
      : path.resolve(path.dirname(filename), name);
    const staged = await stage(target, schema);
    let rewritten = path
      .relative(path.dirname(relative), staged)
      .replace(/\.tsx?$/, ".js");
    if (!rewritten.startsWith(".")) rewritten = `./${rewritten}`;
    edits.push({
      start: specifier.getStart(ast) + 1,
      end: specifier.getEnd() - 1,
      value: rewritten,
    });
  }
  for (const edit of edits.sort((a, b) => b.start - a.start))
    source = source.slice(0, edit.start) + edit.value + source.slice(edit.end);
  record.source = source;
  return relative;
}

/** Literal default values of a block's props: what renders when a prop is omitted. */
function extractSamples(filename: string, source: string, exportName: string) {
  const ast = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
  const constants = new Map<string, ts.Expression>();
  let parameter: ts.ParameterDeclaration | undefined;
  for (const statement of ast.statements) {
    if (ts.isVariableStatement(statement))
      for (const declaration of statement.declarationList.declarations)
        if (ts.isIdentifier(declaration.name) && declaration.initializer)
          constants.set(declaration.name.text, declaration.initializer);
    if (ts.isFunctionDeclaration(statement) && statement.name?.text === exportName)
      parameter = statement.parameters[0];
  }
  function evaluate(node: ts.Expression): unknown {
    if (ts.isStringLiteralLike(node)) return node.text;
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (
      ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isParenthesizedExpression(node)
    )
      return evaluate(node.expression);
    if (ts.isIdentifier(node) && constants.has(node.text))
      return evaluate(constants.get(node.text)!);
    if (ts.isArrayLiteralExpression(node)) return node.elements.map(evaluate);
    if (ts.isObjectLiteralExpression(node))
      return Object.fromEntries(
        node.properties.map((property) => {
          if (!ts.isPropertyAssignment(property))
            throw new Error(`Unsupported sample in ${filename}`);
          return [
            property.name.getText(ast).replace(/["']/g, ""),
            evaluate(property.initializer),
          ];
        })
      );
    throw new Error(`Non-literal default in ${filename}: ${node.getText(ast)}`);
  }
  if (!parameter || !ts.isObjectBindingPattern(parameter.name))
    throw new Error(`${exportName} in ${filename} has no destructured props`);
  // Content only: behaviour flags and neutral defaults are not "sample content".
  const neutral = new Set(["homeHref", "logoAlt"]);
  return Object.fromEntries(
    parameter.name.elements
      .filter((element) => element.initializer && !neutral.has(element.name.getText(ast)))
      .map(
        (element) => [element.name.getText(ast), evaluate(element.initializer!)] as const
      )
      .filter(([, value]) => typeof value !== "boolean")
  );
}

function themeCss(globals: string) {
  const block = (selector: string) => {
    const match = globals.match(
      new RegExp(`^${selector.replace(".", "\\.")} \\{([^}]*)\\}`, "m")
    );
    if (!match) throw new Error(`globals.css has no ${selector} block`);
    return match[1].trim().replace(/\n\s*/g, "\n    ");
  };
  return `/* Optional shadcncraft Free theme. Skip it if your app already defines shadcn theme variables. */
@layer base {
  :root {
    ${block(":root")}
    --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }
  .dark {
    ${block(".dark")}
  }
}
`;
}

async function compileStyles(sources: string[], globals: string) {
  const colors = [...globals.matchAll(/--color-([\w-]+): var\(--([\w-]+)\);/g)].map(
    ([, name, variable]) => `--color-${name}: var(--${variable});`
  );
  const radii = [
    ...globals.matchAll(/--radius-(\w+): (calc\([^;]+\)|var\(--radius\));/g),
  ].map(([, size, value]) => `--radius-${size}: ${value};`);
  const css = `@layer theme, base, components, utilities;
@import "tailwindcss/theme.css" layer(theme) prefix(${PACKAGE_PREFIX});
@import "tailwindcss/utilities.css" layer(utilities) prefix(${PACKAGE_PREFIX}) source(none);
@import "tw-animate-css";
${sources.map((source) => `@source ${JSON.stringify(`./${source}`)};`).join("\n")}
@custom-variant dark (&:is(.dark *));
@layer theme { :root, :host {
${radii.map((rule) => rule.replace("--radius-", `--${PACKAGE_PREFIX}-radius-`)).join("\n")}
} }
@theme inline {
${colors.join("\n")}
${radii.join("\n")}
}
`;
  const result = await postcss([
    tailwindcss({ base: stageRoot, optimize: true }),
  ]).process(css, {
    from: path.join(stageRoot, "styles.css"),
  });
  return result.css;
}

try {
  for (const directory of generated)
    await rm(path.join(packageRoot, directory), { recursive: true, force: true });

  const entries: Record<string, { file: string; source: string }> = {};
  const exportsMap: Record<string, unknown> = {};
  const samples: Record<string, Record<string, unknown>> = {};
  const addEntry = (name: string, source: string) => {
    const file = `entries/${name}.ts`;
    entries[name] = { file, source };
    exportsMap[`./${name}`] = {
      types: `./types/${file.replace(/\.ts$/, ".d.ts")}`,
      import: `./modules/${file.replace(/\.ts$/, ".js")}`,
    };
  };
  const fromEntry = (entry: string, target: string) => {
    let specifier = path
      .relative(path.dirname(`entries/${entry}.ts`), target)
      .replace(/\.tsx?$/, ".js");
    if (!specifier.startsWith(".")) specifier = `./${specifier}`;
    return JSON.stringify(specifier);
  };

  for (const [item, contract] of Object.entries(contracts)) {
    const catalog = await stage(path.join(contractRoot, item, "catalog.ts"), true);
    const adapter = await stage(path.join(contractRoot, item, "components.tsx"), false);
    const block = await stage(path.join(sourceRoot, contract.block), false);
    const blockFile = resolveSource(path.join(sourceRoot, contract.block));
    samples[contract.component] = extractSamples(
      block,
      await readFile(blockFile, "utf8"),
      contract.export
    );
    addEntry(
      `${item}/catalog`,
      `export * from ${fromEntry(`${item}/catalog`, catalog)};\n`
    );
    addEntry(
      item,
      `"use client";\nexport { components } from ${fromEntry(item, adapter)};\n`
    );
    addEntry(
      `${item}/react`,
      `"use client";\nexport * from ${fromEntry(`${item}/react`, block)};\n`
    );
    exportsMap[`./${item}/example.json`] = `./examples/${item}.json`;
  }

  // Compile staged modules one-to-one.
  for (const record of modules.values()) {
    const staged = path.join(stageRoot, record.destination);
    await mkdir(path.dirname(staged), { recursive: true });
    await writeFile(staged, record.source);
    const output = path.join(
      packageRoot,
      "modules",
      record.destination.replace(/\.tsx?$/, ".js")
    );
    await mkdir(path.dirname(output), { recursive: true });
    const { code } = await compile(record.source, {
      loader: record.destination.endsWith(".tsx") ? "tsx" : "ts",
      format: "esm",
      target: "es2022",
      jsx: "automatic",
    });
    await writeFile(output, code);
  }
  for (const [name, entry] of Object.entries(entries)) {
    const staged = path.join(stageRoot, entry.file);
    await mkdir(path.dirname(staged), { recursive: true });
    await writeFile(staged, entry.source);
    const output = path.join(packageRoot, "modules", entry.file.replace(/\.ts$/, ".js"));
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, entry.source);
    void name;
  }

  // Declarations, type-checked against the staged sources.
  const program = ts.createProgram(
    Object.values(entries).map((entry) => path.join(stageRoot, entry.file)),
    {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.ReactJSX,
      strict: true,
      skipLibCheck: true,
      esModuleInterop: true,
      declaration: true,
      emitDeclarationOnly: true,
      rootDir: stageRoot,
      outDir: path.join(packageRoot, "types"),
      typeRoots: [path.join(root, "node_modules/@types")],
    }
  );
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length)
    throw new Error(
      ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCanonicalFileName: (file) => file,
        getCurrentDirectory: () => root,
        getNewLine: () => "\n",
      })
    );
  if (program.emit().emitSkipped) throw new Error("Declarations were not emitted.");

  // Styles: prefixed utilities for every runtime module, plus an optional theme.
  const globals = await readFile(path.join(sourceRoot, "styles/globals.css"), "utf8");
  await mkdir(path.join(packageRoot, "styles"), { recursive: true });
  const runtime = [...modules.values()]
    .filter((m) => !m.schema)
    .map((m) => m.destination);
  const css = await compileStyles(runtime, globals);
  if (/(^|[^-\w])\.(flex|grid|hidden)\s*\{/.test(css))
    throw new Error("Unprefixed utility classes in package CSS");
  await writeFile(path.join(packageRoot, "styles/blocks.css"), css);
  await writeFile(path.join(packageRoot, "styles/theme.css"), themeCss(globals));

  // Data mirrors (JS modules, never JSON imports: Vite's dev optimiser mis-bundles those).
  const guidance = JSON.parse(
    await readFile(path.join(contractRoot, "guidance.json"), "utf8")
  );
  await mkdir(path.join(packageRoot, "data"), { recursive: true });
  await writeFile(
    path.join(packageRoot, "data/guidance.js"),
    `export default ${JSON.stringify(guidance, null, 2)};\n`
  );
  const sampleData = { version: 1, components: samples };
  await writeFile(
    path.join(packageRoot, "data/samples.js"),
    `export default ${JSON.stringify(sampleData, null, 2)};\n`
  );
  await writeFile(
    path.join(packageRoot, "guidance.json"),
    JSON.stringify(guidance, null, 2) + "\n"
  );
  await writeFile(
    path.join(packageRoot, "samples.json"),
    JSON.stringify(sampleData, null, 2) + "\n"
  );

  // Combined entry points: every block plus the Stack layout node.
  const items = Object.entries(contracts);
  await writeFile(
    path.join(packageRoot, "modules/catalog.js"),
    `${items.map(([item], i) => `import { componentDefinitions as d${i} } from "./entries/${item}/catalog.js";`).join("\n")}
import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import guidanceData from "../data/guidance.js";
import { describe } from "../describe.js";
import { layoutDefinitions } from "../layout-catalog.js";

/** Composition and content guidance for every block (guidance.json). */
export const guidance = guidanceData;
const blockDefinitions = { ${items.map((_, i) => `...d${i}`).join(", ")} };
/** Every block, with agent-facing descriptions built from guidance.json, plus Stack. */
export const componentDefinitions = {
  ...Object.fromEntries(
    Object.entries(blockDefinitions).map(([name, def]) => [name, { ...def, description: describe(name, def, guidance) }])
  ),
  ...layoutDefinitions,
};
export const catalog = defineCatalog(schema, { components: componentDefinitions, actions: {} });
`
  );
  await writeFile(
    path.join(packageRoot, "modules/components.js"),
    `"use client";
${items.map(([item], i) => `import { components as c${i} } from "./entries/${item}.js";`).join("\n")}
import { layoutComponents } from "../layout.js";

/** Renderers for every block plus Stack. Pass to defineRegistry with the catalog. */
export const components = { ${items.map((_, i) => `...c${i}`).join(", ")}, ...layoutComponents };
`
  );
  const definitionTypes = items
    .map(([item]) => `typeof import("./entries/${item}/catalog.js").componentDefinitions`)
    .join(" &\n  ");
  await writeFile(
    path.join(packageRoot, "types/catalog.d.ts"),
    `import type { Catalog } from "@json-render/core";
import type { Guidance } from "../guidance.js";
export declare const guidance: Guidance;
export declare const componentDefinitions: ${definitionTypes} &
  typeof import("../layout-catalog.js").layoutDefinitions;
export declare const catalog: Catalog;
`
  );
  await writeFile(
    path.join(packageRoot, "types/components.d.ts"),
    `import type { ComponentRenderer } from "@json-render/react";
export declare const components: Record<${items.map(([, c]) => JSON.stringify(c.component)).join(" | ")} | "Stack", ComponentRenderer>;
`
  );

  // Examples and a JSON Schema view of every block's props.
  await mkdir(path.join(packageRoot, "examples"), { recursive: true });
  const schema: Record<string, unknown> = {};
  for (const [item, contract] of Object.entries(contracts)) {
    await copyFile(
      path.join(contractRoot, item, "example.json"),
      path.join(packageRoot, "examples", `${item}.json`)
    );
    const catalogModule = await import(path.join(contractRoot, item, "catalog.ts"));
    schema[contract.component] = {
      item,
      events: contract.events,
      props: z.toJSONSchema(catalogModule.propsSchema),
    };
  }
  await writeFile(
    path.join(packageRoot, "schema.json"),
    JSON.stringify(schema, null, 2) + "\n"
  );

  // Manifest: hand-written base plus generated block exports and dependencies.
  const base = JSON.parse(
    await readFile(path.join(packageRoot, "package.base.json"), "utf8")
  );
  const runtimePackages = new Set<string>();
  for (const record of modules.values())
    record.packages.forEach((name) => runtimePackages.add(name));
  const dependencies = Object.fromEntries(
    [...runtimePackages]
      .filter((name) => !peers.includes(name))
      .sort()
      .map((name) => [name, versions[name]])
  );
  for (const name of Object.keys(base.dependencies ?? {}))
    dependencies[name] = base.dependencies[name];
  await writeFile(
    path.join(packageRoot, "package.json"),
    JSON.stringify(
      { ...base, exports: { ...base.exports, ...exportsMap }, dependencies },
      null,
      2
    ) + "\n"
  );
  console.log(
    JSON.stringify(
      {
        blocks: Object.keys(contracts).length,
        modules: modules.size,
        entries: Object.keys(entries).length,
        dependencies: Object.keys(dependencies),
      },
      null,
      2
    )
  );
} finally {
  await rm(stageRoot, { recursive: true, force: true });
}
