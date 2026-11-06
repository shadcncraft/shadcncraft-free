/** Content limits for one prop. Text props use *Chars; list props use *Items and per-field limits. */
export interface ContentGuidance {
  /** [min, max] */
  idealChars?: [number, number];
  maxChars?: number;
  /** [min, max] */
  idealItems?: [number, number];
  maxItems?: number;
  itemMaxChars?: number;
  /** Limits for each text field of a list item, e.g. testimonials[].quote. */
  fields?: Record<string, { idealChars?: [number, number]; maxChars?: number }>;
}

/** Composition and editing guidance for one component. */
export interface ComponentGuidance {
  summary: string;
  layout: string;
  surface: string;
  media: string;
  /** "top" blocks open the page (navigation, banner); "bottom" blocks close it (footer). */
  position?: "top" | "bottom";
  bestFor: string[];
  avoidWhen: string[];
  pairsWith: string[];
  /** Facts about what always renders, where copy goes and how to bind events. */
  notes?: string[];
  /** A list prop laid out in a fixed-column desktop grid. */
  grid?: { prop: string; columns: number };
  /** Props that replace the placeholder logo; with none set, check warns. */
  logo?: string[];
  /** Omitted prop → prop that hides it: no sample_content warning when that prop is "". */
  sampleIf?: Record<string, string>;
  /** Events that may stay unbound without a warning. */
  optionalEvents?: string[];
  content: Record<string, ContentGuidance>;
}

/** Shape of `@shadcncraft/json-render/guidance.json`. */
export interface Guidance {
  version: number;
  components: Record<string, ComponentGuidance>;
}
