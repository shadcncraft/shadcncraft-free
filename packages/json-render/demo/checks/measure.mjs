// In-page measurement. Serialised and evaluated in the browser by layout.mjs,
// so it must stay self-contained: no imports, no outer variables.
export async function measure(input) {
  const { spec, set, width, theme } = input;
  const frame = () =>
    new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const switching =
    document.documentElement.classList.contains("dark") !== (theme === "dark");
  window.__theme(theme === "dark");
  window.__render(spec);
  await frame();
  await frame();
  // Colour transitions (transition-colors) run after a theme switch; let them finish.
  if (switching) await new Promise((r) => setTimeout(r, 400));
  await document.fonts.ready;
  const deadline = Date.now() + 8000;
  while ([...document.images].some((i) => !i.complete) && Date.now() < deadline)
    await new Promise((r) => setTimeout(r, 100));
  await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {})));

  const vw = document.documentElement.clientWidth;
  const px = (v) => parseFloat(v) || 0;
  const hiddenByAncestor = (el) =>
    !!el.closest('[aria-hidden="true"], [inert], [hidden]');
  const visible = (el) => {
    if (hiddenByAncestor(el)) return false;
    for (let n = el; n; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.display === "none" || s.visibility === "hidden" || s.opacity === "0")
        return false;
    }
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const ownText = (el) =>
    [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  const short = (t) => t.trim().replace(/\s+/g, " ").slice(0, 40);
  const lineHeight = (el) => {
    const s = getComputedStyle(el);
    return s.lineHeight === "normal" ? px(s.fontSize) * 1.2 : px(s.lineHeight);
  };
  function lines(el) {
    const lh = lineHeight(el);
    const rects = [];
    const words = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.textContent.trim()) continue;
      const range = document.createRange();
      for (const m of node.textContent.matchAll(/\S+/g)) {
        range.setStart(node, m.index);
        range.setEnd(node, m.index + m[0].length);
        const rs = [...range.getClientRects()].filter((r) => r.width > 0.5);
        if (rs.length) words.push(rs[0]);
        rects.push(...rs);
      }
    }
    const rows = [];
    for (const r of rects.sort((a, b) => a.top - b.top)) {
      const mid = (r.top + r.bottom) / 2;
      const row = rows.find((x) => Math.abs(x.mid - mid) < lh / 2);
      if (row) row.count++;
      else rows.push({ mid, count: 1 });
    }
    const last = rows.at(-1);
    const lastWords = last
      ? words.filter((w) => Math.abs((w.top + w.bottom) / 2 - last.mid) < lh / 2).length
      : 0;
    return { lines: rows.length, words: words.length, lastWords };
  }
  const paint = document
    .createElement("canvas")
    .getContext("2d", { willReadFrequently: true });
  const rgba = (c) => {
    paint.clearRect(0, 0, 1, 1);
    paint.fillStyle = "#000";
    paint.fillStyle = c;
    paint.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = paint.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  };
  const lum = ([r, g, b]) => {
    const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  function contrast(el) {
    const layers = [];
    for (let n = el; n; n = n.parentElement) {
      const bg = rgba(getComputedStyle(n).backgroundColor);
      if (bg[3] > 0) layers.push(bg);
      if (bg[3] >= 1) break;
    }
    let base =
      theme === "dark"
        ? rgba(getComputedStyle(document.body).backgroundColor)
        : [255, 255, 255];
    for (const [r, g, b, a] of layers.reverse())
      base = [
        r * a + base[0] * (1 - a),
        g * a + base[1] * (1 - a),
        b * a + base[2] * (1 - a),
      ];
    const [r, g, b, a] = rgba(getComputedStyle(el).color);
    const fg = [
      r * a + base[0] * (1 - a),
      g * a + base[1] * (1 - a),
      b * a + base[2] * (1 - a),
    ];
    const [hi, lo] = [lum(fg), lum(base)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  }

  const stack = document.querySelector('#page [data-scraft-layout="stack"]');
  const roots = [...stack.children].filter((el) => el.getAttribute("role") !== "alert");
  const order = spec.elements.page.children;
  const results = [];
  if (document.documentElement.scrollWidth > vw + 1)
    results.push({
      item: "page",
      problems: [
        `page scrolls horizontally (${document.documentElement.scrollWidth}px > ${vw}px)`,
      ],
      notes: [],
      metrics: {},
    });

  roots.forEach((root, index) => {
    const item = order[index];
    const element = spec.elements[item];
    const problems = [];
    const notes = [];
    const metrics = {};
    const alerts = root.querySelectorAll('[role="alert"]');
    if (alerts.length) problems.push(`renders an alert: ${short(alerts[0].textContent)}`);
    const all = [root, ...root.querySelectorAll("*")].filter(visible);
    const texts = all.filter(ownText);
    for (const el of texts) {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 || r.left < -1)
        problems.push(`text outside viewport: "${short(el.textContent)}"`);
      const s = getComputedStyle(el);
      if (
        s.display !== "inline" &&
        el.scrollWidth > el.clientWidth + 1 &&
        s.overflowX !== "visible"
      )
        problems.push(`text clipped horizontally: "${short(el.textContent)}"`);
      if (
        s.display !== "inline" &&
        el.scrollWidth > el.clientWidth + 1 &&
        s.overflowX === "visible" &&
        el.tagName !== "BUTTON"
      )
        problems.push(`text wider than its box: "${short(el.textContent)}"`);
      for (let p = el.parentElement; p && p !== root.parentElement; p = p.parentElement) {
        const ps = getComputedStyle(p);
        if (ps.overflow === "visible") continue;
        const pr = p.getBoundingClientRect();
        if (r.bottom > pr.bottom + 1 || r.right > pr.right + 1) {
          problems.push(
            `text clipped by <${p.tagName.toLowerCase()}>: "${short(el.textContent)}"`
          );
          break;
        }
      }
      const ratio = contrast(el);
      if (ratio < 3)
        problems.push(`contrast ${ratio.toFixed(2)}:1 for "${short(el.textContent)}"`);
      else if (ratio < 4.5 && px(s.fontSize) < 18.66)
        notes.push(
          `contrast ${ratio.toFixed(2)}:1 (below AA for small text) for "${short(el.textContent)}"`
        );
    }
    // Empty text elements still taking space.
    for (const el of all.filter((e) =>
      ["P", "H2", "H3", "SPAN", "BLOCKQUOTE", "LI"].includes(e.tagName)
    )) {
      if (
        !el.textContent.trim() &&
        !el.querySelector("svg, img, input, button") &&
        el.getBoundingClientRect().height > 0
      )
        problems.push(
          `empty <${el.tagName.toLowerCase()}> takes ${Math.round(el.getBoundingClientRect().height)}px`
        );
    }
    // Headings: expected text, line count and orphans.
    const heading = root.querySelector("h2");
    if (heading && visible(heading)) {
      const l = lines(heading);
      metrics.headingLines = l.lines;
      metrics.headingChars = heading.textContent.trim().length;
      if (
        typeof element.props.heading === "string" &&
        heading.textContent.trim() !== element.props.heading.trim()
      )
        problems.push(
          `heading shows "${short(heading.textContent)}", expected "${short(element.props.heading)}"`
        );
      if (l.lines >= 2 && l.words >= 4 && l.lastWords === 1)
        problems.push(`heading ends with an orphaned word (${l.lines} lines)`);
      if (set === "long" && width >= 1280 && l.lines > 3)
        problems.push(`heading at max length takes ${l.lines} lines at ${width}px`);
      if (set === "long" && width < 768 && l.lines > 6)
        problems.push(`heading at max length takes ${l.lines} lines at ${width}px`);
    }
    // Buttons and links styled as buttons: one line, label inside.
    for (const button of all.filter(
      (e) => e.tagName === "BUTTON" && e.textContent.trim()
    )) {
      const label = lines(button);
      if (
        label.lines > 1 &&
        !button.closest('[data-slot="accordion-trigger"], [data-slot="accordion-item"]')
      )
        problems.push(
          `button label wraps to ${label.lines} lines: "${short(button.textContent)}"`
        );
      if (button.scrollWidth > button.clientWidth + 1)
        problems.push(`button label overflows: "${short(button.textContent)}"`);
    }
    // Card grids: items in a row share a height.
    const isCard = (c) => {
      const s = getComputedStyle(c);
      return px(s.borderTopWidth) > 0 || rgba(s.backgroundColor)[3] > 0;
    };
    for (const grid of all.filter(
      (e) => getComputedStyle(e).display === "grid" && e.children.length > 1
    )) {
      const cards = [...grid.children].filter(visible);
      if (!cards.every(isCard)) continue;
      const cells = cards.map((c) => c.getBoundingClientRect());
      const rows = new Map();
      for (const c of cells)
        rows.set(Math.round(c.top), [...(rows.get(Math.round(c.top)) ?? []), c.height]);
      for (const heights of rows.values())
        if (heights.length > 1 && Math.max(...heights) - Math.min(...heights) > 1)
          problems.push(
            `grid row heights differ: ${heights.map(Math.round).join("/")}px`
          );
    }
    metrics.height = Math.round(root.getBoundingClientRect().height);
    results.push({
      item,
      type: element.type,
      problems: [...new Set(problems)],
      notes: [...new Set(notes)],
      metrics,
    });
  });
  return JSON.stringify(results);
}
