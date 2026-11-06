import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

import { anchor, optionalLine, text } from "../shared/schema";

export const propsSchema = z.strictObject({
  anchor: anchor.optional(),
  heading: text.optional(),
  description: optionalLine.optional(),
  primaryLabel: text.optional(),
});

export const componentDefinitions = {
  CTA9: {
    props: propsSchema,
    slots: [],
    events: ["primary"],
    description:
      "Full-width call to action on the primary colour with a heading, optional description and one button.",
  },
};

export const catalog = defineCatalog(schema, {
  components: componentDefinitions,
  actions: {},
});
