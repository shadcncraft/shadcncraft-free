/**
 * Renders every free block with no props. Prop support must not change what a
 * registry install renders, so `--check` compares against the committed baseline.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Banner10 } from "@/registry/pro-marketing/blocks/banners/10";
import { Benefits13 } from "@/registry/pro-marketing/blocks/benefits/13";
import { Contact11 } from "@/registry/pro-marketing/blocks/contact/11";
import { CTA9 } from "@/registry/pro-marketing/blocks/cta/9";
import { Faqs4 } from "@/registry/pro-marketing/blocks/faqs/4";
import { Footer4 } from "@/registry/pro-marketing/blocks/footers/4";
import { NewsletterSignup5 } from "@/registry/pro-marketing/blocks/newsletter-signup/5";
import { Pricing8 } from "@/registry/pro-marketing/blocks/pricing/8";
import { Team6 } from "@/registry/pro-marketing/blocks/team/6";
import { Testimonial11 } from "@/registry/pro-marketing/blocks/testimonials/11";
import { TopNavigation5 } from "@/registry/pro-marketing/blocks/top-navigation/5";

const blocks: Record<string, ComponentType> = {
  "banner-10": Banner10,
  "benefits-13": Benefits13,
  "contact-11": Contact11,
  "cta-9": CTA9,
  "faqs-4": Faqs4,
  "footer-4": Footer4,
  "newsletter-signup-5": NewsletterSignup5,
  "pricing-8": Pricing8,
  "team-6": Team6,
  "testimonials-11": Testimonial11,
  "top-navigation-5": TopNavigation5,
};

const file = path.join(process.cwd(), "src/registry/json-render/default-markup.json");
const markup = Object.fromEntries(
  Object.entries(blocks).map(([name, Block]) => [
    name,
    renderToStaticMarkup(createElement(TooltipProvider, null, createElement(Block))),
  ])
);
if (process.argv.includes("--check")) {
  const baseline = JSON.parse(readFileSync(file, "utf8")) as Record<string, string>;
  const changed = Object.keys(blocks).filter((name) => baseline[name] !== markup[name]);
  if (changed.length) {
    console.error(`Default render changed: ${changed.join(", ")}`);
    process.exit(1);
  }
  console.log(`Default render unchanged for ${Object.keys(blocks).length} blocks.`);
} else {
  writeFileSync(file, JSON.stringify(markup, null, 2) + "\n");
  console.log(`Wrote ${file}`);
}
