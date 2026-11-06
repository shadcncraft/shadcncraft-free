import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

import { optionalLine, text } from "../shared/schema";

export const propsSchema = z.strictObject({
  heading: text.optional(),
  description: optionalLine.optional(),
  placeholder: text.optional(),
  buttonLabel: text.optional(),
  privacyNote: z.string().optional(),
  email: z.string().optional(),
});

export const componentDefinitions = {
  NewsletterSignup5: {
    props: propsSchema,
    slots: [],
    events: ["submit"],
    description:
      "Muted panel with a heading and description beside an email field, subscribe button and privacy note.",
  },
};

export const catalog = defineCatalog(schema, {
  components: componentDefinitions,
  actions: {},
});
