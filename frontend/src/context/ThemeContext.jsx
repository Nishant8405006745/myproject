import { createContext, useContext, useState, useEffect } from "react";

export const THEMES = {
  violet: {
    name: "Violet", icon: "💜",
    accent: "#6366f1", accentLight: "#a78bfa",
    accentGlow: "rgba(99,102,241,0.35)",
    gradient: "linear-gradient(135deg,#6366f1,#a855f7)",
    preview: ["#6366f1","#a855f7"],
    dark:  { bg: "#06080f", bg2: "#090d1e", sidebar: "linear-gradient(180deg,#0a0e24 0%,#0d1230 100%)" },
    light: { bg: "#f5f3ff", bg2: "#ede9fe", sidebar: "linear-gradient(180deg,#ffffff 0%,#f5f3ff 100%)" },
  },
  cyan: {
    name: "Cyan", icon: "🩵",
    accent: "#06b6d4", accentLight: "#22d3ee",
    accentGlow: "rgba(6,182,212,0.35)",
    gradient: "linear-gradient(135deg,#0ea5e9,#06b6d4)",
    preview: ["#0ea5e9","#06b6d4"],
    dark:  { bg: "#060c11", bg2: "#091420", sidebar: "linear-gradient(180deg,#091826 0%,#0d2035 100%)" },
    light: { bg: "#ecfeff", bg2: "#cffafe", sidebar: "linear-gradient(180deg,#ffffff 0%,#ecfeff 100%)" },
  },
  emerald: {
    name: "Emerald", icon: "💚",
    accent: "#10b981", accentLight: "#34d399",
    accentGlow: "rgba(16,185,129,0.35)",
    gradient: "linear-gradient(135deg,#10b981,#06b6d4)",
    preview: ["#10b981","#34d399"],
    dark:  { bg: "#060e09", bg2: "#091510", sidebar: "linear-gradient(180deg,#09190e 0%,#0c2015 100%)" },
    light: { bg: "#f0fdf4", bg2: "#dcfce7", sidebar: "linear-gradient(180deg,#ffffff 0%,#f0fdf4 100%)" },
  },
  rose: {
    name: "Rose", icon: "🌹",
    accent: "#f43f5e", accentLight: "#fb7185",
    accentGlow: "rgba(244,63,94,0.35)",
    gradient: "linear-gradient(135deg,#f43f5e,#f97316)",
    preview: ["#f43f5e","#fb7185"],
    dark:  { bg: "#100508", bg2: "#19090c", sidebar: "linear-gradient(180deg,#1c080d 0%,#220c12 100%)" },
    light: { bg: "#fff1f2", bg2: "#ffe4e6", sidebar: "linear-gradient(180deg,#ffffff 0%,#fff1f2 100%)" },
  },
  amber: {
    name: "Amber", icon: "🟡",
    accent: "#f59e0b", accentLight: "#fbbf24",
    accentGlow: "rgba(245,158,11,0.35)",
    gradient: "linear-gradient(135deg,#f59e0b,#ef4444)",
    preview: ["#f59e0b","#fbbf24"],
    dark:  { bg: "#0e0b05", bg2: "#181206", sidebar: "linear-gradient(180deg,#1c1508 0%,#231b09 100%)" },
    light: { bg: "#fffbeb", bg2: "#fef3c7", sidebar: "linear-gradient(180deg,#ffffff 0%,#fffbeb 100%)" },
  },
  ocean: {
    name: "Ocean", icon: "🌊",
    accent: "#0ea5e9", accentLight: "#38bdf8",
    accentGlow: "rgba(14,165,233,0.35)",
    gradient: "linear-gradient(135deg,#0ea5e9,#6366f1)",
    preview: ["#0ea5e9","#6366f1"],
    dark:  { bg: "#060b10", bg2: "#091220", sidebar: "linear-gradient(180deg,#091628 0%,#0f1e38 100%)" },
    light: { bg: "#f0f9ff", bg2: "#e0f2fe", sidebar: "linear-gradient(180deg,#ffffff 0%,#f0f9ff 100%)" },
  },
  purple: {
    name: "Purple", icon: "🔮",
    accent: "#a855f7", accentLight: "#c084fc",
    accentGlow: "rgba(168,85,247,0.35)",
    gradient: "linear-gradient(135deg,#a855f7,#ec4899)",
    preview: ["#a855f7","#ec4899"],
    dark:  { bg: "#0a0610", bg2: "#10091a", sidebar: "linear-gradient(180deg,#130a20 0%,#190d28 100%)" },
    light: { bg: "#faf5ff", bg2: "#f3e8ff", sidebar: "linear-gradient(180deg,#ffffff 0%,#faf5ff 100%)" },
  },
  teal: {
    name: "Teal", icon: "🌿",
    accent: "#14b8a6", accentLight: "#2dd4bf",
    accentGlow: "rgba(20,184,166,0.35)",
    gradient: "linear-gradient(135deg,#14b8a6,#06b6d4)",
    preview: ["#14b8a6","#2dd4bf"],
    dark:  { bg: "#060e0d", bg2: "#091816", sidebar: "linear-gradient(180deg,#091c1a 0%,#0d2421 100%)" },
    light: { bg: "#f0fdfa", bg2: "#ccfbf1", sidebar: "linear-gradient(180deg,#ffffff 0%,#f0fdfa 100%)" },
  },
  coral: {
    name: "Coral", icon: "🪸",
    accent: "#f97316", accentLight: "#fb923c",
    accentGlow: "rgba(249,115,22,0.35)",
    gradient: "linear-gradient(135deg,#f97316,#f59e0b)",
    preview: ["#f97316","#fb923c"],
    dark:  { bg: "#0f0905", bg2: "#1a1108", sidebar: "linear-gradient(180deg,#1e1409 0%,#241a0c 100%)" },
    light: { bg: "#fff7ed", bg2: "#ffedd5", sidebar: "linear-gradient(180deg,#ffffff 0%,#fff7ed 100%)" },
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem("theme-mode") || "light");
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem("theme-color") || "violet");

  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `${r},${g},${b}`;
  };

  const applyTheme = (m, key) => {
    const root = document.documentElement;
    const t = THEMES[key] || THEMES.violet;
    const palette = m === "dark" ? t.dark : t.light;

    root.setAttribute("data-mode", m);
    root.setAttribute("data-theme", key);

    // Accent tokens
    root.style.setProperty("--accent",       t.accent);
    root.style.setProperty("--accent-light", t.accentLight);
    root.style.setProperty("--accent-glow",  t.accentGlow);
    root.style.setProperty("--theme-gradient", t.gradient);
    root.style.setProperty("--accent-rgb",   hexToRgb(t.accent));

    // Background tokens — change with BOTH mode AND theme
    root.style.setProperty("--bg-primary",   palette.bg);
    root.style.setProperty("--bg-secondary", palette.bg2);

    // Sidebar background
    root.style.setProperty("--sidebar-bg", palette.sidebar);

    // Sidebar accent decorations
    root.style.setProperty("--sidebar-logo-shadow",    t.accentGlow);
    root.style.setProperty("--sidebar-brand-gradient", `linear-gradient(135deg, ${t.accentLight}, #ec4899)`);

    // Card tint (very subtle)
    if (m === "dark") {
      root.style.setProperty("--bg-card",       `rgba(255,255,255,0.05)`);
      root.style.setProperty("--bg-card-hover", `rgba(255,255,255,0.09)`);
      root.style.setProperty("--border",        `rgba(255,255,255,0.09)`);
      // Dark mode text
      root.style.setProperty("--text-primary",   "#f1f5f9");
      root.style.setProperty("--text-secondary", "#94a3b8");
      root.style.setProperty("--text-muted",     "#64748b");
      root.style.setProperty("--sidebar-item-color",       "rgba(255,255,255,0.55)");
      root.style.setProperty("--sidebar-item-hover-color", "rgba(255,255,255,0.95)");
      root.style.setProperty("--sidebar-item-active-color","#ffffff");
      root.style.setProperty("--sidebar-nav-label",        "rgba(255,255,255,0.3)");
      root.style.setProperty("--sidebar-footer-btn-color", "rgba(255,255,255,0.45)");
    } else {
      root.style.setProperty("--bg-card",       `rgba(255,255,255,0.90)`);
      root.style.setProperty("--bg-card-hover", `rgba(255,255,255,0.98)`);
      root.style.setProperty("--border",        `rgba(0,0,0,0.09)`);
      // Light mode text — dark so visible on white backgrounds
      root.style.setProperty("--text-primary",   "#1e293b");
      root.style.setProperty("--text-secondary", "#334155");
      root.style.setProperty("--text-muted",     "#64748b");
      root.style.setProperty("--sidebar-item-color",       "rgba(30,41,59,0.65)");
      root.style.setProperty("--sidebar-item-hover-color", "#1e293b");
      root.style.setProperty("--sidebar-item-active-color","#1e293b");
      root.style.setProperty("--sidebar-nav-label",        "rgba(30,41,59,0.4)");
      root.style.setProperty("--sidebar-footer-btn-color", "rgba(30,41,59,0.5)");
    }
  };

  useEffect(() => { applyTheme(mode, themeKey); }, [mode, themeKey]);

  const toggleMode = () => {
    const next = mode === "dark" ? "light" : "dark";
    setMode(next);
    localStorage.setItem("theme-mode", next);
  };

  const setTheme = (key) => {
    setThemeKey(key);
    localStorage.setItem("theme-color", key);
  };

  return (
    <ThemeContext.Provider value={{ mode, themeKey, toggleMode, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);