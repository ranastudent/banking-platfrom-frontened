import { ThemeProvider } from "./app/providers/ThemeProvider";
import { AuthProvider } from "./app/providers/AuthProvider";
import { ComponentShowcase } from "./components/shared/ComponentShowcase";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ComponentShowcase />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
