"use client";

import { type BaseComponentProps, useBoundProp } from "@json-render/react";
import { useState } from "react";

import { NewsletterSignup5 } from "@/registry/pro-marketing/blocks/newsletter-signup/5";

import { ActionError, InvalidProps, useEventAction } from "../shared/actions";
import { propsSchema } from "./catalog";

function NewsletterSignup5Adapter({ props, on, loading, bindings }: BaseComponentProps) {
  const [email, setEmail] = useBoundProp<string>(
    props.email as string | undefined,
    bindings?.email
  );
  const submit = useEventAction(on("submit"), loading);
  const [done, setDone] = useState(false);
  const result = propsSchema.safeParse(props);
  if (!result.success) return <InvalidProps name="NewsletterSignup5" />;
  const bound = Boolean(bindings?.email);
  const { successMessage, ...content } = result.data;
  return (
    <>
      <NewsletterSignup5
        {...content}
        statusMessage={done ? successMessage : undefined}
        email={bound ? (email ?? "") : undefined}
        onEmailChange={
          bound
            ? (value) => {
                setDone(false);
                setEmail(value);
              }
            : undefined
        }
        onSubmit={async () => {
          if ((await submit.run()) && successMessage) {
            setDone(true);
            if (bound) setEmail("");
          }
        }}
        submitDisabled={submit.disabled}
      />
      <ActionError error={submit.error} />
    </>
  );
}

export const components = { NewsletterSignup5: NewsletterSignup5Adapter };
