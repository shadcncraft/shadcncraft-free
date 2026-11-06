"use client";

import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SectionHeading,
  SectionHeadingBody,
  SectionHeadingTitle,
} from "@/registry/pro-marketing/ui/section-heading";

export type NewsletterSignup5Props = {
  /** Section id, so links like "#pricing" can jump here. */
  anchor?: string;
  heading?: string;
  description?: string;
  placeholder?: string;
  buttonLabel?: string;
  privacyNote?: string;
  /** Controlled email value. Omit to let the input manage its own value. */
  email?: string;
  onEmailChange?: (email: string) => void;
  onSubmit?: (email: string) => void;
  submitDisabled?: boolean;
};

export function NewsletterSignup5({
  anchor,
  heading = "Stay in the loop",
  description = "Get insights, product updates, and productivity tips straight to your inbox.",
  placeholder = "email@example.com",
  buttonLabel = "Subscribe",
  privacyNote = "We respect your privacy.",
  email,
  onEmailChange,
  onSubmit,
  submitDisabled,
}: NewsletterSignup5Props = {}) {
  return (
    <section id={anchor} className="py-12 lg:py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex flex-col justify-between gap-12 rounded-xl border bg-muted px-5 py-12 lg:flex-row lg:items-end lg:gap-16 lg:px-16 lg:py-20">
          {/* Section Heading */}
          <div className="flex-1">
            <SectionHeading>
              <SectionHeadingTitle>{heading}</SectionHeadingTitle>
              {description && (
                <SectionHeadingBody className="text-balance">
                  {description}
                </SectionHeadingBody>
              )}
            </SectionHeading>
          </div>

          {/* Newsletter Form */}
          <div className="flex max-w-md flex-col gap-2 lg:gap-3">
            <form
              className="flex flex-col gap-2 sm:flex-row"
              onSubmit={
                onSubmit &&
                ((event) => {
                  event.preventDefault();
                  const input = event.currentTarget.querySelector("input");
                  onSubmit(email ?? input?.value ?? "");
                })
              }
            >
              <Input
                placeholder={placeholder}
                className="w-full"
                type={onSubmit ? "email" : undefined}
                required={onSubmit ? true : undefined}
                value={email}
                onChange={onEmailChange && ((event) => onEmailChange(event.target.value))}
              />
              <Button
                type="submit"
                aria-label="Subscribe to newsletter"
                disabled={submitDisabled}
              >
                <Mail /> {buttonLabel}
              </Button>
            </form>

            {/* Privacy Policy */}
            {privacyNote && (
              <span
                className="text-center text-xs text-muted-foreground lg:text-right"
                role="note"
              >
                {privacyNote}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
