import { ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  SectionHeading,
  SectionHeadingBody,
  SectionHeadingTitle,
} from "@/registry/pro-marketing/ui/section-heading";

export type CTA9Props = {
  /** Section id, so links like "#pricing" can jump here. */
  anchor?: string;
  heading?: string;
  description?: string;
  primaryLabel?: string;
  onPrimaryAction?: () => void;
  primaryDisabled?: boolean;
};

export function CTA9({
  anchor,
  heading = "Ready to Work Smarter with AI?",
  description = "Start today and see how Acme Inc. helps you finish projects faster, with clarity and focus at every step.",
  primaryLabel = "Learn More",
  onPrimaryAction,
  primaryDisabled,
}: CTA9Props = {}) {
  return (
    <section id={anchor} className="bg-primary py-12 text-primary-foreground lg:py-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 lg:px-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 text-center">
          {/* Section Heading */}
          <SectionHeading alignment="center">
            <SectionHeadingTitle className="text-primary-foreground">
              {heading}
            </SectionHeadingTitle>
            {description && (
              <SectionHeadingBody className="text-primary-foreground/90">
                {description}
              </SectionHeadingBody>
            )}
          </SectionHeading>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              onClick={onPrimaryAction}
              disabled={primaryDisabled}
            >
              {primaryLabel}
              <ArrowRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
