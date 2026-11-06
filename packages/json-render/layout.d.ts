import type { BaseComponentProps } from "@json-render/react";
import type { ReactElement, ReactNode } from "react";

import type { StackGap } from "./layout-catalog.js";

export * from "./layout-catalog.js";

export interface StackProps {
  /** Space between children. Default "none": blocks pad their own sections. */
  gap?: StackGap;
  children?: ReactNode;
}
/** Plain React vertical composition, for hosts rendering without JSON Render. */
export declare function Stack(props: StackProps): ReactElement;

/** JSON Render adapters for the layout nodes. Already included in the package's `components`. */
export declare const layoutComponents: {
  Stack: (context: BaseComponentProps & { children?: ReactNode }) => ReactElement;
};
