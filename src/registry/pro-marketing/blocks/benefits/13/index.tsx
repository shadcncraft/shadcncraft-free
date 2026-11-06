import {
  ArrowBigUpDash,
  ChartSpline,
  Clock,
  Database,
  IterationCcw,
  Lock,
  type LucideIcon,
  Rocket,
  Shield,
  Sparkles,
  Users,
  Workflow,
  Zap,
} from "lucide-react";

import {
  SectionHeading,
  SectionHeadingBody,
  SectionHeadingTagline,
  SectionHeadingTitle,
} from "@/registry/pro-marketing/ui/section-heading";

/** Icons a benefit can name. JSON documents refer to icons by these keys. */
export const benefits13Icons = {
  prioritize: ArrowBigUpDash,
  integrate: IterationCcw,
  data: Database,
  analytics: ChartSpline,
  workflow: Workflow,
  team: Users,
  speed: Zap,
  security: Shield,
  privacy: Lock,
  time: Clock,
  launch: Rocket,
  ai: Sparkles,
} satisfies Record<string, LucideIcon>;

export type Benefits13Icon = keyof typeof benefits13Icons;

export type Benefits13Item = {
  title: string;
  description?: string;
  icon?: Benefits13Icon;
};

export type Benefits13Props = {
  tagline?: string;
  heading?: string;
  description?: string;
  benefits?: Benefits13Item[];
};

const iconOrder = Object.keys(benefits13Icons) as Benefits13Icon[];

export function Benefits13({
  tagline = "Benefits",
  heading = "Why Choose Acme Inc.",
  description = "Discover the key advantages that make Acme Inc. the right choice for your team.",
  benefits = benefitsData,
}: Benefits13Props = {}) {
  return (
    <section className="py-12 lg:py-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-5 lg:gap-16 lg:px-8">
        {/* Section Heading */}
        <SectionHeading alignment="center" className="mx-auto w-full max-w-3xl">
          {tagline && <SectionHeadingTagline>{tagline}</SectionHeadingTagline>}
          <SectionHeadingTitle>{heading}</SectionHeadingTitle>
          {description && <SectionHeadingBody>{description}</SectionHeadingBody>}
        </SectionHeading>

        {/* Benefits Grid */}
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3 lg:gap-9">
          {benefits.map((benefit, index) => {
            const Icon =
              benefits13Icons[benefit.icon ?? iconOrder[index % iconOrder.length]];
            return (
              <div
                key={index}
                className="group flex flex-col gap-4 rounded-xl border bg-card p-6"
              >
                <div className="grid size-11 shrink-0 place-items-center rounded-full border bg-muted">
                  <Icon className="size-4 shrink-0 text-primary" />
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-semibold tracking-tight text-foreground">
                    {benefit.title}
                  </h3>
                  {benefit.description && (
                    <p className="text-lg font-normal text-muted-foreground">
                      {benefit.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const benefitsData: Benefits13Item[] = [
  {
    icon: "prioritize",
    title: "Intelligent Prioritization",
    description:
      "Know exactly what to work on next with AI that understands your goals and context. Prioritize smarter with Acme Inc.",
  },
  {
    icon: "integrate",
    title: "Effortless Integration",
    description:
      "Acme Inc. connects seamlessly with the tools your team already uses, so there's no steep learning curve or disruption.",
  },
  {
    icon: "data",
    title: "Clear Decision Support",
    description:
      "When projects stall, it's rarely because of lack of effort, it's lack of clarity. Acme Inc. provides AI-driven insights.",
  },
  {
    icon: "analytics",
    title: "Smarter Analytics",
    description:
      "Turn data into clarity with AI-powered insights that help you act faster and more confidently.",
  },
  {
    icon: "workflow",
    title: "Seamless Workflow",
    description:
      "Stay in the zone without constant context switching across apps and tools.",
  },
  {
    icon: "team",
    title: "Team Alignment",
    description:
      "Keep everyone on the same page with a single source of truth for projects and decisions.",
  },
];
