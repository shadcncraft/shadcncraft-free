import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

import { href, optionalLine, text } from "../shared/schema";

export const propsSchema = z.strictObject({
  tagline: optionalLine.optional(),
  heading: text.optional(),
  items: z
    .array(z.strictObject({ question: text, answer: text }))
    .min(1)
    .max(12)
    .optional(),
  supportText: z.string().optional(),
  supportLinkLabel: z.string().optional(),
  supportLinkHref: href.optional(),
});

export const componentDefinitions = {
  FAQs4: {
    props: propsSchema,
    slots: [],
    description:
      "Centred heading over an accordion of questions and answers, with an optional support line and link.",
  },
};

export const catalog = defineCatalog(schema, {
  components: componentDefinitions,
  actions: {},
});
