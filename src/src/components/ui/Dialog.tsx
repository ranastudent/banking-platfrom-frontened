import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "./Button";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function Dialog({
  open, onOpenChange, title, description, children, footer,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby="dialog-title"
      aria-describedby={description ? "dialog-description" : undefined}
      onCancel={(event) => { event.preventDefault(); onOpenChange(false); }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onOpenChange(false);
      }}
      onClose={() => onOpenChange(false)}
    >
      <div className="dialog-panel">
        <div className="dialog-header">
          <div>
            <h2 id="dialog-title">{title}</h2>
            {description && <p id="dialog-description">{description}</p>}
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label="Close dialog" onClick={() => onOpenChange(false)}>
            <X size={18} />
          </Button>
        </div>
        <div className="dialog-body">{children}</div>
        {footer && <div className="dialog-footer">{footer}</div>}
      </div>
    </dialog>,
    document.body,
  );
}
