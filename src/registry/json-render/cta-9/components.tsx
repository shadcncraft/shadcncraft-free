"use client";

import type { BaseComponentProps } from "@json-render/react";

import { CTA9 } from "@/registry/pro-marketing/blocks/cta/9";

import { ActionError, InvalidProps, useEventAction } from "../shared/actions";
import { propsSchema } from "./catalog";

function CTA9Adapter({ props, on, loading }: BaseComponentProps) {
  const primary = useEventAction(on("primary"), loading);
  const result = propsSchema.safeParse(props);
  if (!result.success) return <InvalidProps name="CTA9" />;
  return (
    <>
      <CTA9
        {...result.data}
        onPrimaryAction={primary.run}
        primaryDisabled={primary.disabled}
      />
      <ActionError error={primary.error} />
    </>
  );
}

export const components = { CTA9: CTA9Adapter };
