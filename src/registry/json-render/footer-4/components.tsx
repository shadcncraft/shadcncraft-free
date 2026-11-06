"use client";

import type { BaseComponentProps } from "@json-render/react";

import { Footer4 } from "@/registry/pro-marketing/blocks/footers/4";

import { InvalidProps } from "../shared/actions";
import { propsSchema } from "./catalog";

function Footer4Adapter({ props }: BaseComponentProps) {
  const result = propsSchema.safeParse(props);
  if (!result.success) return <InvalidProps name="Footer4" />;
  return <Footer4 {...result.data} />;
}

export const components = { Footer4: Footer4Adapter };
