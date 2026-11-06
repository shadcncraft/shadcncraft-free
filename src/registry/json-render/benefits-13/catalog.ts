import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

import { anchor, headingFields, text } from "../shared/schema";

/** Icon keys of benefits13Icons in the block. Catalogs stay free of React imports. */
export const benefitIcons = [
  "prioritize",
  "integrate",
  "data",
  "analytics",
  "workflow",
  "team",
  "speed",
  "security",
  "privacy",
  "time",
  "launch",
  "ai",
] as const;

export const propsSchema = z.strictObject({
  anchor: anchor.optional(),
  ...headingFields,
  benefits: z
    .array(
      z.strictObject({
        title: text,
        description: text.optional(),
        icon: z.enum(benefitIcons).optional(),
      })
    )
    .min(1)
    .max(9)
    .optional(),
});

export const componentDefinitions = {
  Benefits13: {
    props: propsSchema,
    slots: [],
    description:
      "Section heading over a grid of benefit cards, each with an icon, title and description.",
  },
};

export const catalog = defineCatalog(schema, {
  components: componentDefinitions,
  actions: {},
});
