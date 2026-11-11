import { Moon, Sun } from "lucide-react";
import { Button } from "../ui/Button";
import { useTheme } from "../../app/providers/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === "light" ? "dark" : "light";
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
    >
      {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
    </Button>
  );
}
