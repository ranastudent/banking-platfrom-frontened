import type { ReactNode } from "react";
import { useId } from "react";

export function Tooltip({ content, children }: { content: string; children: ReactNode }) {
  const id = useId();
  return (
    <span className="tooltip-root">
      <span className="tooltip-trigger" tabIndex={0} aria-describedby={id}>{children}</span>
      <span className="tooltip-content" role="tooltip" id={id}>{content}</span>
    </span>
  );
}
