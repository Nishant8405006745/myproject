import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Menu, Bell, CheckCheck, Settings, Moon, Sun } from "lucide-react";
import api from "../api/axios";

const PAGE_TITLES = {
  "/dashboard":                ["Dashboard",           "Financial overview"],
  "/invoices":                 ["Invoices",            "Manage client invoices"],
  "/expenses":                 ["Expenses",            "Track business expenses"],
  "/payroll":                  ["Payroll",             "Employee payroll records"],
  "/ledger":                   ["General Ledger",      "Account entries"],
  "/reports":                  ["Financial Reports",   "Profit, loss & balance sheet"],
  "/journal":                  ["Journal Entries",     "Double-entry bookkeeping"],
  "/admin/users":              ["User Management",     "Manage all users"],
  "/admin/permissions":        ["Role Permissions",    "Configure module access"],
  "/admin/profile-requests":   ["Profile Requests",   "Review change requests"],
  "/manager/employee-access":  ["Employee Access",    "Manage team permissions"],
  "/manager/profile-requests": ["Profile Requests",   "Review change requests"],
  "/profile":                  ["My Profile",          "View and edit your profile"],
  "/messages":                 ["Messages",            "Team communication"],
  "/settings":                 ["Settings",            "Preferences & appearance"],
};

const TYPE_COLORS = { success:"#10b981", warning:"#f59e0b", error:"#ef4444", info:"#3b82f6" };

export default function Topbar({ collapsed, setCollapsed, isMobile, onMenuClick }) {
  const { user } = useAuth();
  const { mode, toggleMode } = useTheme();
  const location = useLocation();
  const navigate  = useNavigate();
  const [title, subtitle] = PAGE_TITLES[location.pathname] || ["Page", ""];

  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs]         = useState([]);
  const [unread, setUnread]         = useState(0);
  const panelRef = useRef();

  const now     = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short", year:"numeric" });

  const loadNotifs = async () => {
    try {
      const [nRes, cRes] = await Promise.all([
        api.get("/api/notifications/"),
        api.get("/api/notifications/unread-count"),
      ]);
      setNotifs(nRes.data);
      setUnread(cRes.data.count);
    } catch (_) {}
  };

  useEffect(() => {
    loadNotifs();
    const interval = setInterval(loadNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    await api.put("/api/notifications/read-all");
    loadNotifs();
  };

  const handleNotifClick = async (n) => {
    if (!n.is_read) { await api.put(`/api/notifications/${n.id}/read`); loadNotifs(); }
    setShowNotifs(false);
    if (n.link) navigate(n.link);
  };

  const timeAgo = (ds) => {
    const diff = (Date.now() - new Date(ds)) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  };

  return (
    <header className={`topbar${collapsed ? " collapsed" : ""}`}>
      <div className="topbar-left">
        <button className="topbar-toggle" onClick={onMenuClick || (() => setCollapsed(!collapsed))} title="Toggle sidebar">
          <Menu size={20} />
        </button>
        <div>
          <div className="topbar-page-title">{title}</div>
          {subtitle && <div className="topbar-page-subtitle">{subtitle}</div>}
        </div>
      </div>

      <div className="topbar-right">
        <span className="topbar-date">{dateStr}</span>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span className={`badge ${user?.role}`}>{user?.role}</span>
          <span style={{ fontSize:"0.85rem", color:"var(--text-secondary)", fontWeight:500 }}>{user?.name}</span>
        </div>

        {/* Dark/Light quick toggle */}
        <button
          onClick={toggleMode}
          className="topbar-action-btn"
          title={mode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {mode === "dark" ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="#6366f1" />}
        </button>

        {/* Notification Bell */}
        <div style={{ position:"relative" }} ref={panelRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            style={{ position:"relative", background:"rgba(255,255,255,0.06)", border:"1px solid var(--border)", borderRadius:10, width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"var(--text-secondary)", transition:"all 0.2s" }}
          >
            <Bell size={16}/>
            {unread > 0 && (
              <span style={{ position:"absolute", top:-4, right:-4, background:"#ef4444", color:"#fff", borderRadius:"50%", width:18, height:18, fontSize:"0.65rem", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
          {showNotifs && (
            <div style={{ position:"absolute", top:48, right:0, width:340, maxHeight:420, overflowY:"auto", background:"var(--bg-card-solid, #0f172a)", border:"1px solid var(--border)", borderRadius:14, boxShadow:"0 20px 60px rgba(0,0,0,0.5)", zIndex:1000 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", borderBottom:"1px solid var(--border)" }}>
                <span style={{ fontWeight:700, color:"var(--text-primary)" }}>Notifications</span>
                {unread > 0 && (
                  <button onClick={markAllRead} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--accent-light)", fontSize:"0.77rem", display:"flex", alignItems:"center", gap:4 }}>
                    <CheckCheck size={13}/> Mark all read
                  </button>
                )}
              </div>
              {notifs.length === 0 ? (
                <div style={{ padding:32, textAlign:"center", color:"var(--text-muted)", fontSize:"0.85rem" }}>No notifications yet</div>
              ) : notifs.map(n => (
                <div key={n.id} onClick={() => handleNotifClick(n)}
                  style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)", cursor:n.link?"pointer":"default", background:n.is_read?"transparent":"rgba(59,130,246,0.05)", transition:"background 0.15s" }}
                >
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontWeight:600, fontSize:"0.82rem", color:TYPE_COLORS[n.type]||"var(--text-primary)" }}>{n.title}</span>
                    <span style={{ fontSize:"0.7rem", color:"var(--text-muted)" }}>{timeAgo(n.created_at)}</span>
                  </div>
                  <p style={{ color:"var(--text-muted)", fontSize:"0.78rem", margin:0, lineHeight:1.4 }}>{n.message}</p>
                  {!n.is_read && <div style={{ width:6, height:6, borderRadius:"50%", background:"#3b82f6", marginTop:6 }}/>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings icon */}
        <button
          onClick={() => navigate("/settings")}
          className="topbar-action-btn"
          title="Settings"
          style={{ background: location.pathname === "/settings" ? "var(--accent-glow)" : undefined }}
        >
          <Settings size={16} />
        </button>

        {/* Profile Avatar */}
        <button
          onClick={() => navigate("/profile")}
          style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", border:"none", cursor:"pointer", color:"#fff", fontWeight:700, fontSize:"0.75rem", display:"flex", alignItems:"center", justifyContent:"center" }}
          title="My Profile"
        >
          {user?.profile_photo ? (
            <img src={user.profile_photo} alt="avatar" style={{ width:36, height:36, borderRadius:"50%", objectFit:"cover" }}/>
          ) : (
            (user?.name||"U").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()
          )}
        </button>
      </div>
    </header>
  );
}