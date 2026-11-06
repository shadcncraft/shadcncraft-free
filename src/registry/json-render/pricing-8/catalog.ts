import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

import { headingFields, text } from "../shared/schema";

export const propsSchema = z.strictObject({
  ...headingFields,
  plans: z
    .array(
      z.strictObject({
        name: text,
        description: text.optional(),
        price: text,
        period: z.string().optional(),
        features: z
          .array(z.strictObject({ label: text, tooltip: text.optional() }))
          .max(10)
          .optional(),
        featured: z.boolean().optional(),
        ctaLabel: text.optional(),
      })
    )
    .min(1)
    .max(4)
    .optional(),
  selectedPlan: z.string().optional(),
});

export const componentDefinitions = {
  Pricing8: {
    props: propsSchema,
    slots: [],
    events: ["select"],
    description:
      "Section heading over pricing plan cards with price, period, feature checklist and a button per plan.",
  },
};

export const catalog = defineCatalog(schema, {
  components: componentDefinitions,
  actions: {},
});
