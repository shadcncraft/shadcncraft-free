# @shadcncraft/json-render

The shadcncraft Free blocks as a [JSON Render](https://github.com/vercel-labs/json-render)
catalog. An agent, or your app's AI feature, writes a JSON document from these
blocks, and JSON Render turns it into a polished page. The agent can only use
blocks and props from the catalog. A checker catches long copy, leftover
sample content and awkward block order before anyone sees the page.

Blocks: `TopNavigation5`, `Banner10`, `Benefits13`, `Testimonials11`,
`Pricing8`, `FAQs4`, `Team6`, `NewsletterSignup5`, `Contact11`, `CTA9`,
`Footer4`, plus a `Stack` layout node.

> Local build. Not published to npm yet.

## Install

```sh
npm install @shadcncraft/json-render @json-render/core @json-render/react zod
```

React 19, `@json-render/*` (0.22 recommended; 0.21.3 works) and zod 4 are
peers. The block dependencies (Radix primitives, lucide-react and so on) install
with the package.

## Render a page

```tsx
import "@shadcncraft/json-render/styles.css";
import "@shadcncraft/json-render/theme.css"; // optional: skip if your app defines shadcn theme variables
import { components } from "@shadcncraft/json-render";
import { catalog } from "@shadcncraft/json-render/catalog";
import { defineRegistry, JSONUIProvider, Renderer } from "@json-render/react";

const { registry } = defineRegistry(catalog, { components });

export function Page({ spec }) {
  return (
    <JSONUIProvider
      registry={registry}
      initialState={spec.state ?? {}}
      handlers={{
        subscribe: async ({ email }) => { /* call your API */ },
        startTrial: async () => { /* navigate */ },
      }}
    >
      <Renderer spec={spec} registry={registry} />
    </JSONUIProvider>
  );
}
```

`spec` is a document such as
[`examples/pages/product-landing.json`](examples/pages/product-landing.json):
a `Stack` root whose `children` are blocks, top to bottom.

To render only some blocks, import a block's own entry points:
`@shadcncraft/json-render/<item>/catalog` (`componentDefinitions`, `catalog`),
`@shadcncraft/json-render/<item>` (`components`) and
`@shadcncraft/json-render/<item>/react` (the plain React block).
Items: `top-navigation-5`, `banner-10`, `benefits-13`, `testimonials-11`,
`pricing-8`, `faqs-4`, `team-6`, `newsletter-signup-5`, `contact-11`,
`cta-9`, `footer-4`.

## Styles

`styles.css` holds every utility the blocks use, prefixed `scraft:`, with no
global reset. It doesn't clash with your Tailwind setup and doesn't restyle
the rest of your app. The blocks read the standard shadcn theme variables
(`--background`, `--primary`, `--radius` and so on) and `--font-sans`.
`theme.css` supplies the shadcncraft Free values. Leave it out to use your
app's theme. Add the `dark` class on a parent for dark mode.

## Links, sections and logos

Give a section an `anchor` and link to it with `"href": "#<anchor>"`. That's
how a one-page site's navigation works (see `examples/pages/product-landing.json`).
TopNavigation5 and Footer4 show `brandName` as a text wordmark, or `logoSrc` as
an image your app serves; with neither they show a placeholder logo.

## Events and state

Buttons and forms emit events you bind to your own actions:

| Block | Event | What it is |
| --- | --- | --- |
| CTA9 | `primary` | The button |
| Pricing8 | `select` | Any plan's button |
| NewsletterSignup5 | `submit` | The sign-up form |
| Contact11 | `submit` | The contact form |
| TopNavigation5 | `action` | The outline button |
| Banner10 | `dismiss` | Close button (optional; the banner hides itself) |

An unbound control renders disabled. Form values and the chosen plan reach
your action through state:

```json
{
  "type": "NewsletterSignup5",
  "props": { "heading": "Get the digest", "email": { "$bindState": "/newsletter/email" } },
  "children": [],
  "on": { "submit": { "action": "subscribe", "params": { "email": { "$state": "/newsletter/email" } } } }
}
```

Contact11 binds `values` (`{ name, email, message, consent }`), and Pricing8
binds `selectedPlan` (the plan's name).

## Check a document

```sh
npx shadcncraft-json-render check page.json --actions subscribe,startTrial
npx shadcncraft-json-render catalog            # list blocks
npx shadcncraft-json-render catalog Pricing8   # one block's props, limits and samples
```

In code, `validateSpec(spec, { actions })` from `@shadcncraft/json-render/validate`
returns `{ ok, errors, warnings, info }`. Each issue has a stable `code`, a
JSON Pointer `path` and a `hint`.

Omitted props render the block's Acme sample content (`samples.json`), and
`check` warns about each one. Copy limits come from `guidance.json`; the
checker warns past `maxChars`.

## For agents

[`skills/shadcncraft-json-render/SKILL.md`](skills/shadcncraft-json-render/SKILL.md)
explains how to choose blocks, compose and edit pages, and verify the result.
`guidance.json` holds per-block guidance, and `schema.json` holds each block's
props as JSON Schema.

## Source

Built from the [shadcncraft Free registry](https://github.com/shadcncraft/shadcncraft-free)
with `pnpm json-render:build`. The blocks are the same components you can
install with `npx shadcn add @shadcncraft/<block>`. Apache-2.0.
