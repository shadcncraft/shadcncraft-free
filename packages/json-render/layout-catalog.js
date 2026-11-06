import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

/** Spacing between stacked children. Every block already pads its own section. */
export const stackGaps = ["none", "sm", "md", "lg"];
export const stackDefaultGap = "none";

export const stackPropsSchema = z.strictObject({
  gap: z.enum(stackGaps).optional().describe(
    "Space between children. Default none: each block pads its own section, so full-width blocks stack with the intended rhythm. Use sm/md/lg only for children without their own padding.",
  ),
});

export const layoutDefinitions = {
  Stack: {
    props: stackPropsSchema,
    slots: ["default"],
    events: [],
    description:
      "Vertical page composition. Renders its children top to bottom at full width, in order. Use one Stack as the root of a page made of several blocks; nest a Stack only to group children. Props: gap (none|sm|md|lg, default none). No actions.",
  },
};

export const layoutCatalog = defineCatalog(schema, { components: layoutDefinitions, actions: {} });
