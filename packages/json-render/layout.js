"use client";
import { createElement } from "react";
import { stackDefaultGap, stackPropsSchema } from "./layout-catalog.js";

export * from "./layout-catalog.js";

// Inline, self-contained styles: no Tailwind preflight or stylesheet import is
// needed, and nothing here can collide with a variant's utility classes.
// Hosts may tune spacing through the --scraft-stack-gap-* custom properties.
const gapValues = {
  none: "0px",
  sm: "var(--scraft-stack-gap-sm, 1rem)",
  md: "var(--scraft-stack-gap-md, 2rem)",
  lg: "var(--scraft-stack-gap-lg, 4rem)",
};

export function Stack({ gap = stackDefaultGap, children }) {
  return createElement(
    "div",
    {
      "data-scraft-layout": "stack",
      "data-gap": gap,
      style: {
        display: "flex",
        flexDirection: "column",
        gap: gapValues[gap] ?? gapValues[stackDefaultGap],
        width: "100%",
        minWidth: 0,
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
      },
    },
    children,
  );
}

function StackAdapter({ props, children }) {
  const result = stackPropsSchema.safeParse(props ?? {});
  return createElement(Stack, { gap: result.success ? result.data.gap : undefined }, children);
}

export const layoutComponents = { Stack: StackAdapter };
