"use client";

import type { BaseComponentProps } from "@json-render/react";

import { Team6 } from "@/registry/pro-marketing/blocks/team/6";

import { InvalidProps } from "../shared/actions";
import { propsSchema } from "./catalog";

function Team6Adapter({ props }: BaseComponentProps) {
  const result = propsSchema.safeParse(props);
  if (!result.success) return <InvalidProps name="Team6" />;
  return <Team6 {...result.data} />;
}

export const components = { Team6: Team6Adapter };
