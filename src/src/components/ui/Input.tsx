import { forwardRef, type InputHTMLAttributes } from "react";
import { clsx } from "clsx";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid = false, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx("input", invalid && "input-invalid", className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  ),
);
Input.displayName = "Input";
