// Content sets for the layout checks, generated from the installed package's
// examples and guidance.json, so limits and checks never drift apart.
const words =
  "teams ship faster with clear priorities honest forecasts fewer meetings and shared context across every project plan review launch and retrospective".split(
    " "
  );

/** Readable filler text of exactly `length` characters (ends on a word). */
export function text(length, seed = 0) {
  let out = "";
  for (let i = seed; out.length < length; i++)
    out += (out ? " " : "") + words[i % words.length];
  out = out.slice(0, length).trimEnd();
  return out.charAt(0).toUpperCase() + out.slice(1);
}

const clone = (value) => JSON.parse(JSON.stringify(value));
// Optional lines that accept "" to hide them, per block.
const hideable = {
  Banner10: { highlight: "", linkLabel: "" },
  Benefits13: { tagline: "", description: "" },
  Testimonials11: { tagline: "", description: "" },
  Pricing8: { tagline: "", description: "" },
  FAQs4: { tagline: "", supportText: "", supportLinkLabel: "" },
  Team6: { tagline: "", description: "" },
  NewsletterSignup5: { description: "", privacyNote: "" },
  Contact11: { tagline: "", description: "", consentText: "", privacyLabel: "" },
  CTA9: { description: "" },
  Footer4: { description: "", social: [] },
  TopNavigation5: { actionLabel: "" },
};

function sized(props, rules, pick) {
  const next = clone(props);
  for (const [key, rule] of Object.entries(rules)) {
    if (rule.fields) {
      const template = (Array.isArray(next[key]) && next[key][0]) || {};
      const count = pick === "max" ? rule.maxItems : 1;
      next[key] = Array.from({ length: count }, (_, i) => {
        const item = clone(template);
        for (const [field, limit] of Object.entries(rule.fields))
          if (field in item || pick === "max")
            item[field] = text(
              pick === "max" ? limit.maxChars : Math.max(3, limit.idealChars[0]),
              i * 3
            );
        return item;
      });
    } else if (typeof next[key] === "string" || key in next) {
      next[key] = text(
        pick === "max" ? rule.maxChars : Math.max(3, rule.idealChars[0]),
        key.length
      );
    }
  }
  return next;
}

/** One document per set: a Stack of every block's example, with props adjusted. */
export function buildSets(examples, guidance) {
  const blocks = Object.entries(examples).map(([item, spec]) => ({
    item,
    element: spec.elements[spec.root],
    state: spec.state ?? {},
  }));
  const state = Object.assign({}, ...blocks.map((b) => b.state));
  const make = (adjust) => ({
    root: "page",
    state: clone(state),
    elements: {
      page: { type: "Stack", props: {}, children: blocks.map((b) => b.item) },
      ...Object.fromEntries(
        blocks.map(({ item, element }) => {
          const props = adjust(element.type, clone(element.props));
          return [item, { ...clone(element), props }];
        })
      ),
    },
  });
  const rules = (type) => guidance.components[type].content;
  return {
    example: make((_, props) => props),
    short: make((type, props) => sized(props, rules(type), "min")),
    long: make((type, props) => sized(props, rules(type), "max")),
    hidden: make((type, props) => ({ ...props, ...clone(hideable[type] ?? {}) })),
    unbroken: make((type, props) =>
      "heading" in props
        ? { ...props, heading: "Supercalifragilisticexpialidocious internationalisation" }
        : props
    ),
  };
}
