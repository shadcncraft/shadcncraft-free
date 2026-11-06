import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  SectionHeading,
  SectionHeadingTagline,
  SectionHeadingTitle,
} from "@/registry/pro-marketing/ui/section-heading";

export type Faqs4Item = { question: string; answer: string };

export type Faqs4Props = {
  /** Section id, so links like "#pricing" can jump here. */
  anchor?: string;
  tagline?: string;
  heading?: string;
  items?: Faqs4Item[];
  supportText?: string;
  supportLinkLabel?: string;
  supportLinkHref?: string;
};

export function Faqs4({
  anchor,
  tagline = "FAQ",
  heading = "Your questions answered",
  items = faqsData,
  supportText = "Still have questions? We're here to help.",
  supportLinkLabel = "Contact support",
  supportLinkHref = "#",
}: Faqs4Props = {}) {
  return (
    <section id={anchor} className="py-12 lg:py-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-5 lg:gap-16 lg:px-8">
        {/* Section Heading */}
        <div className="mx-auto w-full max-w-2xl">
          <SectionHeading alignment="center">
            {tagline && <SectionHeadingTagline>{tagline}</SectionHeadingTagline>}
            <SectionHeadingTitle>{heading}</SectionHeadingTitle>
          </SectionHeading>
        </div>

        {/* FAQs Accordion */}
        <div className="mx-auto w-full max-w-2xl">
          <Accordion type="single" className="w-full">
            {items.map((faq, index) => (
              <AccordionItem key={index} value={faq.question}>
                <AccordionTrigger className="text-base">{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Contact CTA */}
        {(supportText || supportLinkLabel) && (
          <div className="mx-auto w-full max-w-2xl text-center">
            <p className="text-muted-foreground">
              {supportText}
              {supportText && supportLinkLabel && " "}
              {supportLinkLabel && (
                <a href={supportLinkHref} className="text-foreground underline">
                  {supportLinkLabel}
                </a>
              )}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

const faqsData: Faqs4Item[] = [
  {
    question: "What is Acme Inc.?",
    answer:
      "Acme Inc. is a productivity platform designed to help teams work smarter and faster. It provides tools for collaboration, project management, and workflow optimization.",
  },
  {
    question: "How do I get started?",
    answer:
      "Getting started is easy. Sign up for a free account, complete the onboarding process, and you'll be ready to use Acme Inc. in minutes.",
  },
  {
    question: "What are the pricing plans?",
    answer:
      "We offer flexible pricing plans to suit teams of all sizes. Visit our pricing page to see detailed information about each plan and choose the one that fits your needs.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes, we offer a free trial period so you can explore all features before committing to a paid plan. No credit card required.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Absolutely. You can cancel your subscription at any time from your account settings. There are no long-term contracts or cancellation fees.",
  },
  {
    question: "Do you offer customer support?",
    answer:
      "Yes, we provide customer support via email and chat. Premium plans include priority support with faster response times.",
  },
];
