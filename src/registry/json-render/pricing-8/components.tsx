"use client";

import { type BaseComponentProps, useBoundProp } from "@json-render/react";
import { useRef } from "react";

import { Pricing8 } from "@/registry/pro-marketing/blocks/pricing/8";

import { ActionError, InvalidProps, useEventAction } from "../shared/actions";
import { propsSchema } from "./catalog";

function Pricing8Adapter({ props, on, loading, bindings }: BaseComponentProps) {
  const [, setSelectedPlan] = useBoundProp<string>(
    props.selectedPlan as string | undefined,
    bindings?.selectedPlan
  );
  const chosen = useRef<string | null>(null);
  const select = useEventAction(on("select"), loading, () => {
    if (chosen.current !== null) setSelectedPlan(chosen.current);
  });
  const result = propsSchema.safeParse(props);
  if (!result.success) return <InvalidProps name="Pricing8" />;
  const { selectedPlan: _selected, ...content } = result.data;
  return (
    <>
      <Pricing8
        {...content}
        onPlanAction={(plan) => {
          chosen.current = plan.name;
          void select.run();
        }}
        planActionsDisabled={select.disabled}
      />
      <ActionError error={select.error} />
    </>
  );
}

export const components = { Pricing8: Pricing8Adapter };
