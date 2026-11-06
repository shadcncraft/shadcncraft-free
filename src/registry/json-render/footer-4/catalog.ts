import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

import { href, imageSrc, text } from "../shared/schema";

export const propsSchema = z.strictObject({
  logoSrc: imageSrc.optional(),
  logoAlt: z.string().optional(),
  homeHref: href.optional(),
  description: z.string().optional(),
  social: z
    .array(z.strictObject({ platform: z.enum(["linkedin", "x"]), href: href.optional() }))
    .max(2)
    .optional(),
  columns: z
    .array(
      z.strictObject({
        title: text,
        links: z
          .array(z.strictObject({ label: text, href: href.optional() }))
          .min(1)
          .max(10),
      })
    )
    .max(4)
    .optional(),
  copyright: text.optional(),
});

export const componentDefinitions = {
  Footer4: {
    props: propsSchema,
    slots: [],
    description:
      "Site footer with logo, short description, social icons, up to four link columns and a copyright line.",
  },
};

export const catalog = defineCatalog(schema, {
  components: componentDefinitions,
  actions: {},
});
