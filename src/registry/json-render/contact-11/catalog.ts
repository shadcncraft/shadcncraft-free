import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

import { anchor, headingFields, href, text } from "../shared/schema";

export const propsSchema = z.strictObject({
  anchor: anchor.optional(),
  ...headingFields,
  nameLabel: text.optional(),
  namePlaceholder: text.optional(),
  emailLabel: text.optional(),
  emailPlaceholder: text.optional(),
  messageLabel: text.optional(),
  messagePlaceholder: text.optional(),
  consentText: z.string().optional(),
  privacyLabel: z.string().optional(),
  privacyHref: href.optional(),
  submitLabel: text.optional(),
  successMessage: text.optional(),
  values: z
    .object({
      name: z.string().optional(),
      email: z.string().optional(),
      message: z.string().optional(),
      consent: z.boolean().optional(),
    })
    .optional(),
});

export const componentDefinitions = {
  Contact11: {
    props: propsSchema,
    slots: [],
    events: ["submit"],
    description:
      "Centred heading over a contact form with name, email and message fields, a privacy consent checkbox and a submit button.",
  },
};

export const catalog = defineCatalog(schema, {
  components: componentDefinitions,
  actions: {},
});
