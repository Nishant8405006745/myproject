import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import api from "../api/axios";
import {
  LayoutDashboard, FileText, CreditCard, Users, BookOpen,
  BarChart3, FileEdit, ShieldCheck, UserCog,
  ChevronLeft, ChevronRight, DollarSign, User,
  ClipboardList, MessageSquare, Sparkles, Settings, Phone,
  Package, ShoppingCart, Warehouse, Truck
} from "lucide-react";

const ALL_NAV = [
  { label:"Dashboard",  icon:LayoutDashboard, path:"/dashboard", module:null,       roles:["admin","manager","employee"], color:"#6366f1", bg:"rgba(99,102,241,0.18)"  },
  { label:"Invoices",   icon:FileText,        path:"/invoices",  module:"invoices", roles:["admin","manager","employee"], color:"#10b981", bg:"rgba(16,185,129,0.18)"  },
  { label:"Expenses",   icon:CreditCard,      path:"/expenses",  module:"expenses", roles:["admin","manager","employee"], color:"#f43f5e", bg:"rgba(244,63,94,0.18)"   },
  { label:"Payroll",    icon:DollarSign,      path:"/payroll",   module:"payroll",  roles:["admin","manager","employee"], color:"#f97316", bg:"rgba(249,115,22,0.18)"  },
  { label:"Ledger",     icon:BookOpen,        path:"/ledger",    module:"ledger",   roles:["admin","manager","employee"], color:"#06b6d4", bg:"rgba(6,182,212,0.18)"   },
  { label:"Reports",    icon:BarChart3,       path:"/reports",   module:"reports",  roles:["admin","manager","employee"], color:"#a855f7", bg:"rgba(168,85,247,0.18)"  },
  { label:"Journal",    icon:FileEdit,        path:"/journal",   module:"journal",  roles:["admin","manager","employee"], color:"#ec4899", bg:"rgba(236,72,153,0.18)"  },
  { label:"Messages",    icon:MessageSquare, path:"/messages",  module:null, roles:["admin","manager","employee"], color:"#14b8a6", bg:"rgba(20,184,166,0.18)"  },
  { label:"Products",    icon:Package,       path:"/products",  module:null, roles:["admin","manager","employee"], color:"#6366f1", bg:"rgba(99,102,241,0.15)"  },
  { label:"PO & SO",     icon:ShoppingCart,  path:"/orders",    module:null, roles:["admin","manager","employee"], color:"#10b981", bg:"rgba(16,185,129,0.15)"  },
  { label:"Inventory",   icon:Warehouse,     path:"/inventory", module:null, roles:["admin","manager","employee"], color:"#f97316", bg:"rgba(249,115,22,0.15)"  },
  { label:"Live Tracking",icon:Truck,         path:"/tracking",  module:null, roles:["admin","manager","employee"], color:"#14b8a6", bg:"rgba(20,184,166,0.15)"  },
  { label:"My Profile",  icon:User,          path:"/profile",   module:null, roles:["admin","manager","employee"], color:"#84cc16", bg:"rgba(132,204,22,0.18)"  },
  { label:"Contact Us",  icon:Phone,         path:"/contact",   module:null, roles:["admin","manager","employee"], color:"#f97316", bg:"rgba(249,115,22,0.15)" },
];

const ADMIN_NAV = [
  { label:"User Management",  icon:Users,         path:"/admin/users",             color:"#6366f1", bg:"rgba(99,102,241,0.18)" },
  { label:"Role Permissions", icon:ShieldCheck,   path:"/admin/permissions",       color:"#f43f5e", bg:"rgba(244,63,94,0.18)"  },
  { label:"Profile Requests", icon:ClipboardList, path:"/admin/profile-requests",  color:"#f59e0b", bg:"rgba(245,158,11,0.18)" },
];

const MANAGER_NAV = [
  { label:"Employee Access",  icon:UserCog,       path:"/manager/employee-access",  color:"#06b6d4", bg:"rgba(6,182,212,0.18)" },
  { label:"Profile Requests", icon:ClipboardList, path:"/manager/profile-requests", color:"#f59e0b", bg:"rgba(245,158,11,0.18)" },
];

export default function Sidebar({ collapsed, setCollapsed, isMobile, closeMobile }) {
  const { user, hasModule } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await api.get("/api/messages/meta/unread-count");
        setUnreadCount(res.data.count || 0);
      } catch {}
    };
    fetchUnread();
    const t = setInterval(fetchUnread, 30000);
    return () => clearInterval(t);
  }, [user]);

  if (!user) return null;

  const visibleNav = ALL_NAV.filter(item => {
    if (!item.roles.includes(user.role)) return false;
    if (item.module === null) return true;
    return hasModule(item.module);
  });

  const initials = user.name?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase();

  const roleGradients = {
    admin:   "linear-gradient(135deg,#6366f1,#a855f7)",
    manager: "linear-gradient(135deg,#06b6d4,#6366f1)",
    employee:"linear-gradient(135deg,#10b981,#06b6d4)",
  };

  const NavItem = ({ item }) => (
    <NavLink
      to={item.path}
      className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
      title={collapsed ? item.label : undefined}
      style={({ isActive }) => isActive ? { "--item-color":item.color, "--item-bg":item.bg } : {}}
      onClick={() => isMobile && closeMobile && closeMobile()}
    >
      <div className="nav-icon-wrap" style={{ background:item.bg, color:item.color }}>
        <item.icon size={16} />
      </div>
      <span className="nav-label">{item.label}</span>
      {item.path === "/messages" && unreadCount > 0 && (
        <span className="nav-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
      )}
    </NavLink>
  );

  return (
    <>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Sparkles size={18} color="white" />
        </div>
        {!collapsed && (
          <div className="sidebar-logo-text">
            <span className="brand">HYGLOW</span>
            <span className="tagline">Accounting Suite</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {!collapsed && <div className="nav-section-label">Main Menu</div>}
        {visibleNav.map(item => <NavItem key={item.path} item={item} />)}

        {user.role === "admin" && (
          <>
            {!collapsed && <div className="nav-section-label" style={{ marginTop:14 }}>Administration</div>}
            {ADMIN_NAV.map(item => <NavItem key={item.path} item={item} />)}
          </>
        )}

        {user.role === "manager" && (
          <>
            {!collapsed && <div className="nav-section-label" style={{ marginTop:14 }}>Management</div>}
            {MANAGER_NAV.map(item => <NavItem key={item.path} item={item} />)}
          </>
        )}

        {/* Settings always at bottom of nav */}
        {!collapsed && <div className="nav-section-label" style={{ marginTop:14 }}>Preferences</div>}
        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          title={collapsed ? "Settings" : undefined}
          style={({ isActive }) => isActive ? { "--item-color":"#94a3b8", "--item-bg":"rgba(148,163,184,0.18)" } : {}}
          onClick={() => isMobile && closeMobile && closeMobile()}
        >
          <div className="nav-icon-wrap" style={{ background:"rgba(148,163,184,0.18)", color:"#94a3b8" }}>
            <Settings size={16} />
          </div>
          <span className="nav-label">Settings</span>
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="user-card">
          {user.profile_photo ? (
            <img
              src={user.profile_photo}
              alt={user.name}
              style={{
                width: 36, height: 36, borderRadius: '50%', objectFit: 'cover',
                border: '2px solid var(--accent)', flexShrink: 0,
              }}
            />
          ) : (
            <div className="user-avatar" style={{ background: roleGradients[user.role] || roleGradients.employee }}>
              {initials}
            </div>
          )}
          {!collapsed && (
            <div className="user-info">
              <div className="user-name">{user.name}</div>
              <div className="user-role" style={{ textTransform:"capitalize" }}>{user.role}</div>
            </div>
          )}
        </div>
        {!isMobile && (
          <button
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
          </button>
        )}
      </div>
    </>
  );
}