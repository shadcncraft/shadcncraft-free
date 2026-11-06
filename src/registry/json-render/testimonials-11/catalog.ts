import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

import { headingFields, imageSrc, text } from "../shared/schema";

export const propsSchema = z.strictObject({
  ...headingFields,
  testimonials: z
    .array(
      z.strictObject({
        quote: text,
        name: text,
        role: text.optional(),
        imageSrc: imageSrc.optional(),
      })
    )
    .min(1)
    .max(9)
    .optional(),
});

export const componentDefinitions = {
  Testimonials11: {
    props: propsSchema,
    slots: [],
    description:
      "Section heading over a grid of quote cards, each with the person's avatar, name and role.",
  },
};

export const catalog = defineCatalog(schema, {
  components: componentDefinitions,
  actions: {},
});
