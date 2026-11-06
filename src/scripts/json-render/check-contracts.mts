/**
 * Source-level contract checks: every free block has a catalog, adapter and
 * example; examples validate and render their own content; catalog icon keys
 * match the block's icon map.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { defineRegistry, JSONUIProvider, Renderer } from "@json-render/react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { TooltipProvider } from "@/components/ui/tooltip";
import { benefitIcons } from "@/registry/json-render/benefits-13/catalog";
import { benefits13Icons } from "@/registry/pro-marketing/blocks/benefits/13";

const root = path.join(process.cwd(), "src/registry/json-render");
const contracts = JSON.parse(
  readFileSync(path.join(root, "contracts.json"), "utf8")
) as Record<string, { component: string; events: string[] }>;
const failures: string[] = [];
const check = (ok: unknown, message: string) => ok || failures.push(message);

check(
  JSON.stringify([...benefitIcons]) === JSON.stringify(Object.keys(benefits13Icons)),
  "Benefits13 catalog icon keys differ from the block's icon map"
);

// Accordion answers and tooltips only render once opened.
const hiddenUntilOpened = new Set(["answer", "tooltip"]);
const strings = (value: unknown): string[] =>
  typeof value === "string"
    ? [value]
    : Array.isArray(value)
      ? value.flatMap(strings)
      : value &&
          typeof value === "object" &&
          !Object.keys(value).some((k) => k.startsWith("$"))
        ? Object.entries(value)
            .filter(([key]) => !hiddenUntilOpened.has(key))
            .flatMap(([, v]) => strings(v))
        : [];
const escape = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

for (const [item, contract] of Object.entries(contracts)) {
  const catalogModule = await import(`@/registry/json-render/${item}/catalog`);
  const adapterModule = await import(`@/registry/json-render/${item}/components`);
  const definition = catalogModule.componentDefinitions[contract.component];
  check(definition, `${item}: catalog has no ${contract.component}`);
  check(
    JSON.stringify(definition?.events ?? []) === JSON.stringify(contract.events),
    `${item}: catalog events differ from contracts.json`
  );
  const spec = JSON.parse(readFileSync(path.join(root, item, "example.json"), "utf8"));
  const element = spec.elements[spec.root];
  const props = Object.fromEntries(
    Object.entries(element.props).filter(
      ([, v]) => !(v && typeof v === "object" && "$bindState" in v)
    )
  );
  const parsed = catalogModule.propsSchema.safeParse(props);
  check(parsed.success, `${item}: example props invalid: ${parsed.error?.message}`);
  const { registry } = defineRegistry(catalogModule.catalog, {
    components: adapterModule.components,
  });
  const handlers = Object.fromEntries(
    Object.values(element.on ?? {}).map((binding) => [
      (binding as { action: string }).action,
      async () => {},
    ])
  );
  const html = renderToStaticMarkup(
    createElement(
      TooltipProvider,
      null,
      createElement(
        JSONUIProvider,
        { registry, initialState: spec.state ?? {}, handlers },
        createElement(Renderer, { spec, registry })
      )
    )
  );
  check(!html.includes('role="alert"'), `${item}: example rendered an error alert`);
  for (const text of strings(props).filter(
    (s) => !/^(https?:|\/|#|mailto:|tel:)/.test(s)
  )) {
    if (["linkedin", "x"].includes(text) || benefitIcons.includes(text as never))
      continue;
    check(
      html.includes(escape(text)),
      `${item}: example text missing from render: ${text}`
    );
  }
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`Contracts OK for ${Object.keys(contracts).length} blocks.`);
