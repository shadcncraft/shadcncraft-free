"use client";

import { type BaseComponentProps, useBoundProp } from "@json-render/react";

import { NewsletterSignup5 } from "@/registry/pro-marketing/blocks/newsletter-signup/5";

import { ActionError, InvalidProps, useEventAction } from "../shared/actions";
import { propsSchema } from "./catalog";

function NewsletterSignup5Adapter({ props, on, loading, bindings }: BaseComponentProps) {
  const [email, setEmail] = useBoundProp<string>(
    props.email as string | undefined,
    bindings?.email
  );
  const submit = useEventAction(on("submit"), loading);
  const result = propsSchema.safeParse(props);
  if (!result.success) return <InvalidProps name="NewsletterSignup5" />;
  const bound = Boolean(bindings?.email);
  return (
    <>
      <NewsletterSignup5
        {...result.data}
        email={bound ? (email ?? "") : undefined}
        onEmailChange={bound ? setEmail : undefined}
        onSubmit={() => void submit.run()}
        submitDisabled={submit.disabled}
      />
      <ActionError error={submit.error} />
    </>
  );
}

export const components = { NewsletterSignup5: NewsletterSignup5Adapter };
