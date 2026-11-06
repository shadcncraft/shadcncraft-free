"use client";

import type { BaseComponentProps } from "@json-render/react";

import { Testimonial11 } from "@/registry/pro-marketing/blocks/testimonials/11";

import { InvalidProps } from "../shared/actions";
import { propsSchema } from "./catalog";

function Testimonials11Adapter({ props }: BaseComponentProps) {
  const result = propsSchema.safeParse(props);
  if (!result.success) return <InvalidProps name="Testimonials11" />;
  return <Testimonial11 {...result.data} />;
}

export const components = { Testimonials11: Testimonials11Adapter };
