import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  SectionHeading,
  SectionHeadingBody,
  SectionHeadingTagline,
  SectionHeadingTitle,
} from "@/registry/pro-marketing/ui/section-heading";

export type Contact11Values = {
  name: string;
  email: string;
  message: string;
  consent: boolean;
};

export type Contact11Props = {
  /** Section id, so links like "#pricing" can jump here. */
  anchor?: string;
  tagline?: string;
  heading?: string;
  description?: string;
  nameLabel?: string;
  namePlaceholder?: string;
  emailLabel?: string;
  emailPlaceholder?: string;
  messageLabel?: string;
  messagePlaceholder?: string;
  consentText?: string;
  privacyLabel?: string;
  privacyHref?: string;
  submitLabel?: string;
  /** Shown under the button, e.g. after a successful send. */
  statusMessage?: string;
  /** Controlled values. Omit to let the fields manage their own values. */
  values?: Partial<Contact11Values>;
  onValuesChange?: (values: Contact11Values) => void;
  onSubmit?: (values: Contact11Values) => void;
  submitDisabled?: boolean;
};

function readValues(form: HTMLFormElement): Contact11Values {
  const field = (id: string) =>
    (form.querySelector(`#${id}`) as HTMLInputElement | HTMLTextAreaElement | null)
      ?.value ?? "";
  return {
    name: field("input-1"),
    email: field("input-2"),
    message: field("input-3"),
    consent:
      form.querySelector('[role="checkbox"]')?.getAttribute("aria-checked") === "true",
  };
}

export function Contact11({
  anchor,
  tagline = "Support",
  heading = "Need Help? We're Here to Help",
  description = "Our support team is available to assist you with any questions or issues you may have.",
  nameLabel = "Name",
  namePlaceholder = "Joe Smith",
  emailLabel = "Email",
  emailPlaceholder = "joe@example.com",
  messageLabel = "Message",
  messagePlaceholder = "Hi, this is my message",
  consentText = "You agree to our simple",
  privacyLabel = "Privacy Policy",
  privacyHref = "#",
  submitLabel = "Send message",
  statusMessage,
  values,
  onValuesChange,
  onSubmit,
  submitDisabled,
}: Contact11Props = {}) {
  const update = (patch: Partial<Contact11Values>) =>
    onValuesChange?.({
      name: "",
      email: "",
      message: "",
      consent: false,
      ...values,
      ...patch,
    });
  return (
    <section id={anchor} className="py-12 lg:py-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-5 lg:gap-16 lg:px-8">
        {/* Section Heading */}
        <div className="mx-auto w-full max-w-md">
          <SectionHeading alignment="center">
            {tagline && <SectionHeadingTagline>{tagline}</SectionHeadingTagline>}
            <SectionHeadingTitle>{heading}</SectionHeadingTitle>
            {description && <SectionHeadingBody>{description}</SectionHeadingBody>}
          </SectionHeading>
        </div>

        {/* Contact Form */}
        <div className="mx-auto w-full max-w-md">
          <form
            className="flex flex-col gap-4"
            aria-label="Contact form"
            onSubmit={
              onSubmit &&
              ((event) => {
                event.preventDefault();
                onSubmit({ ...readValues(event.currentTarget), ...values });
              })
            }
          >
            <div className="flex w-full flex-col gap-2">
              <Label htmlFor="input-1">{nameLabel}</Label>
              <Input
                id="input-1"
                placeholder={namePlaceholder}
                value={values?.name}
                onChange={
                  onValuesChange && ((event) => update({ name: event.target.value }))
                }
              />
            </div>
            <div className="flex w-full flex-col gap-2">
              <Label htmlFor="input-2">{emailLabel}</Label>
              <Input
                id="input-2"
                placeholder={emailPlaceholder}
                type={onSubmit ? "email" : undefined}
                value={values?.email}
                onChange={
                  onValuesChange && ((event) => update({ email: event.target.value }))
                }
              />
            </div>
            <div className="flex w-full flex-col gap-2">
              <Label htmlFor="input-3">{messageLabel}</Label>
              <Textarea
                id="input-3"
                placeholder={messagePlaceholder}
                className="h-32"
                value={values?.message}
                onChange={
                  onValuesChange && ((event) => update({ message: event.target.value }))
                }
              />
            </div>
            {(consentText || privacyLabel) && (
              <div className="flex items-center gap-2 py-2">
                <Checkbox
                  checked={values?.consent}
                  onCheckedChange={
                    onValuesChange && ((checked) => update({ consent: checked === true }))
                  }
                />
                <span className="text-sm font-normal">
                  {consentText}
                  {consentText && privacyLabel && " "}
                  {privacyLabel && (
                    <a href={privacyHref} className="text-primary underline">
                      {privacyLabel}
                    </a>
                  )}
                </span>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={submitDisabled}>
              {submitLabel}
            </Button>
            {statusMessage && (
              <p role="status" className="text-center text-sm text-foreground">
                {statusMessage}
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
