import type { ReactNode } from "react";
import { Input, type InputProps } from "./Input";

type FormFieldProps = Omit<InputProps, "id"> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  leading?: ReactNode;
};

export function FormField({
  id, label, hint, error, leading, ...inputProps
}: FormFieldProps) {
  const descriptionId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="form-field">
      <label className="form-label" htmlFor={id}>{label}</label>
      <div className="input-wrap">
        {leading && <span className="input-leading" aria-hidden="true">{leading}</span>}
        <Input
          id={id}
          invalid={Boolean(error)}
          aria-describedby={descriptionId}
          className={leading ? "input-with-leading" : undefined}
          {...inputProps}
        />
      </div>
      {error && <p className="form-error" id={`${id}-error`}>{error}</p>}
      {!error && hint && <p className="form-hint" id={`${id}-hint`}>{hint}</p>}
    </div>
  );
}
