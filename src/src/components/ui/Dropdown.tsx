import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { clsx } from "clsx";

export type DropdownItem = {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  destructive?: boolean;
  icon?: ReactNode;
};

export function Dropdown({
  triggerLabel, items, align = "end",
}: {
  triggerLabel: ReactNode;
  items: DropdownItem[];
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="dropdown" ref={rootRef}>
      <button
        type="button"
        className="dropdown-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        {triggerLabel}<ChevronDown size={15} />
      </button>
      {open && (
        <div className={clsx("dropdown-menu", `dropdown-${align}`)} id={menuId} role="menu">
          {items.map((item) => (
            <button
              type="button"
              role="menuitem"
              key={item.label}
              disabled={item.disabled}
              className={clsx("dropdown-item", item.destructive && "dropdown-item-danger")}
              onClick={() => { item.onSelect(); setOpen(false); }}
            >
              {item.icon}<span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
