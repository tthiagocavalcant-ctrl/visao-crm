import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AppLayout from "@/components/AppLayout";
import SuperAdminLayout from "@/components/SuperAdminLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import PipelinePage from "@/pages/PipelinePage";
import ConfiguracoesPage from "@/pages/ConfiguracoesPage";
import ConversasPage from "@/pages/ConversasPage";
import TarefasPage from "@/pages/TarefasPage";
import ClientesPage from "@/pages/admin/ClientesPage";
import NovoClientePage from "@/pages/admin/NovoClientePage";
import ConfigurarClientePage from "@/pages/admin/ConfigurarClientePage";
import ScriptsPage from "@/pages/ScriptsPage";
import FollowUpsPage from "@/pages/FollowUpsPage";
import SetupPage from "@/pages/SetupPage";
import NotFound from "./pages/NotFound.tsx";
import { toast } from "@/hooks/use-toast";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, requiredPermission }: { children: React.ReactNode; requiredPermission?: string }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (user?.role === 'ADMIN_GERAL') return <Navigate to="/admin/clientes" replace />;

  if (user?.role === 'FUNCIONARIO') {
    if (requiredPermission === 'settings') {
      toast({ title: 'Você não tem permissão para acessar esta página' });
      return <Navigate to="/pipeline" replace />;
    }
    if (requiredPermission === 'dashboard' && !user.permissions?.dashboard) {
      toast({ title: 'Você não tem permissão para acessar esta página' });
      return <Navigate to="/pipeline" replace />;
    }
    if (requiredPermission === 'conversas' && !user.permissions?.conversas) {
      toast({ title: 'Você não tem permissão para acessar esta página' });
      return <Navigate to="/pipeline" replace />;
    }
  }

  return <AppLayout>{children}</AppLayout>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (user?.role !== 'ADMIN_GERAL') return <Navigate to="/dashboard" replace />;
  return <SuperAdminLayout>{children}</SuperAdminLayout>;
};

const LoginRoute = () => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) {
    if (user?.role === 'ADMIN_GERAL') return <Navigate to="/admin/clientes" replace />;
    if (user?.role === 'FUNCIONARIO') return <Navigate to="/pipeline" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <LoginPage />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LoginRoute />} />
    <Route path="/setup" element={<SetupPage />} />
    <Route path="/dashboard" element={<ProtectedRoute requiredPermission="dashboard"><DashboardPage /></ProtectedRoute>} />
    <Route path="/pipeline" element={<ProtectedRoute><PipelinePage /></ProtectedRoute>} />
    <Route path="/conversas" element={<ProtectedRoute requiredPermission="conversas"><ConversasPage /></ProtectedRoute>} />
    <Route path="/tarefas" element={<ProtectedRoute><TarefasPage /></ProtectedRoute>} />
    <Route path="/scripts" element={<ProtectedRoute><ScriptsPage /></ProtectedRoute>} />
    <Route path="/configuracoes" element={<ProtectedRoute requiredPermission="settings"><ConfiguracoesPage /></ProtectedRoute>} />
    <Route path="/admin/clientes" element={<AdminRoute><ClientesPage /></AdminRoute>} />
    <Route path="/admin/clientes/novo" element={<AdminRoute><NovoClientePage /></AdminRoute>} />
    <Route path="/admin/clientes/:id/configurar" element={<AdminRoute><ConfigurarClientePage /></AdminRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
