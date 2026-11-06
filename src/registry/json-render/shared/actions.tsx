"use client";

import type { BaseComponentProps, EventHandle } from "@json-render/react";
import { useRef, useState } from "react";

/**
 * Runs a native json-render event. Unbound events disable their control, a
 * pending run blocks repeats, and unhandled failures surface as a local alert.
 */
export function useEventAction(
  handle: EventHandle,
  loading: BaseComponentProps["loading"],
  before?: () => void
) {
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Resolves true when the bound actions completed without an error. */
  async function run(): Promise<boolean> {
    if (loading || !handle.bound || inFlight.current) return false;
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      before?.();
      // emit is typed void, but the renderer returns the action sequence promise.
      await handle.emit();
      return true;
    } catch {
      setError("We couldn't complete that action. Please try again.");
      return false;
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }
  return { run, disabled: Boolean(loading || !handle.bound || pending), error };
}

export function ActionError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p
      role="alert"
      className="mx-auto max-w-7xl px-5 py-2 text-sm text-destructive lg:px-8"
    >
      {error}
    </p>
  );
}

export function InvalidProps({ name }: { name: string }) {
  return (
    <p
      role="alert"
      className="mx-auto max-w-7xl px-5 py-4 text-sm text-destructive lg:px-8"
    >
      {name} content is invalid. Run `npx shadcncraft-json-render check` on the document.
    </p>
  );
}
