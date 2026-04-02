import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";

import Login    from "./pages/Login";
import Signup   from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Invoices  from "./pages/Invoices";
import Expenses  from "./pages/Expenses";
import Payroll   from "./pages/Payroll";
import Ledger    from "./pages/Ledger";
import Reports   from "./pages/Reports";
import Journal   from "./pages/Journal";
import Profile          from "./pages/Profile";
import ProfileRequests  from "./pages/ProfileRequests";
import Messages         from "./pages/Messages";
import Settings         from "./pages/Settings";
import ContactUs        from "./pages/ContactUs";
import Products         from "./pages/Products";
import PurchaseOrders   from "./pages/PurchaseOrders";
import Inventory        from "./pages/Inventory";
import LiveTracking     from "./pages/LiveTracking";
import UserManagement   from "./pages/admin/UserManagement";
import RolePermissions  from "./pages/admin/RolePermissions";
import EmployeeAccess   from "./pages/manager/EmployeeAccess";

function RoleGuard({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function ModuleGuard({ children, module }) {
  const { user, hasModule } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!hasModule(module)) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh", flexDirection:"column", gap:16 }}>
      <div style={{ fontSize:"3rem" }}>🔒</div>
      <h2 style={{ color:"var(--text-primary)" }}>Access Denied</h2>
      <p style={{ color:"var(--text-muted)" }}>You do not have permission to access this module.</p>
      <p style={{ color:"var(--text-muted)", fontSize:"0.85rem" }}>Contact your manager or admin to request access.</p>
    </div>
  );
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login"  element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile"   element={<Profile />} />
        <Route path="messages"  element={<Messages />} />
        <Route path="settings"  element={<Settings />} />
        <Route path="contact"   element={<ContactUs />} />
        <Route path="products"  element={<Products />} />
        <Route path="orders"    element={<PurchaseOrders />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="tracking"  element={<LiveTracking />} />
        <Route path="invoices"  element={<ModuleGuard module="invoices"><Invoices /></ModuleGuard>} />
        <Route path="expenses"  element={<ModuleGuard module="expenses"><Expenses /></ModuleGuard>} />
        <Route path="payroll"   element={<ModuleGuard module="payroll"><Payroll /></ModuleGuard>} />
        <Route path="ledger"    element={<ModuleGuard module="ledger"><Ledger /></ModuleGuard>} />
        <Route path="reports"   element={<ModuleGuard module="reports"><Reports /></ModuleGuard>} />
        <Route path="journal"   element={<ModuleGuard module="journal"><Journal /></ModuleGuard>} />
        <Route path="admin/users"            element={<RoleGuard roles={["admin"]}><UserManagement /></RoleGuard>} />
        <Route path="admin/permissions"      element={<RoleGuard roles={["admin"]}><RolePermissions /></RoleGuard>} />
        <Route path="admin/profile-requests" element={<RoleGuard roles={["admin"]}><ProfileRequests /></RoleGuard>} />
        <Route path="manager/employee-access"  element={<RoleGuard roles={["manager"]}><EmployeeAccess /></RoleGuard>} />
        <Route path="manager/profile-requests" element={<RoleGuard roles={["manager"]}><ProfileRequests /></RoleGuard>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background:"#1e293b",
                color:"#f1f5f9",
                border:"1px solid rgba(255,255,255,0.08)",
                borderRadius:"10px",
                fontSize:"0.875rem",
              },
              success:{ iconTheme:{ primary:"#10b981", secondary:"#1e293b" } },
              error:  { iconTheme:{ primary:"#ef4444", secondary:"#1e293b" } },
            }}
          />
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}