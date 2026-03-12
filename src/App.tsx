import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import SuperAdminLayout from "@/components/SuperAdminLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import PipelinePage from "@/pages/PipelinePage";
import ConfiguracoesPage from "@/pages/ConfiguracoesPage";
import ClientesPage from "@/pages/admin/ClientesPage";
import NovoClientePage from "@/pages/admin/NovoClientePage";
import ConfigurarClientePage from "@/pages/admin/ConfigurarClientePage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (user?.role === 'ADMIN_GERAL') return <Navigate to="/admin/clientes" replace />;
  return <AppLayout>{children}</AppLayout>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (user?.role !== 'ADMIN_GERAL') return <Navigate to="/dashboard" replace />;
  return <SuperAdminLayout>{children}</SuperAdminLayout>;
};

const LoginRoute = () => {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated) {
    if (user?.role === 'ADMIN_GERAL') return <Navigate to="/admin/clientes" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <LoginPage />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LoginRoute />} />
    {/* Client routes */}
    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
    <Route path="/pipeline" element={<ProtectedRoute><PipelinePage /></ProtectedRoute>} />
    <Route path="/configuracoes" element={<ProtectedRoute><ConfiguracoesPage /></ProtectedRoute>} />
    {/* Super Admin routes */}
    <Route path="/admin/clientes" element={<AdminRoute><ClientesPage /></AdminRoute>} />
    <Route path="/admin/clientes/novo" element={<AdminRoute><NovoClientePage /></AdminRoute>} />
    <Route path="/admin/clientes/:id/configurar" element={<AdminRoute><ConfigurarClientePage /></AdminRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
