import type { z } from "zod";
import type { componentDefinitions } from "./types/catalog.js";
import type { layoutDefinitions } from "./layout-catalog.js";
import type { Guidance } from "./guidance.js";

export type { ComponentGuidance, ContentGuidance, Guidance } from "./guidance.js";

export type IssueSeverity = "error" | "warning" | "info";

export type ErrorCode =
  | "invalid_document"
  | "missing_root"
  | "root_not_found"
  | "empty_document"
  | "unknown_field"
  | "invalid_element"
  | "unknown_component"
  | "invalid_prop"
  | "unknown_prop"
  | "misplaced_field"
  | "children_on_leaf"
  | "invalid_slot"
  | "unknown_slot"
  | "missing_child"
  | "duplicate_parent"
  | "cycle"
  | "invalid_visible"
  | "unknown_event"
  | "invalid_binding"
  | "unknown_action"
  | "invalid_action_params";
export type WarningCode =
  | "unbound_event"
  | "sample_content"
  | "orphaned_element"
  | "adjacent_panels"
  | "adjacent_split_media"
  | "multiple_inverted_panels"
  | "misplaced_block"
  | "duplicate_page_chrome"
  | "text_too_long"
  | "too_many_items"
  | "item_too_long";
export type InfoCode = "text_length" | "item_count" | "dynamic_prop";
export type IssueCode = ErrorCode | WarningCode | InfoCode;

export interface ValidationIssue {
  severity: IssueSeverity;
  /** Stable machine-readable code. */
  code: IssueCode;
  /** Element id the issue belongs to, or null for document-level issues. */
  elementId: string | null;
  /** JSON Pointer into the document, e.g. "/elements/cta/props/heading". */
  path: string;
  message: string;
  /** How to fix it; may be empty. */
  hint: string;
}

export interface ValidationResult {
  /** True when there are no errors. Warnings and info do not fail validation. */
  ok: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  info: ValidationIssue[];
}

export interface ComponentDefinitionLike {
  props: z.ZodType;
  slots: readonly string[];
  description?: string;
  /** Events the component emits; none when omitted. */
  events?: readonly string[];
}

export interface ValidateOptions {
  /** Extra host component definitions, merged over the package's. */
  components?: Record<string, ComponentDefinitionLike>;
  /** Actions the host registers. When given, other actions are errors and Zod params are checked. */
  actions?: readonly string[] | Record<string, { params?: z.ZodType; description?: string }>;
  /** Guidance for content lint. Defaults to the package's guidance.json; false disables lint. */
  guidance?: Guidance | null | false;
  /** Sample defaults for sample_content warnings. Defaults to the package's samples.json; false disables them. */
  samples?: Samples | null | false;
}

/** The package's guidance.json, or null when it is not installed. */
export declare const guidance: Guidance | null;
/** What each block renders when a prop is omitted. */
export interface Samples { version: number; note?: string; components: Record<string, Record<string, unknown>>; }
/** The package's samples.json, or null when it is not installed. */
export declare const samples: Samples | null;
/** Every component the package renders: the twelve blocks plus layout nodes. */
export declare const definitions: typeof componentDefinitions & typeof layoutDefinitions;
/** Events a component emits. */
export declare function eventsFor(type: string, definition?: ComponentDefinitionLike): string[];
/** Validate a JSON Render document against the package catalog, graph rules, actions and content guidance. */
export declare function validateSpec(spec: unknown, options?: ValidateOptions): ValidationResult;
/** Format a result or issue list as terse readable lines. */
export declare function formatIssues(input: ValidationResult | readonly ValidationIssue[], options?: { info?: boolean }): string;
