// In-page behaviour checks, serialised and evaluated by layout.mjs.
export async function exercise({ spec }) {
  const frame = () =>
    new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const results = [];
  const check = (name, ok, detail = "") => results.push({ name, ok: !!ok, detail });
  const render = async (doc) => {
    window.__theme(false);
    window.__render(doc);
    await frame();
    await frame();
  };
  const block = (id) => {
    const stack = document.querySelector('#page [data-scraft-layout="stack"]');
    const index = spec.elements.page.children.indexOf(id);
    return stack.children[index];
  };
  const last = () => window.__actions.at(-1);
  const type = (input, value) => {
    const setter = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(input),
      "value"
    ).set;
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  };
  window.__actions = [];
  await render(spec);

  // CTA9 primary
  block("cta-9").querySelector("button").click();
  await wait(50);
  check(
    "CTA9 on.primary",
    last()?.action === "startTrial" && last()?.params?.source === "cta-9",
    JSON.stringify(last())
  );

  // TopNavigation5 action (desktop button)
  const navButtons = [...block("top-navigation-5").querySelectorAll("button")].filter(
    (b) => b.textContent.trim() === "Sign in"
  );
  navButtons.find((b) => b.offsetParent)?.click();
  await wait(50);
  check("TopNavigation5 on.action", last()?.action === "signIn", JSON.stringify(last()));

  // Pricing8 select: second plan
  const planButtons = block("pricing-8").querySelectorAll(
    '[data-slot="card"] button, .scraft\\:mt-auto button, button'
  );
  const growth = [...block("pricing-8").querySelectorAll("button")].filter((b) =>
    /Start trial|Contact sales/.test(b.textContent)
  )[1];
  growth?.click();
  await wait(50);
  check(
    "Pricing8 on.select passes the chosen plan",
    last()?.action === "choosePlan" && last()?.params?.plan === "Growth",
    JSON.stringify(last())
  );
  void planButtons;

  // NewsletterSignup5 submit with bound email
  const news = block("newsletter-signup-5");
  type(news.querySelector("input"), "ada@example.com");
  await frame();
  news.querySelector("button[type=submit]").click();
  await wait(50);
  check(
    "NewsletterSignup5 on.submit passes the email",
    last()?.action === "subscribe" && last()?.params?.email === "ada@example.com",
    JSON.stringify(last())
  );

  // Invalid email does not submit
  const before = window.__actions.length;
  type(news.querySelector("input"), "not-an-email");
  await frame();
  news.querySelector("button[type=submit]").click();
  await wait(50);
  check(
    "NewsletterSignup5 blocks an invalid email",
    window.__actions.length === before,
    `${window.__actions.length - before} actions`
  );

  // Contact11 submit with bound values
  const contact = block("contact-11");
  type(contact.querySelector("#input-1"), "Ada Lovelace");
  type(contact.querySelector("#input-2"), "ada@example.com");
  type(contact.querySelector("#input-3"), "Hello there");
  await frame();
  contact.querySelector('[role="checkbox"]').click();
  await frame();
  contact.querySelector("button[type=submit]").click();
  await wait(50);
  const v = last()?.params?.values ?? {};
  check(
    "Contact11 on.submit passes all values",
    last()?.action === "sendContact" &&
      v.name === "Ada Lovelace" &&
      v.email === "ada@example.com" &&
      v.message === "Hello there" &&
      v.consent === true,
    JSON.stringify(last())
  );

  // FAQs4 accordion opens
  const trigger = block("faqs-4").querySelector("button");
  trigger.click();
  await frame();
  await wait(300);
  const region = block("faqs-4").querySelector('[data-state="open"][role="region"]');
  check(
    "FAQs4 opens an answer",
    region &&
      region.textContent.trim().length > 0 &&
      region.getBoundingClientRect().height > 10,
    region?.textContent?.slice(0, 40) ?? "no open region"
  );

  // Banner10 dismiss: event fires and banner hides
  block("banner-10").querySelector('button[aria-label="Close banner"]').click();
  await wait(50);
  check(
    "Banner10 on.dismiss fires",
    last()?.action === "dismissBanner" && last()?.params?.id === "hourly-forecasts",
    JSON.stringify(last())
  );
  check(
    "Banner10 hides after dismiss",
    !document.querySelector('aside[aria-label="Promotional banner"]')
  );

  // Unbound events render disabled controls
  const unbound = JSON.parse(JSON.stringify(spec));
  for (const id of Object.keys(unbound.elements)) delete unbound.elements[id].on;
  await render(unbound);
  const stack = document.querySelector('#page [data-scraft-layout="stack"]');
  const idx = (id) => spec.elements.page.children.indexOf(id);
  const ctaButton = stack.children[idx("cta-9")].querySelector("button");
  const submit =
    stack.children[idx("newsletter-signup-5")].querySelector("button[type=submit]");
  check("Unbound CTA9 button is disabled", ctaButton.disabled);
  check("Unbound newsletter submit is disabled", submit.disabled);
  return JSON.stringify(results);
}

export async function mobileMenu() {
  const frame = () =>
    new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const nav = document.querySelector('[aria-label="Website top navigation"]');
  const toggle = nav.querySelector('button[aria-label="Open navigation menu"]');
  if (!toggle || !toggle.offsetParent)
    return JSON.stringify({
      name: "TopNavigation5 mobile menu",
      ok: false,
      detail: "no visible menu button at 375px",
    });
  toggle.click();
  await frame();
  await new Promise((r) => setTimeout(r, 400));
  const links = [...nav.querySelectorAll("a")].filter(
    (a) =>
      a.getBoundingClientRect().height > 0 &&
      !a.closest("[inert]") &&
      a.textContent.trim()
  );
  return JSON.stringify({
    name: "TopNavigation5 mobile menu",
    ok: links.length >= 4,
    detail: `${links.length} links visible`,
  });
}

/** Runs after the runner hovers the Pricing8 info icon. */
export async function tooltip() {
  await new Promise((r) => setTimeout(r, 400));
  const tip = document.querySelector('[data-slot="tooltip-content"]');
  const bg = tip && getComputedStyle(tip).backgroundColor;
  return JSON.stringify({
    name: "Pricing8 tooltip renders styled",
    ok: !!tip && bg !== "rgba(0, 0, 0, 0)" && tip.textContent.includes("Daily"),
    detail: `${bg ?? "no tooltip"} ${tip?.textContent ?? ""}`,
  });
}
