"use client";

import type { BaseComponentProps } from "@json-render/react";

import { Banner10 } from "@/registry/pro-marketing/blocks/banners/10";

import { InvalidProps, useEventAction } from "../shared/actions";
import { propsSchema } from "./catalog";

function Banner10Adapter({ props, on, loading }: BaseComponentProps) {
  const dismiss = useEventAction(on("dismiss"), loading);
  const result = propsSchema.safeParse(props);
  if (!result.success) return <InvalidProps name="Banner10" />;
  return <Banner10 {...result.data} onDismiss={() => void dismiss.run()} />;
}

export const components = { Banner10: Banner10Adapter };
