#!/usr/bin/env node
// Validator and CLI checks against the installed package.
//   node checks/validate.mjs
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { validateSpec } from "@shadcncraft/json-render/validate";

const pkg = new URL("../node_modules/@shadcncraft/json-render/", import.meta.url);
const failures = [];
let cases = 0;
const expect = (name, ok, detail) => {
  cases++;
  if (!ok) failures.push(`${name}: ${detail}`);
};
const codes = (result) =>
  [...result.errors, ...result.warnings, ...result.info].map((i) => i.code);
const page = (children, elements, extra = {}) => ({
  root: "page",
  elements: { page: { type: "Stack", props: {}, children }, ...elements },
  ...extra,
});
const block = (type, props = {}, extra = {}) => ({ type, props, children: [], ...extra });
const full = {
  CTA9: {
    heading: "Start today",
    description: "Try it free for 14 days.",
    primaryLabel: "Start trial",
  },
  Footer4: {
    description: "Delivery insights.",
    columns: [{ title: "Product", links: [{ label: "Pricing", href: "/pricing" }] }],
    copyright: "© 2026 Lumen",
  },
  TopNavigation5: {
    links: [{ label: "Pricing", href: "/pricing" }],
    actionLabel: "Sign in",
  },
  NewsletterSignup5: {
    heading: "Get the digest",
    description: "Monthly tips.",
    placeholder: "you@company.com",
    buttonLabel: "Subscribe",
    privacyNote: "No spam.",
  },
};
const on = (event, action = "go") => ({ on: { [event]: { action, params: {} } } });

// Every shipped example is clean: no errors, no warnings.
const examples = [
  ...readdirSync(new URL("examples/", pkg)).filter((f) => f.endsWith(".json")),
  ...readdirSync(new URL("examples/pages/", pkg)).map((f) => `pages/${f}`),
];
for (const file of examples) {
  const result = validateSpec(JSON.parse(readFileSync(new URL(`examples/${file}`, pkg))));
  expect(
    `example ${file}`,
    result.errors.length === 0 && result.warnings.length === 0,
    JSON.stringify([...result.errors, ...result.warnings].map((i) => i.message))
  );
}

// Errors
const cases_ = [
  [
    "unknown_component suggests the closest type",
    page(["a"], { a: block("CTA90") }),
    (r) =>
      r.errors.some((i) => i.code === "unknown_component" && i.hint.includes("CTA9")),
  ],
  [
    "invalid_prop for a bad href",
    page(["a"], { a: block("FAQs4", { supportLinkHref: "javascript:alert(1)" }) }),
    (r) => codes(r).includes("invalid_prop"),
  ],
  [
    "unknown_prop",
    page(["a"], {
      a: block("CTA9", { ...full.CTA9, secondaryLabel: "x" }, on("primary")),
    }),
    (r) => codes(r).includes("unknown_prop"),
  ],
  [
    "unknown_event",
    page(["a"], { a: block("CTA9", full.CTA9, on("secondary")) }),
    (r) => codes(r).includes("unknown_event"),
  ],
  [
    "children_on_leaf",
    page(["a"], {
      a: { ...block("CTA9", full.CTA9, on("primary")), children: ["b"] },
      b: block("CTA9", full.CTA9, on("primary")),
    }),
    (r) => codes(r).includes("children_on_leaf"),
  ],
  [
    "missing_child",
    page(["a", "zzz"], { a: block("CTA9", full.CTA9, on("primary")) }),
    (r) => codes(r).includes("missing_child"),
  ],
  [
    "unknown_action with --actions",
    page(["a"], { a: block("CTA9", full.CTA9, on("primary", "nope")) }),
    (r) => codes(r).includes("unknown_action"),
    { actions: ["go"] },
  ],
  // Warnings
  [
    "sample_content for an omitted prop",
    page(["a"], { a: block("CTA9", { heading: "Hi there" }, on("primary")) }),
    (r) =>
      r.warnings.some(
        (i) => i.code === "sample_content" && i.path.endsWith("/description")
      ),
  ],
  [
    "text_too_long for a list item field",
    page(["a"], {
      a: block("Testimonials11", {
        tagline: "",
        heading: "Customers",
        description: "",
        testimonials: [{ quote: "x".repeat(300), name: "Ada" }],
      }),
    }),
    (r) =>
      r.warnings.some(
        (i) => i.code === "text_too_long" && i.path.endsWith("/testimonials/0/quote")
      ),
  ],
  [
    "too many nav links is invalid",
    page(["a"], {
      a: block(
        "TopNavigation5",
        {
          ...full.TopNavigation5,
          links: Array.from({ length: 7 }, (_, i) => ({ label: `L${i}`, href: "/" })),
        },
        on("action")
      ),
    }),
    (r) => codes(r).includes("invalid_prop"),
  ],
  [
    "unbound_event",
    page(["a"], { a: block("CTA9", full.CTA9) }),
    (r) => codes(r).includes("unbound_event"),
  ],
  [
    "optional event may stay unbound",
    page(["a"], {
      a: block("Banner10", {
        highlight: "New:",
        message: "Hourly forecasts.",
        linkLabel: "",
        linkHref: "/x",
      }),
    }),
    (r) => !codes(r).includes("unbound_event"),
  ],
  [
    "adjacent_panels",
    page(["a", "b"], {
      a: block("NewsletterSignup5", full.NewsletterSignup5, on("submit")),
      b: block("CTA9", full.CTA9, on("primary")),
    }),
    (r) => codes(r).includes("adjacent_panels"),
  ],
  [
    "multiple_inverted_panels",
    page(["a", "x", "b"], {
      a: block("CTA9", full.CTA9, on("primary")),
      x: block("FAQs4", {
        tagline: "",
        heading: "FAQ",
        items: [{ question: "Q?", answer: "A." }],
        supportText: "",
        supportLinkLabel: "",
      }),
      b: block("CTA9", full.CTA9, on("primary")),
    }),
    (r) => codes(r).includes("multiple_inverted_panels"),
  ],
  [
    "misplaced_block: footer not last",
    page(["f", "c"], {
      f: block("Footer4", full.Footer4),
      c: block("CTA9", full.CTA9, on("primary")),
    }),
    (r) => codes(r).includes("misplaced_block"),
  ],
  [
    "misplaced_block: navigation after content",
    page(["c", "n"], {
      c: block("CTA9", full.CTA9, on("primary")),
      n: block("TopNavigation5", full.TopNavigation5, on("action")),
    }),
    (r) => codes(r).includes("misplaced_block"),
  ],
  [
    "banner before navigation is fine",
    page(["b", "n"], {
      b: block("Banner10", {
        highlight: "New:",
        message: "Hourly forecasts.",
        linkLabel: "",
        linkHref: "/x",
      }),
      n: block("TopNavigation5", full.TopNavigation5, on("action")),
    }),
    (r) => !codes(r).includes("misplaced_block"),
  ],
  [
    "duplicate_page_chrome",
    page(["n", "m"], {
      n: block("TopNavigation5", full.TopNavigation5, on("action")),
      m: block("TopNavigation5", full.TopNavigation5, on("action")),
    }),
    (r) => codes(r).includes("duplicate_page_chrome"),
  ],
  // Info
  [
    "dynamic_prop for $bindState",
    page(
      ["a"],
      {
        a: block(
          "NewsletterSignup5",
          { ...full.NewsletterSignup5, email: { $bindState: "/n/email" } },
          on("submit")
        ),
      },
      { state: { n: { email: "" } } }
    ),
    (r) => codes(r).includes("dynamic_prop") && r.errors.length === 0,
  ],
  [
    '"" hides an optional line without errors',
    page(["a"], { a: block("CTA9", { ...full.CTA9, description: "" }, on("primary")) }),
    (r) => r.errors.length === 0 && !codes(r).includes("sample_content"),
  ],
];
for (const [name, spec, test, options] of cases_) {
  const result = validateSpec(spec, options);
  expect(name, test(result), JSON.stringify(codes(result)));
}

// CLI: exit codes and output.
const dir = mkdtempSync(path.join(tmpdir(), "scraft-check-"));
const bad = path.join(dir, "bad.json");
writeFileSync(bad, JSON.stringify(page(["a"], { a: block("CTA90") })));
const cli = (args) => {
  try {
    return {
      code: 0,
      out: execFileSync("npx", ["shadcncraft-json-render", ...args], {
        encoding: "utf8",
        cwd: new URL("..", import.meta.url).pathname,
      }),
    };
  } catch (error) {
    return { code: error.status, out: `${error.stdout}${error.stderr}` };
  }
};
const good = cli([
  "check",
  "node_modules/@shadcncraft/json-render/examples/pages/product-landing.json",
]);
expect("CLI check passes a shipped page", good.code === 0, good.out);
const failed = cli(["check", bad]);
expect(
  "CLI check fails an invalid document",
  failed.code === 1 && failed.out.includes("unknown_component"),
  failed.out
);
const listing = cli(["catalog", "Pricing8"]);
expect(
  "CLI catalog shows a block",
  listing.code === 0 && listing.out.includes("selectedPlan"),
  listing.out.slice(0, 200)
);

console.log(`${cases} validator and CLI cases`);
if (failures.length) {
  console.log(failures.join("\n"));
  process.exit(1);
}
console.log("All validator checks passed.");
