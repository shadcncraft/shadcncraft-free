import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

import { href, text } from "../shared/schema";

export const propsSchema = z.strictObject({
  highlight: z.string().optional(),
  message: text.optional(),
  linkLabel: z.string().optional(),
  linkHref: href.optional(),
  dismissible: z.boolean().optional(),
});

export const componentDefinitions = {
  Banner10: {
    props: propsSchema,
    slots: [],
    events: ["dismiss"],
    description:
      "Thin muted announcement bar with an icon, bold highlight, message, optional link and a close button.",
  },
};

export const catalog = defineCatalog(schema, {
  components: componentDefinitions,
  actions: {},
});
