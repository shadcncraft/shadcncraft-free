"use client";

import type { BaseComponentProps } from "@json-render/react";

import { TopNavigation5 } from "@/registry/pro-marketing/blocks/top-navigation/5";

import { ActionError, InvalidProps, useEventAction } from "../shared/actions";
import { propsSchema } from "./catalog";

function TopNavigation5Adapter({ props, on, loading }: BaseComponentProps) {
  const action = useEventAction(on("action"), loading);
  const result = propsSchema.safeParse(props);
  if (!result.success) return <InvalidProps name="TopNavigation5" />;
  return (
    <>
      <TopNavigation5
        {...result.data}
        onAction={() => void action.run()}
        actionDisabled={action.disabled}
      />
      <ActionError error={action.error} />
    </>
  );
}

export const components = { TopNavigation5: TopNavigation5Adapter };
