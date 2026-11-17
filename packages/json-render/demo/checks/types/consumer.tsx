// Strict consumer of the installed package's declarations.
import { defineRegistry, JSONUIProvider, Renderer } from "@json-render/react";
import { components } from "@shadcncraft/json-render";
import { components as ctaComponents } from "@shadcncraft/json-render/cta-9";
import {
  catalog as ctaCatalog,
  propsSchema,
} from "@shadcncraft/json-render/cta-9/catalog";
import { CTA9, type CTA9Props } from "@shadcncraft/json-render/cta-9/react";
import {
  catalog,
  componentDefinitions,
  guidance,
} from "@shadcncraft/json-render/catalog";
import { Stack, stackGaps } from "@shadcncraft/json-render/layout";
import { Pricing8, type Pricing8Plan } from "@shadcncraft/json-render/pricing-8/react";
import {
  formatIssues,
  validateSpec,
  type ValidationResult,
} from "@shadcncraft/json-render/validate";

const { registry } = defineRegistry(catalog, { components });
const cta = defineRegistry(ctaCatalog, { components: ctaComponents });
const parsed = propsSchema.parse({ heading: "Hi" });
const heading: string | undefined = parsed.heading;
const props: CTA9Props = { heading: "Start", onPrimaryAction: () => {} };
const plan: Pricing8Plan = { name: "Team", price: "$8", featured: true };
const summary: string = guidance.components.CTA9.summary;
const events: readonly string[] | undefined = componentDefinitions.Pricing8.events;
const result: ValidationResult = validateSpec({ root: "a", elements: {} });
const text: string = formatIssues(result.errors);
const gaps: readonly string[] = stackGaps;

export function App() {
  return (
    <JSONUIProvider registry={registry} handlers={{}}>
      <Stack gap="md">
        <CTA9 {...props} />
        <Pricing8 plans={[plan]} onPlanAction={(p) => console.log(p.name)} />
      </Stack>
      <Renderer spec={null} registry={cta.registry} />
    </JSONUIProvider>
  );
}
void [heading, summary, events, text, gaps];
