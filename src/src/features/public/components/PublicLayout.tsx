import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Landmark, Moon, Sun, Menu, X } from "lucide-react";
import { useTheme } from "../../../app/providers/ThemeProvider";

export function PublicLayout() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const isAbout = location.pathname === "/" || location.pathname === "/about";
  return (
    <div className="public-shell">
      <header className="public-header">
        <Link className="public-brand" to="/">
          <span className="public-brand-icon"><Landmark size={24} strokeWidth={2.6} /></span>
          <span><strong>Banking Platform</strong><small>Secure • Smart • Reliable</small></span>
        </Link>
        <nav id="public-navigation" className={`public-nav${menuOpen ? " is-open" : ""}`} aria-label="Main navigation">
          <Link onClick={closeMenu} className={isAbout ? "selected" : ""} to="/about">About</Link>
          
          <Link onClick={closeMenu} to="/login">Login</Link>
          <Link onClick={closeMenu} to="/register">Register</Link>
        </nav>
        <button className="mobile-nav-toggle" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} aria-controls="public-navigation">
          {menuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
        <button className="theme-switch" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}>
          {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
          <span>{theme === "light" ? "Dark" : "Light"} theme</span>
        </button>
      </header>
      <main className="public-main"><Outlet /></main>
      <footer className="public-footer">
        <div className="footer-brand"><span className="public-brand-icon"><Landmark size={18} /></span><span><strong>Banking Platform</strong><small>A secure and modern digital banking solution.</small></span></div>
        <div className="footer-links"><Link to="/about">About</Link><a href="/about#security">Security</a><a href="/about#contact">Contact</a><Link to="/login">Login</Link></div>
        <small className="copyright">© 2026 Banking Platform. All rights reserved. <span>Demo application — no real funds.</span></small>
      </footer>
    </div>
  );
}
