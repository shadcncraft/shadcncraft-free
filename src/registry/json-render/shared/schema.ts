import { z } from "zod";

/** Visible copy: plain text, never blank. */
export const text = z.string().trim().min(1);

/** Links: absolute HTTP(S), root-relative, in-page, mailto: or tel:. */
export const href = z
  .string()
  .regex(
    /^(https?:\/\/\S+|\/(?!\/)\S*|#\S*|mailto:\S+|tel:\S+)$/,
    "Use an http(s) URL, a root-relative path, #anchor, mailto: or tel: link."
  );

/** Images: HTTP(S) URL or root-relative host path. */
export const imageSrc = z.union([
  z.url({ protocol: /^https?$/ }),
  z
    .string()
    .regex(/^\/(?!\/)[^\s\\]*$/, "Use a root-relative path or an HTTP(S) image URL."),
]);

/** An optional line: plain text, or "" to hide it. */
export const optionalLine = z.string().trim();

/** Shared section heading fields. tagline and description accept "" to hide them. */
export const headingFields = {
  tagline: optionalLine.optional(),
  heading: text.optional(),
  description: optionalLine.optional(),
};
