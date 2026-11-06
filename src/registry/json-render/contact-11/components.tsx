"use client";

import { type BaseComponentProps, useBoundProp } from "@json-render/react";

import {
  Contact11,
  type Contact11Values,
} from "@/registry/pro-marketing/blocks/contact/11";

import { ActionError, InvalidProps, useEventAction } from "../shared/actions";
import { propsSchema } from "./catalog";

function Contact11Adapter({ props, on, loading, bindings }: BaseComponentProps) {
  const [values, setValues] = useBoundProp<Partial<Contact11Values>>(
    props.values as Partial<Contact11Values> | undefined,
    bindings?.values
  );
  const submit = useEventAction(on("submit"), loading);
  const result = propsSchema.safeParse(props);
  if (!result.success) return <InvalidProps name="Contact11" />;
  const bound = Boolean(bindings?.values);
  return (
    <>
      <Contact11
        {...result.data}
        values={bound ? (values ?? {}) : undefined}
        onValuesChange={bound ? setValues : undefined}
        onSubmit={() => void submit.run()}
        submitDisabled={submit.disabled}
      />
      <ActionError error={submit.error} />
    </>
  );
}

export const components = { Contact11: Contact11Adapter };
