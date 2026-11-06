---
name: shadcncraft-json-render
description: Compose or edit JSON Render pages from the installed @shadcncraft/json-render package (shadcncraft Free blocks - navigation, banner, benefits, testimonials, pricing, FAQs, team, newsletter, contact, CTA and footer). Use when building a marketing or landing page as JSON, choosing a block, writing or changing its copy, binding its buttons or forms to actions, or reordering sections.
---

# shadcncraft JSON Render (Free)

Build pages only from the installed blocks plus `Stack`. Do not invent
component types, props or JSX. Every block is a leaf: `"children": []`.

## Sources of truth

Read these instead of guessing; do not copy them into your output.

- `npx shadcncraft-json-render catalog` lists the blocks;
  `npx shadcncraft-json-render catalog <Block>` prints one block's props,
  events, copy limits, samples and guidance.
- [`guidance.json`](../../guidance.json): per block, `layout`, `surface`,
  `position`, `bestFor`, `avoidWhen`, `pairsWith`, `notes` and `content`
  length limits.
- [`examples/`](../../examples/): one document per block, and
  [`examples/pages/`](../../examples/pages/) for composed pages.
- The [README](../../README.md) for host setup.

## Choose blocks

| Need | Block |
| --- | --- |
| Site header with links and one action | TopNavigation5 |
| One-line announcement above the header | Banner10 |
| 3, 6 or 9 benefits with icons | Benefits13 |
| 3 or 6 customer quotes | Testimonials11 |
| 2-4 pricing plans | Pricing8 |
| 4-8 questions and answers | FAQs4 |
| 3-9 people with portraits | Team6 |
| Email sign-up | NewsletterSignup5 |
| Contact form (name, email, message) | Contact11 |
| Closing call to action, one button | CTA9 |
| Site footer with link columns | Footer4 |

Then read that block's `avoidWhen`, `notes` and `content` in `guidance.json`.

## Compose a page

Make a `Stack` the root and put blocks in its `children`, top to bottom, as
in `examples/pages/*.json`. Leave `gap` at its default (`none`): every block
pads its own section.

- Open with `Banner10` (optional) then `TopNavigation5`; close with
  `Footer4`. One of each.
- A landing page usually runs: navigation → Benefits13 → Testimonials11 →
  Pricing8 → FAQs4 → CTA9 → Footer4. Drop sections you have no real content
  for rather than leaving sample copy.
- Never put two panel blocks next to each other (`surface` `inverted-panel`
  or `muted-panel`: CTA9, NewsletterSignup5). Use at most one CTA9.
- Grids are three columns on desktop: give Benefits13, Testimonials11 and
  Team6 3, 6 or 9 items.

## Edit a page

Change the JSON only. Keep element ids, order and `on` bindings unless the
request changes them.

- **Set every visible prop.** An omitted prop renders the block's Acme sample
  (invented people, `#` links, placeholder logo). `check` reports each as
  `sample_content`. To hide an optional line, set it to `""` where the notes
  say so (for example `FAQs4.supportText`, `Pricing8` `period`).
- **Copy length.** Stay within `content` limits: aim for `idealChars`, never
  exceed `maxChars`. Shorten rather than overflow. Text is plain; blank
  strings are rejected.
- **Links** take `href`: `https://…`, `/path`, `#anchor`, `mailto:` or
  `tel:`. Mark the current page in TopNavigation5 with `"active": true`.
- **Images** (`imageSrc`, `logoSrc`) take an HTTP(S) URL or a root-relative
  path. Without one, avatars and portraits show initials.
- **Buttons and forms** emit events: CTA9 `primary`, Pricing8 `select`,
  NewsletterSignup5 and Contact11 `submit`, TopNavigation5 `action`,
  Banner10 `dismiss` (optional). Bind with
  `"on": { "submit": { "action": "<host action>", "params": { … } } }`.
  Unbound controls render disabled.
- **Pass form values and the chosen plan through state.** Bind the value prop
  with `$bindState` and read it in params with `$state`:
  ```json
  "props": { "email": { "$bindState": "/newsletter/email" } },
  "on": { "submit": { "action": "subscribe", "params": { "email": { "$state": "/newsletter/email" } } } }
  ```
  Contact11 binds `values` (`{name, email, message, consent}`); Pricing8
  binds `selectedPlan`. Give the path an initial value in the document's
  `state`.
- The host registers the handlers on `<JSONUIProvider handlers={{ … }}>`.

## Verify

1. Run `npx shadcncraft-json-render check <file.json> --actions <names>`
   (or `validateSpec(spec, { actions })` in code). Fix every error by its
   `path`. Treat warnings as defects unless the request needs them:
   `sample_content`, `text_too_long`, `too_many_items`, `unbound_event`,
   `adjacent_panels`, `multiple_inverted_panels`, `misplaced_block`,
   `duplicate_page_chrome`.
2. Render at 375px and 1280px, light and dark. Look for headings beyond three
   lines on desktop, wrapped button labels and gaps in card grids. Click each
   bound control once.

This is a local package build. Do not claim it is published.
