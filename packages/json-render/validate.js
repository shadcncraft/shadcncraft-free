import { VisibilityConditionStrictSchema } from "@json-render/core";
import { z } from "zod";

// Composition and editing guidance (guidance.json, mirrored as a module in data/).
import packageGuidance from "./data/guidance.js";
import { layoutDefinitions } from "./layout-catalog.js";
import { componentDefinitions as blockDefinitions } from "./modules/catalog.js";

/** The package's guidance.json, or null when it is not installed. */
export const guidance = packageGuidance;

// What each block renders when a prop is omitted (samples.json, extracted from the components).
import packageSamples from "./data/samples.js";
/** The package's samples.json, or null when it is not installed. */
export const samples = packageSamples;

const sampleHints = {
  testimonials: () => "Set real customer quotes; the sample shows six invented people.",
  members: () => "Set your real team; the sample shows six invented people with stock portraits.",
  plans: () => "Set your real plans and prices; the sample prices are placeholders.",
  items: () => "Set your real questions and answers.",
  benefits: () => "Set 3-6 real benefits.",
  columns: () => "Set your real footer links; the sample links all point to #.",
  links: () => "Set your real navigation links; the sample links all point to #.",
  copyright: () => "Set your own copyright line.",
  logoSrc: () => "Set your logo; without it the block shows the Acme placeholder logo.",
};

/** Every component the package can render: the twelve blocks plus layout nodes. */
export const definitions = { ...blockDefinitions, ...layoutDefinitions };

const builtInActions = ["setState", "pushState", "removeState", "validateForm"];
const elementFields = ["type", "props", "children", "slots", "visible", "on", "repeat", "watch"];
const specFields = ["root", "elements", "state"];
const elementLevelFields = ["visible", "on", "repeat", "watch"];
const expressionKeys = ["$state", "$item", "$index", "$bindState", "$bindItem", "$cond", "$computed", "$template"];

/** Events a component emits, as declared by its definition. */
export function eventsFor(type, definition = definitions[type]) {
  return Array.isArray(definition?.events) ? [...definition.events] : [];
}

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isExpression = (value) => isObject(value) && expressionKeys.some((key) => key in value);
const hasExpression = (value) =>
  isExpression(value) ||
  (Array.isArray(value) ? value.some(hasExpression) : isObject(value) && Object.values(value).some(hasExpression));
const pointer = (...parts) => "/" + parts.map((p) => String(p).replaceAll("~", "~0").replaceAll("/", "~1")).join("/");
const quote = (value) => JSON.stringify(value);
const list = (values) => values.map((v) => quote(v)).join(", ");

function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length];
}

/** Closest candidates by normalized edit distance, best first. */
function closest(name, candidates, limit = 3) {
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
  const target = norm(name);
  const exact = candidates.filter((candidate) => norm(candidate) === target);
  if (exact.length) return exact.slice(0, limit);
  return candidates
    .map((candidate) => {
      const other = norm(candidate);
      let score = distance(target, other);
      if (other.startsWith(target) || target.startsWith(other)) score = Math.min(score, 1);
      return { candidate, score, limit: Math.max(2, Math.floor(Math.max(target.length, other.length) / 3)) };
    })
    .filter((entry) => entry.score <= entry.limit)
    .sort((a, b) => a.score - b.score || a.candidate.localeCompare(b.candidate))
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

const didYouMean = (name, candidates) => {
  const found = closest(name, candidates);
  return found.length ? `Did you mean ${found.map(quote).join(" or ")}? ` : "";
};

function summarizeSchema(schema) {
  if (!schema || typeof schema !== "object") return "any value";
  if (schema.anyOf) return [...new Set(schema.anyOf.map(summarizeSchema))].join(" or ");
  if (schema.enum) return "one of " + list(schema.enum);
  if (schema.type === "array") {
    const bounds = [schema.minItems != null && `min ${schema.minItems}`, schema.maxItems != null && `max ${schema.maxItems}`].filter(Boolean);
    return `array of ${summarizeSchema(schema.items)}${bounds.length ? ` (${bounds.join(", ")})` : ""}`;
  }
  if (schema.type === "string" && schema.format === "uri") return "an absolute URL";
  if (schema.type === "string" && schema.pattern?.startsWith("^\\/")) return "a root-relative path like /images/a.png";
  if (schema.type === "string") return schema.minLength ? "non-blank string" : "string";
  if (schema.type === "number" || schema.type === "integer") {
    const range = schema.minimum != null && schema.maximum != null ? ` ${schema.minimum}–${schema.maximum}` : "";
    return `${schema.type}${range}`;
  }
  return schema.type ?? "value";
}

function propSchemas(definition) {
  try {
    return z.toJSONSchema(definition.props, { io: "input", unrepresentable: "any" }).properties ?? {};
  } catch {
    return {};
  }
}

function propNames(definition) {
  const shape = definition?.props?.shape;
  return shape && typeof shape === "object" ? Object.keys(shape) : Object.keys(propSchemas(definition));
}

function componentList(names) {
  return names.join(", ");
}

/**
 * Validate a JSON Render document against the shadcncraft catalog.
 *
 * @param {unknown} spec The document: { root, elements, state? }.
 * @param {object} [options]
 * @param {Record<string, object>} [options.components] Extra host definitions, merged over the package's.
 * @param {string[] | Record<string, { params?: import("zod").ZodType }>} [options.actions]
 *   Actions the host registers. When given, bindings to other actions are errors and params are checked.
 * @param {object | null | false} [options.guidance] Guidance to lint content with; defaults to the package's guidance.json. false disables content lint.
 */
export function validateSpec(spec, options = {}) {
  const known = { ...definitions, ...(options.components ?? {}) };
  const knownNames = Object.keys(known);
  const actionSchemas = Array.isArray(options.actions)
    ? Object.fromEntries(options.actions.map((name) => [name, {}]))
    : isObject(options.actions)
      ? options.actions
      : null;
  const actionNames = actionSchemas ? [...Object.keys(actionSchemas), ...builtInActions] : null;
  const lint = options.guidance === false ? null : (options.guidance ?? guidance);
  const sampleData = options.samples === false ? null : (options.samples ?? samples);

  const errors = [];
  const warnings = [];
  const info = [];
  const add = (severity, code, elementId, path, message, hint = "") => {
    const issue = { severity, code, elementId: elementId ?? null, path, message, hint };
    (severity === "error" ? errors : severity === "warning" ? warnings : info).push(issue);
  };
  const result = () => ({ ok: errors.length === 0, errors, warnings, info });

  // Document shape
  if (!isObject(spec)) {
    add("error", "invalid_document", null, "", "The document must be a JSON object with \"root\" and \"elements\".", 'Use {"root": "page", "elements": {"page": {"type": "Stack", "props": {}, "children": []}}}.');
    return result();
  }
  for (const key of Object.keys(spec)) {
    if (!specFields.includes(key)) {
      add("error", "unknown_field", null, pointer(key), `Unknown top-level field ${quote(key)}.`, `${didYouMean(key, specFields)}A document has only root, elements and optional state.`);
    }
  }
  if (!isObject(spec.elements)) {
    add("error", "invalid_document", null, "/elements", '"elements" must be an object mapping element ids to elements.', 'Use "elements": {"page": {"type": "Stack", "props": {}, "children": []}}.');
    return result();
  }
  const elements = spec.elements;
  const ids = Object.keys(elements);
  if (spec.root === undefined || spec.root === "") {
    add("error", "missing_root", null, "/root", 'The document has no "root".', ids.length ? `Set "root" to the top element id, e.g. ${quote(ids[0])}.` : 'Set "root" to the id of the top element.');
  } else if (typeof spec.root !== "string") {
    add("error", "invalid_document", null, "/root", '"root" must be an element id string.', ids.length ? `Use ${quote(ids[0])}.` : "");
  } else if (!Object.hasOwn(elements, spec.root)) {
    add("error", "root_not_found", spec.root, "/root", `Root ${quote(spec.root)} is not an element in "elements".`, `${didYouMean(spec.root, ids)}Add the element or point "root" at an existing id.`);
  }
  if (ids.length === 0) {
    add("error", "empty_document", null, "/elements", "The document has no elements.", "Add at least one block.");
    return result();
  }

  // References: child id -> list of { parent, path }
  const references = new Map();
  const childLists = new Map();

  for (const id of ids) {
    const element = elements[id];
    const base = pointer("elements", id);
    if (!isObject(element)) {
      add("error", "invalid_element", id, base, `Element ${quote(id)} must be an object.`, 'Use {"type": "…", "props": {}, "children": []}.');
      continue;
    }
    for (const key of Object.keys(element)) {
      if (!elementFields.includes(key)) {
        add("error", "unknown_field", id, pointer("elements", id, key), `Element ${quote(id)} has unknown field ${quote(key)}.`, `${didYouMean(key, elementFields)}Element fields: ${elementFields.join(", ")}. Content goes in props.`);
      }
    }

    const type = element.type;
    const definition = typeof type === "string" && Object.hasOwn(known, type) ? known[type] : null;
    if (typeof type !== "string" || type === "") {
      add("error", "invalid_element", id, pointer("elements", id, "type"), `Element ${quote(id)} needs a "type".`, `Use one of: ${componentList(knownNames)}.`);
    } else if (!definition) {
      add("error", "unknown_component", id, pointer("elements", id, "type"), `Unknown component ${quote(type)}.`, `${didYouMean(type, knownNames)}Available: ${componentList(knownNames)}.`);
    }

    // Children and slots
    const children = element.children;
    const ownChildren = [];
    if (children === undefined) {
      add("error", "invalid_element", id, pointer("elements", id), `Element ${quote(id)} is missing "children".`, 'Every element needs a "children" array; leaf blocks use "children": [].');
    } else if (!Array.isArray(children) || children.some((child) => typeof child !== "string")) {
      add("error", "invalid_element", id, pointer("elements", id, "children"), `"children" of ${quote(id)} must be an array of element ids.`, 'Use "children": ["cta", "testimonial"] or [].');
    } else {
      children.forEach((child, index) => ownChildren.push({ child, path: pointer("elements", id, "children", index) }));
    }
    if (element.slots !== undefined) {
      if (!isObject(element.slots)) {
        add("error", "invalid_element", id, pointer("elements", id, "slots"), `"slots" of ${quote(id)} must map slot names to element id arrays.`, "Use children for the default slot.");
      } else {
        for (const [slot, slotChildren] of Object.entries(element.slots)) {
          const slotPath = pointer("elements", id, "slots", slot);
          if (slot === "default") {
            add("error", "invalid_slot", id, slotPath, `Use "children" instead of slots.default on ${quote(id)}.`, 'Move these ids into "children".');
          } else if (definition && !definition.slots.includes(slot)) {
            add("error", "unknown_slot", id, slotPath, `${type} has no slot ${quote(slot)}.`, definition.slots.length ? `Slots: ${definition.slots.join(", ")}; use "children" for default.` : `${type} is a leaf block and takes no children.`);
          }
          if (!Array.isArray(slotChildren) || slotChildren.some((child) => typeof child !== "string")) {
            add("error", "invalid_element", id, slotPath, `Slot ${quote(slot)} of ${quote(id)} must be an array of element ids.`, "");
          } else {
            slotChildren.forEach((child, index) => ownChildren.push({ child, path: pointer("elements", id, "slots", slot, index) }));
          }
        }
      }
    }
    if (definition && definition.slots.length === 0 && ownChildren.length) {
      add("error", "children_on_leaf", id, ownChildren[0].path, `${type} is a leaf block and cannot have children (found ${list(ownChildren.map((c) => c.child))}).`, `Set "children": [] on ${quote(id)} and list the blocks in order in a Stack: {"type": "Stack", "props": {}, "children": [${list([id, ...ownChildren.map((c) => c.child)])}]}.`);
    }
    childLists.set(id, ownChildren);
    for (const { child, path } of ownChildren) {
      if (!Object.hasOwn(elements, child)) {
        add("error", "missing_child", id, path, `${quote(id)} references child ${quote(child)}, which is not in "elements".`, `${didYouMean(child, ids)}Add the element or remove the reference.`);
        continue;
      }
      const seen = references.get(child) ?? [];
      seen.push({ parent: id, path });
      references.set(child, seen);
    }

    // Visibility
    if (element.visible !== undefined && !VisibilityConditionStrictSchema.safeParse(element.visible).success) {
      add("error", "invalid_visible", id, pointer("elements", id, "visible"), `Invalid "visible" condition on ${quote(id)}.`, 'Use true, false, {"$state": "/path", "eq": value}, or {"$and": [...]}/{"$or": [...]}.');
    }

    // Props
    let props = element.props;
    if (props === undefined) {
      add("error", "invalid_element", id, pointer("elements", id), `Element ${quote(id)} is missing "props".`, 'Add "props": {}; omitted fields keep the block\'s canonical content.');
      props = null;
    } else if (!isObject(props)) {
      add("error", "invalid_element", id, pointer("elements", id, "props"), `"props" of ${quote(id)} must be an object.`, 'Use "props": {}.');
      props = null;
    }
    let staticProps = null;
    const invalidProps = new Set();
    if (props && definition) {
      staticProps = {};
      for (const [key, value] of Object.entries(props)) {
        if (elementLevelFields.includes(key)) {
          add("error", "misplaced_field", id, pointer("elements", id, "props", key), `${quote(key)} is inside props of ${quote(id)}.`, `Move ${quote(key)} up to the element, beside "type" and "props".`);
        } else if (hasExpression(value)) {
          add("info", "dynamic_prop", id, pointer("elements", id, "props", key), `${type}.${key} is a dynamic expression; its resolved value is not checked here.`, "");
        } else {
          staticProps[key] = value;
        }
      }
      const parsed = definition.props.safeParse(staticProps);
      if (!parsed.success) {
        const names = propNames(definition);
        const schemas = propSchemas(definition);
        for (const issue of parsed.error.issues) {
          if (issue.code === "unrecognized_keys") {
            for (const key of issue.keys) {
              add("error", "unknown_prop", id, pointer("elements", id, "props", ...issue.path, key), `${type} has no prop ${quote(key)}.`, `${didYouMean(key, names)}Props: ${names.join(", ") || "none"}.`);
            }
            continue;
          }
          const [top] = issue.path;
          invalidProps.add(top);
          const where = [type, ...issue.path].join(".");
          add("error", "invalid_prop", id, pointer("elements", id, "props", ...issue.path), `${where}: ${issue.message}`, top !== undefined && schemas[top] ? `Expected ${summarizeSchema(schemas[top])}.${schemas[top].minLength ? " Blank text is invalid; omit the prop to keep the default." : ""}` : "");
        }
      }
    }

    // Events and actions
    if (definition) {
      const events = eventsFor(type, definition);
      const bound = new Set();
      if (element.on !== undefined) {
        if (!isObject(element.on)) {
          add("error", "invalid_binding", id, pointer("elements", id, "on"), `"on" of ${quote(id)} must map event names to action bindings.`, 'Use "on": {"primary": {"action": "name", "params": {}}}.');
        } else {
          for (const [event, binding] of Object.entries(element.on)) {
            const eventPath = pointer("elements", id, "on", event);
            if (!events.includes(event)) {
              add("error", "unknown_event", id, eventPath, `${type} does not emit ${quote(event)}.`, events.length ? `${didYouMean(event, events)}Events: ${events.join(", ")}.` : `${type} emits no events; remove "on".`);
              continue;
            }
            bound.add(event);
            const bindings = Array.isArray(binding) ? binding : [binding];
            bindings.forEach((item, index) => {
              const itemPath = Array.isArray(binding) ? pointer("elements", id, "on", event, index) : eventPath;
              if (!isObject(item) || typeof item.action !== "string" || item.action === "") {
                add("error", "invalid_binding", id, itemPath, `Binding for ${type} on.${event} needs an "action" name.`, 'Use {"action": "name", "params": {}}.');
                return;
              }
              if (!actionNames) return;
              if (!actionNames.includes(item.action)) {
                add("error", "unknown_action", id, itemPath + "/action", `Action ${quote(item.action)} is not registered by the host.`, `${didYouMean(item.action, actionNames)}Registered: ${Object.keys(actionSchemas).join(", ") || "none"}.`);
                return;
              }
              const params = actionSchemas[item.action]?.params;
              if (params && typeof params.safeParse === "function" && !hasExpression(item.params)) {
                const checked = params.safeParse(item.params ?? {});
                if (!checked.success) {
                  for (const issue of checked.error.issues) {
                    add("error", "invalid_action_params", id, [itemPath, "params", ...issue.path].join("/"), `${item.action} params${issue.path.length ? "." + issue.path.join(".") : ""}: ${issue.message}`, `Check the params the host declares for ${quote(item.action)}.`);
                  }
                }
              }
            });
          }
        }
      }
      const optional = lint?.components?.[type]?.optionalEvents ?? [];
      for (const event of events) {
        if (!bound.has(event) && !optional.includes(event)) {
          const registered = actionSchemas ? Object.keys(actionSchemas) : [];
          add("warning", "unbound_event", id, pointer("elements", id, "on", event), `${type} on.${event} is not bound; its control renders disabled.`, `Bind it: "on": {${quote(event)}: {"action": ${quote(registered[0] ?? "yourAction")}, "params": {}}}, or leave it disabled on purpose.`);
        }
      }
    }

    // Content guidance
    const rules = lint?.components?.[type]?.content;
    if (staticProps && isObject(rules)) {
      for (const [prop, rule] of Object.entries(rules)) {
        if (invalidProps.has(prop)) continue;
        const value = staticProps[prop];
        const path = pointer("elements", id, "props", prop);
        if (!isObject(rule)) continue;
        if (typeof value === "string") {
          const length = value.trim().length;
          const ideal = Array.isArray(rule.idealChars) ? rule.idealChars : null;
          const idealText = ideal ? ` Aim for ${ideal[0]}–${ideal[1]}.` : "";
          if (typeof rule.maxChars === "number" && length > rule.maxChars) {
            add("warning", "text_too_long", id, path, `${type}.${prop} is ${length} characters; the limit is ${rule.maxChars}.`, `Shorten it.${idealText}`);
          } else if (ideal && (length < ideal[0] || length > ideal[1])) {
            add("info", "text_length", id, path, `${type}.${prop} is ${length} characters; ideal is ${ideal[0]}–${ideal[1]}.`, "");
          }
        } else if (Array.isArray(value)) {
          const ideal = Array.isArray(rule.idealItems) ? rule.idealItems : null;
          if (typeof rule.maxItems === "number" && value.length > rule.maxItems) {
            add("warning", "too_many_items", id, path, `${type}.${prop} has ${value.length} items; the limit is ${rule.maxItems}.`, ideal ? `Keep ${ideal[0]}–${ideal[1]} items.` : "Remove items.");
          } else if (ideal && (value.length < ideal[0] || value.length > ideal[1])) {
            add("info", "item_count", id, path, `${type}.${prop} has ${value.length} items; ideal is ${ideal[0]}–${ideal[1]}.`, "");
          }
          if (typeof rule.itemMaxChars === "number") {
            value.forEach((item, index) => {
              if (typeof item === "string" && item.trim().length > rule.itemMaxChars) {
                add("warning", "item_too_long", id, pointer("elements", id, "props", prop, index), `${type}.${prop}[${index}] is ${item.trim().length} characters; the limit is ${rule.itemMaxChars}.`, "Shorten the item.");
              }
            });
          }
          // Lists of objects: per-field limits, e.g. testimonials[].quote.
          if (isObject(rule.fields)) {
            value.forEach((item, index) => {
              if (!isObject(item)) return;
              for (const [field, fieldRule] of Object.entries(rule.fields)) {
                const text = item[field];
                if (typeof text !== "string" || !isObject(fieldRule)) continue;
                const length = text.trim().length;
                const fieldPath = pointer("elements", id, "props", prop, index, field);
                const ideal = Array.isArray(fieldRule.idealChars) ? fieldRule.idealChars : null;
                if (typeof fieldRule.maxChars === "number" && length > fieldRule.maxChars) {
                  add("warning", "text_too_long", id, fieldPath, `${type}.${prop}[${index}].${field} is ${length} characters; the limit is ${fieldRule.maxChars}.`, `Shorten it.${ideal ? ` Aim for ${ideal[0]}–${ideal[1]}.` : ""}`);
                } else if (ideal && (length < ideal[0] || length > ideal[1])) {
                  add("info", "text_length", id, fieldPath, `${type}.${prop}[${index}].${field} is ${length} characters; ideal is ${ideal[0]}–${ideal[1]}.`, "");
                }
              }
            });
          }
        }
      }
    }

    // Omitted props render sample content from the original components.
    const blockSamples = isObject(sampleData?.components) ? sampleData.components[type] : null;
    if (props && isObject(blockSamples)) {
      for (const [prop, sample] of Object.entries(blockSamples)) {
        if (Object.hasOwn(props, prop)) continue;
        // A link target is irrelevant when its label is set to "" (the link is hidden).
        const controller = lint?.components?.[type]?.sampleIf?.[prop];
        if (controller && props[controller] === "") continue;
        const hint = (sampleHints[prop] ?? (() => "Set real copy for it."))(type);
        add("warning", "sample_content", id, pointer("elements", id, "props", prop), `${type}.${prop} is not set, so it renders the sample ${quote(sample)}.`, hint);
      }
    }
  }

  // Graph: duplicate parents, cycles, orphans
  for (const [child, parents] of references) {
    if (parents.length > 1) {
      const [first, ...rest] = parents;
      for (const extra of rest) {
        add("error", "duplicate_parent", extra.parent, extra.path, `${quote(child)} is already a child of ${quote(first.parent)}; an element can have only one parent.`, `Remove this reference, or copy the element under a new id.`);
      }
    }
  }
  const state = new Map();
  const reported = new Set();
  for (const start of ids) {
    if (state.has(start)) continue;
    const stack = [{ id: start, index: 0 }];
    const trail = [start];
    state.set(start, "open");
    while (stack.length) {
      const frame = stack[stack.length - 1];
      const edges = childLists.get(frame.id) ?? [];
      if (frame.index >= edges.length) {
        state.set(frame.id, "done");
        stack.pop();
        trail.pop();
        continue;
      }
      const { child, path } = edges[frame.index++];
      if (!Object.hasOwn(elements, child)) continue;
      if (state.get(child) === "open") {
        const loop = [...trail.slice(trail.indexOf(child)), child];
        const key = [...new Set(loop)].sort().join("\u0000");
        if (!reported.has(key)) {
          reported.add(key);
          add("error", "cycle", frame.id, path, `Children form a cycle: ${loop.join(" → ")}.`, `Remove ${quote(child)} from ${quote(frame.id)}'s children.`);
        }
      } else if (!state.has(child)) {
        state.set(child, "open");
        stack.push({ id: child, index: 0 });
        trail.push(child);
      }
    }
  }
  if (typeof spec.root === "string" && Object.hasOwn(elements, spec.root)) {
    const reachable = new Set([spec.root]);
    const queue = [spec.root];
    while (queue.length) {
      for (const { child } of childLists.get(queue.shift()) ?? []) {
        if (Object.hasOwn(elements, child) && !reachable.has(child)) {
          reachable.add(child);
          queue.push(child);
        }
      }
    }
    for (const id of ids) {
      if (!reachable.has(id)) {
        add("warning", "orphaned_element", id, pointer("elements", id), `${quote(id)} is not reachable from root ${quote(spec.root)} and will not render.`, `Add ${quote(id)} to a Stack's children, or delete it.`);
      }
    }
  }

  // Composition guidance: rhythm between sibling blocks (see guidance.json layout/surface).
  if (lint?.components) {
    const traits = (id) => {
      const type = isObject(elements[id]) ? elements[id].type : null;
      const g = typeof type === "string" ? lint.components[type] : null;
      return g ? { type, layout: g.layout, surface: g.surface } : null;
    };
    const panels = ["inverted-panel", "muted-panel"];
    const inverted = [];
    for (const [parent, edges] of childLists) {
      const siblings = edges.filter(({ child }) => Object.hasOwn(elements, child));
      siblings.forEach(({ child, path }, index) => {
        const current = traits(child);
        if (current?.surface === "inverted-panel") inverted.push({ child, path });
        const previous = index > 0 ? traits(siblings[index - 1].child) : null;
        if (!current || !previous) return;
        const before = siblings[index - 1].child;
        if (panels.includes(current.surface) && panels.includes(previous.surface)) {
          add("warning", "adjacent_panels", child, path, `${quote(before)} (${previous.type}) and ${quote(child)} (${current.type}) are both panel blocks next to each other in ${quote(parent)}.`, "Put a plain-surface block between them (e.g. Benefits13, Testimonials11 or FAQs4).");
        }
        if (current.layout === "split-media" && previous.layout === "split-media") {
          add("warning", "adjacent_split_media", child, path, `${quote(before)} (${previous.type}) and ${quote(child)} (${current.type}) are both split-media blocks next to each other in ${quote(parent)}.`, "Alternate with a centered block.");
        }
      });
    }
    for (const extra of inverted.slice(1)) {
      add("warning", "multiple_inverted_panels", extra.child, extra.path, `${quote(extra.child)} is a second inverted panel on the page; ${quote(inverted[0].child)} is the first.`, "Keep one inverted panel, usually the closing CTA9.");
    }
    // Content checks that span props: grids, logos, anchors and links.
    const anchors = new Map();
    const links = [];
    const collectLinks = (value, id, parts) => {
      if (Array.isArray(value)) value.forEach((item, index) => collectLinks(item, id, [...parts, index]));
      else if (isObject(value) && !isExpression(value))
        for (const [key, inner] of Object.entries(value)) {
          if (typeof inner === "string" && /href$/i.test(key)) links.push({ id, href: inner, path: pointer("elements", id, "props", ...parts, key) });
          else collectLinks(inner, id, [...parts, key]);
        }
    };
    for (const id of ids) {
      const element = elements[id];
      if (!isObject(element) || !isObject(element.props)) continue;
      const g = lint.components[element.type];
      const props = element.props;
      if (typeof props.anchor === "string") {
        if (anchors.has(props.anchor)) add("warning", "duplicate_anchor", id, pointer("elements", id, "props", "anchor"), `Anchor ${quote(props.anchor)} is already used by ${quote(anchors.get(props.anchor))}.`, "Give each section a unique anchor.");
        else anchors.set(props.anchor, id);
      }
      collectLinks(props, id, []);
      if (g?.grid && Array.isArray(props[g.grid.prop]) && props[g.grid.prop].length % g.grid.columns !== 0) {
        const count = props[g.grid.prop].length;
        add("warning", "uneven_grid", id, pointer("elements", id, "props", g.grid.prop), `${element.type}.${g.grid.prop} has ${count} items, so the ${g.grid.columns}-column desktop grid has an empty space.`, `Use a multiple of ${g.grid.columns} (${g.grid.columns}, ${g.grid.columns * 2} or ${g.grid.columns * 3}).`);
      }
      if (Array.isArray(g?.logo) && !g.logo.some((key) => Object.hasOwn(props, key))) {
        add("warning", "placeholder_logo", id, pointer("elements", id, "props"), `${element.type} has no ${g.logo.join(" or ")}, so it shows the Acme placeholder logo.`, `Set ${g.logo.map((key) => quote(key)).join(" (an image your app serves) or ")} (a text wordmark).`);
      }
    }
    for (const link of links) {
      if (link.href === "#") add("warning", "placeholder_link", link.id, link.path, `${quote(link.id)} has a placeholder link "#".`, "Set the real URL, a /path or a #section anchor.");
      else if (link.href.startsWith("#") && !anchors.has(link.href.slice(1))) add("warning", "broken_anchor", link.id, link.path, `No section on this page has anchor ${quote(link.href.slice(1))}.`, anchors.size ? `Anchors on this page: ${[...anchors.keys()].join(", ")}. Or set "anchor": ${quote(link.href.slice(1))} on the target section.` : `Set "anchor": ${quote(link.href.slice(1))} on the target section.`);
    }

    // Page chrome: navigation and banners open the page, the footer closes it.
    const page = typeof spec.root === "string" ? (childLists.get(spec.root) ?? []).filter(({ child }) => Object.hasOwn(elements, child)) : [];
    const seen = new Map();
    page.forEach(({ child, path }, index) => {
      const type = isObject(elements[child]) ? elements[child].type : null;
      const position = typeof type === "string" ? lint.components[type]?.position : null;
      if (!position) return;
      if (seen.has(type)) {
        add("warning", "duplicate_page_chrome", child, path, `${quote(child)} is a second ${type} on the page; ${quote(seen.get(type))} is the first.`, `Keep one ${type}.`);
      } else seen.set(type, child);
      const before = page.slice(0, index).map(({ child: id }) => lint.components[elements[id]?.type]?.position);
      if (position === "top" && before.some((p) => p !== "top")) {
        add("warning", "misplaced_block", child, path, `${type} should open the page, but ${quote(child)} comes after page content.`, `Move ${quote(child)} to the start of ${quote(spec.root)}'s children.`);
      }
      if (position === "bottom" && index !== page.length - 1) {
        add("warning", "misplaced_block", child, path, `${type} should close the page, but ${quote(child)} is followed by other blocks.`, `Move ${quote(child)} to the end of ${quote(spec.root)}'s children.`);
      }
    });
  }

  return result();
}

/** Format a validateSpec result (or an issue array) as terse, readable lines. */
export function formatIssues(input, { info: showInfo = false } = {}) {
  const issues = Array.isArray(input)
    ? input
    : [...input.errors, ...input.warnings, ...(showInfo ? input.info ?? [] : [])];
  return issues
    .map((issue) => {
      const label = issue.severity === "error" ? "error" : issue.severity === "warning" ? "warn " : "info ";
      const head = `${label} ${issue.code}${issue.elementId ? ` [${issue.elementId}]` : ""} ${issue.path || "/"}`;
      return `${head}\n  ${issue.message}${issue.hint ? `\n  hint: ${issue.hint}` : ""}`;
    })
    .join("\n");
}
