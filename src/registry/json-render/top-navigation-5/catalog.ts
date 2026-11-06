import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

import { href, imageSrc, text } from "../shared/schema";

export const propsSchema = z.strictObject({
  logoSrc: imageSrc.optional(),
  logoAlt: z.string().optional(),
  homeHref: href.optional(),
  links: z
    .array(
      z.strictObject({
        label: text,
        href: href.optional(),
        active: z.boolean().optional(),
      })
    )
    .max(6)
    .optional(),
  actionLabel: z.string().optional(),
});

export const componentDefinitions = {
  TopNavigation5: {
    props: propsSchema,
    slots: [],
    events: ["action"],
    description:
      "Site header with logo, centred links, one outline action button and a mobile menu.",
  },
};

export const catalog = defineCatalog(schema, {
  components: componentDefinitions,
  actions: {},
});
