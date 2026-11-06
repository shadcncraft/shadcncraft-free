// Builds agent-facing component descriptions from guidance.json.
const list = (items) => items.join("; ");
const range = ([min, max]) => (min === max ? `${min}` : `${min}-${max}`);

function rule(name, value) {
  if ("fields" in value) {
    const fields = Object.entries(value.fields)
      .map(([field, limit]) => `${field} <=${limit.maxChars}`)
      .join(", ");
    return `${name} ${range(value.idealItems)} items (max ${value.maxItems}; ${fields} chars)`;
  }
  return `${name} ${range(value.idealChars)} chars (max ${value.maxChars})`;
}

function behaviour(def, g) {
  const events = def.events ?? [];
  const optional = g.optionalEvents ?? [];
  const notes = [];
  if (events.length) {
    const required = events.filter((event) => !optional.includes(event));
    notes.push(
      `Events: ${events.map((event) => `on.${event}`).join(", ")} bind host-registered actions` +
        (required.length ? `; unbound ${required.map((e) => `on.${e}`).join(", ")} renders disabled.` : ".")
    );
  } else notes.push("No events; links use href props.");
  notes.push(
    "Plain text only; unknown props are rejected; tagline and description accept \"\" to hide the line, other blank strings are rejected; omitted props render the block's Acme sample content (see samples.json), so set every prop the block shows; leaf block with no children."
  );
  return notes.join(" ");
}

export function describe(name, def, guidance) {
  const g = guidance.components[name];
  if (!g) throw new Error(`Missing guidance for ${name}`);
  return [
    g.summary,
    `Layout ${g.layout}; surface ${g.surface}; media ${g.media}${g.position ? `; position ${g.position} of page` : ""}.`,
    `Use for: ${list(g.bestFor)}.`,
    `Avoid when: ${list(g.avoidWhen)}.`,
    `Pairs with ${g.pairsWith.join(", ")}.`,
    ...(g.notes ?? []),
    `Copy lengths: ${Object.entries(g.content).map(([key, value]) => rule(key, value)).join(", ")}.`,
    behaviour(def, g),
  ].join(" ");
}
