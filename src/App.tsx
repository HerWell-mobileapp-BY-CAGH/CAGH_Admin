import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import AdminDashboard from "./features/admin/AdminDashboard";
import { AuthProvider } from "./features/auth/AuthProvider";
import { useAuth } from "./features/auth/auth-context";
import { LoginPage } from "./features/auth/LoginPage";

function ProtectedDashboard() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <AdminDashboard onLogout={signOut} />;
}

export default function App() {
  return <BrowserRouter><AuthProvider><Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/dashboard" element={<ProtectedDashboard />} />
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes></AuthProvider></BrowserRouter>;
}
