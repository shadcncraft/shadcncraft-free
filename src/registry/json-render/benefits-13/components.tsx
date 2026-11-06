"use client";

import type { BaseComponentProps } from "@json-render/react";

import { Benefits13 } from "@/registry/pro-marketing/blocks/benefits/13";

import { InvalidProps } from "../shared/actions";
import { propsSchema } from "./catalog";

function Benefits13Adapter({ props }: BaseComponentProps) {
  const result = propsSchema.safeParse(props);
  if (!result.success) return <InvalidProps name="Benefits13" />;
  return <Benefits13 {...result.data} />;
}

export const components = { Benefits13: Benefits13Adapter };
