import { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

export default function Layout() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handler = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  if (!user) return <Navigate to="/login" replace />;

  const sidebarClass = [
    'sidebar',
    !isMobile && collapsed ? 'collapsed' : '',
    isMobile && mobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="app-layout">
      <aside className={sidebarClass}>
        <Sidebar
          collapsed={!isMobile && collapsed}
          setCollapsed={setCollapsed}
          isMobile={isMobile}
          closeMobile={() => setMobileOpen(false)}
        />
      </aside>

      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      <div className={`main-content${!isMobile && collapsed ? ' collapsed' : ''}`}>
        <Topbar
          collapsed={!isMobile && collapsed}
          setCollapsed={setCollapsed}
          isMobile={isMobile}
          onMenuClick={() => isMobile ? setMobileOpen(!mobileOpen) : setCollapsed(!collapsed)}
        />
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
