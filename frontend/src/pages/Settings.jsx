import { useTheme, THEMES } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Moon, Sun, LogOut, Palette, Monitor, Check, ChevronRight, Shield, Bell, User } from "lucide-react";

export default function Settings() {
  const { mode, themeKey, toggleMode, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleGradients = {
    admin:   "linear-gradient(135deg,#6366f1,#a855f7)",
    manager: "linear-gradient(135deg,#06b6d4,#6366f1)",
    employee:"linear-gradient(135deg,#10b981,#06b6d4)",
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Customise your experience and preferences</p>
        </div>
      </div>

      {/* Account Card */}
      <div className="settings-card" style={{ marginBottom: 20 }}>
        <div className="settings-card-header">
          <div className="settings-section-icon" style={{ background: "rgba(99,102,241,0.15)", color: "var(--accent)" }}>
            <User size={18} />
          </div>
          <div>
            <div className="settings-section-title">Account</div>
            <div className="settings-section-sub">Your profile &amp; role information</div>
          </div>
        </div>
        <div className="settings-account-row">
          <div className="settings-avatar" style={{ background: roleGradients[user?.role] || roleGradients.employee }}>
            {(user?.name || "U").split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>{user?.name}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>{user?.email}</div>
            <span className={`badge ${user?.role}`} style={{ marginTop: 8, display: "inline-flex" }}>{user?.role}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("/profile")}>
            View Profile <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Appearance Card */}
      <div className="settings-card" style={{ marginBottom: 20 }}>
        <div className="settings-card-header">
          <div className="settings-section-icon" style={{ background: "rgba(168,85,247,0.15)", color: "var(--purple)" }}>
            <Monitor size={18} />
          </div>
          <div>
            <div className="settings-section-title">Appearance</div>
            <div className="settings-section-sub">Manage display mode &amp; visual style</div>
          </div>
        </div>

        {/* Dark / Light Toggle */}
        <div className="settings-row">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {mode === "dark" ? <Moon size={18} color="var(--accent-light)" /> : <Sun size={18} color="var(--warning)" />}
            <div>
              <div className="settings-row-label">{mode === "dark" ? "Dark Mode" : "Light Mode"}</div>
              <div className="settings-row-sub">Switch between dark and light appearance</div>
            </div>
          </div>
          <button className={`mode-toggle-btn ${mode}`} onClick={toggleMode} title="Toggle mode">
            <span className="mode-toggle-knob">
              {mode === "dark" ? <Moon size={12} /> : <Sun size={12} />}
            </span>
          </button>
        </div>

        {/* Mode Preview Cards */}
        <div className="mode-preview-grid">
          <button
            className={`mode-preview-card ${mode === "dark" ? "active" : ""}`}
            onClick={() => mode !== "dark" && toggleMode()}
          >
            <div className="mode-preview-screen dark-preview">
              <div className="preview-sidebar" />
              <div className="preview-content">
                <div className="preview-bar" />
                <div className="preview-bar short" />
              </div>
            </div>
            <div className="mode-preview-label">
              {mode === "dark" && <Check size={12} />} Dark
            </div>
          </button>
          <button
            className={`mode-preview-card ${mode === "light" ? "active" : ""}`}
            onClick={() => mode !== "light" && toggleMode()}
          >
            <div className="mode-preview-screen light-preview">
              <div className="preview-sidebar light" />
              <div className="preview-content light">
                <div className="preview-bar light" />
                <div className="preview-bar short light" />
              </div>
            </div>
            <div className="mode-preview-label">
              {mode === "light" && <Check size={12} />} Light
            </div>
          </button>
        </div>
      </div>

      {/* Color Theme Card */}
      <div className="settings-card" style={{ marginBottom: 20 }}>
        <div className="settings-card-header">
          <div className="settings-section-icon" style={{ background: "rgba(236,72,153,0.15)", color: "var(--pink)" }}>
            <Palette size={18} />
          </div>
          <div>
            <div className="settings-section-title">Color Theme</div>
            <div className="settings-section-sub">Choose your accent colour palette</div>
          </div>
        </div>

        <div className="theme-swatches">
          {Object.entries(THEMES).map(([key, t]) => (
            <button
              key={key}
              className={`theme-swatch ${themeKey === key ? "active" : ""}`}
              onClick={() => setTheme(key)}
              title={t.name}
            >
              <div
                className="swatch-circle"
                style={{ background: `linear-gradient(135deg, ${t.preview[0]}, ${t.preview[1]})` }}
              >
                {themeKey === key && <Check size={14} color="white" />}
              </div>
              <span className="swatch-label">{t.name}</span>
            </button>
          ))}
        </div>

        {/* Live accent preview */}
        <div className="theme-preview-bar">
          <div style={{ width: "100%", height: 6, borderRadius: 3, background: `var(--theme-gradient, linear-gradient(135deg,var(--accent),var(--accent-light)))`, transition: "background 0.4s ease" }} />
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <button className="btn btn-primary btn-sm" style={{ background: "var(--theme-gradient)" }}>Primary Action</button>
            <span className="badge active">Active</span>
            <span className="badge pending">Pending</span>
            <span style={{ fontSize: "0.8rem", color: "var(--accent-light)", fontWeight: 600 }}>Accent text preview</span>
          </div>
        </div>
      </div>

      {/* Notifications placeholder */}
      <div className="settings-card" style={{ marginBottom: 20, opacity: 0.7 }}>
        <div className="settings-card-header">
          <div className="settings-section-icon" style={{ background: "rgba(245,158,11,0.15)", color: "var(--warning)" }}>
            <Bell size={18} />
          </div>
          <div>
            <div className="settings-section-title">Notifications</div>
            <div className="settings-section-sub">Alert preferences — coming soon</div>
          </div>
        </div>
      </div>

      {/* Security / Logout Card */}
      <div className="settings-card settings-danger-card">
        <div className="settings-card-header">
          <div className="settings-section-icon" style={{ background: "rgba(244,63,94,0.15)", color: "var(--danger)" }}>
            <Shield size={18} />
          </div>
          <div>
            <div className="settings-section-title">Security</div>
            <div className="settings-section-sub">Account access &amp; session management</div>
          </div>
        </div>
        <div className="settings-row" style={{ borderBottom: "none" }}>
          <div>
            <div className="settings-row-label">Sign Out</div>
            <div className="settings-row-sub">End your current session securely</div>
          </div>
          <button className="btn btn-danger btn-sm" onClick={handleLogout}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}