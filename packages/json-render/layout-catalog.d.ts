import type { Catalog } from "@json-render/core";
import type { z } from "zod";

export type StackGap = "none" | "sm" | "md" | "lg";
export declare const stackGaps: readonly StackGap[];
export declare const stackDefaultGap: "none";
export declare const stackPropsSchema: z.ZodObject<
  { gap: z.ZodOptional<z.ZodEnum<{ none: "none"; sm: "sm"; md: "md"; lg: "lg" }>> },
  z.core.$strict
>;
export type StackContent = z.input<typeof stackPropsSchema>;

export declare const layoutDefinitions: {
  Stack: {
    props: typeof stackPropsSchema;
    slots: ["default"];
    events: [];
    description: string;
  };
};

export declare const layoutCatalog: Catalog;
