import { ThemeProvider } from "./app/providers/ThemeProvider";
import { ComponentShowcase } from "./components/shared/ComponentShowcase";

function App() {
  return (
    <ThemeProvider>
      <ComponentShowcase />
    </ThemeProvider>
  );
}

export default App;
