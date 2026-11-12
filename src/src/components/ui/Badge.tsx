import type { HTMLAttributes } from "react";
import { clsx } from "clsx";

export type BadgeVariant = "neutral" | "info" | "success" | "warning" | "danger" | "outline";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant };

export function Badge({ variant = "neutral", className, ...props }: BadgeProps) {
  return <span className={clsx("badge", `badge-${variant}`, className)} {...props} />;
}

export type Status = "active" | "pending" | "success" | "failed" | "suspended" | "review";

const statusVariants: Record<Status, BadgeVariant> = {
  active: "success",
  pending: "warning",
  success: "success",
  failed: "danger",
  suspended: "danger",
  review: "info",
};

export function StatusBadge({ status, label }: { status: Status; label?: string }) {
  const text = label ?? status.charAt(0).toUpperCase() + status.slice(1);
  return <Badge variant={statusVariants[status]}>{text}</Badge>;
}
