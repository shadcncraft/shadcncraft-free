"use client";

import type { BaseComponentProps } from "@json-render/react";

import { Faqs4 } from "@/registry/pro-marketing/blocks/faqs/4";

import { InvalidProps } from "../shared/actions";
import { propsSchema } from "./catalog";

function FAQs4Adapter({ props }: BaseComponentProps) {
  const result = propsSchema.safeParse(props);
  if (!result.success) return <InvalidProps name="FAQs4" />;
  return <Faqs4 {...result.data} />;
}

export const components = { FAQs4: FAQs4Adapter };
