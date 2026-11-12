import type { HTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

type BaseProps = HTMLAttributes<HTMLDivElement> & { children: ReactNode };

export function Card({ className, children, ...props }: BaseProps) {
  return <section className={clsx("card", className)} {...props}>{children}</section>;
}
export function CardHeader({ className, children, ...props }: BaseProps) {
  return <div className={clsx("card-header", className)} {...props}>{children}</div>;
}
export function CardTitle({ className, children, ...props }: BaseProps) {
  return <h2 className={clsx("card-title", className)} {...props}>{children}</h2>;
}
export function CardDescription({ className, children, ...props }: BaseProps) {
  return <p className={clsx("card-description", className)} {...props}>{children}</p>;
}
export function CardContent({ className, children, ...props }: BaseProps) {
  return <div className={clsx("card-content", className)} {...props}>{children}</div>;
}
export function CardFooter({ className, children, ...props }: BaseProps) {
  return <div className={clsx("card-footer", className)} {...props}>{children}</div>;
}
