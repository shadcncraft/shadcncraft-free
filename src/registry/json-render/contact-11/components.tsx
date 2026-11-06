"use client";

import { type BaseComponentProps, useBoundProp } from "@json-render/react";
import { useState } from "react";

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
  const [done, setDone] = useState(false);
  const result = propsSchema.safeParse(props);
  if (!result.success) return <InvalidProps name="Contact11" />;
  const bound = Boolean(bindings?.values);
  const { successMessage, ...content } = result.data;
  return (
    <>
      <Contact11
        {...content}
        statusMessage={done ? successMessage : undefined}
        values={bound ? (values ?? {}) : undefined}
        onValuesChange={
          bound
            ? (next) => {
                setDone(false);
                setValues(next);
              }
            : undefined
        }
        onSubmit={async () => {
          if ((await submit.run()) && successMessage) {
            setDone(true);
            if (bound) setValues({ name: "", email: "", message: "", consent: false });
          }
        }}
        submitDisabled={submit.disabled}
      />
      <ActionError error={submit.error} />
    </>
  );
}

export const components = { Contact11: Contact11Adapter };
