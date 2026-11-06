import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

import { headingFields, imageSrc, text } from "../shared/schema";

export const propsSchema = z.strictObject({
  ...headingFields,
  members: z
    .array(
      z.strictObject({
        name: text,
        title: text.optional(),
        imageSrc: imageSrc.optional(),
      })
    )
    .min(1)
    .max(12)
    .optional(),
});

export const componentDefinitions = {
  Team6: {
    props: propsSchema,
    slots: [],
    description:
      "Section heading over a grid of team member cards with a portrait, name and title.",
  },
};

export const catalog = defineCatalog(schema, {
  components: componentDefinitions,
  actions: {},
});
