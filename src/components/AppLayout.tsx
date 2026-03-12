import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Kanban,
  Settings,
  LogOut,
  Home,
  ListTodo,
} from 'lucide-react';
import { useState, useMemo } from 'react';

const allNavItems = [
  { label: 'Início', icon: Home, href: '/dashboard', permission: 'dashboard' as const },
  { label: 'Pipeline CRM', icon: Kanban, href: '/pipeline', permission: 'pipeline' as const },
  { label: 'Configurações', icon: Settings, href: '/configuracoes', permission: 'settings' as const },
];

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = useMemo(() => {
    if (user?.role === 'FUNCIONARIO') {
      return allNavItems.filter(item => {
        if (item.permission === 'settings') return false;
        if (item.permission === 'dashboard') return user.permissions?.dashboard;
        return true;
      });
    }
    return allNavItems;
  }, [user]);

  const currentNav = navItems.find((n) => location.pathname.startsWith(n.href));

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar - Monday.com style */}
      <aside className="w-[220px] bg-sidebar flex flex-col shrink-0 border-r border-sidebar-border">
        {/* Logo */}
        <div className="h-12 flex items-center px-4 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold mr-2.5">
            C
          </div>
          <span className="font-semibold text-foreground text-sm tracking-tight">CRM SaaS</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2">
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                  active
                    ? 'sidebar-item-active font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-l-[3px] border-transparent'
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section - pinned bottom */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
              {user?.name?.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {user?.role === 'ADMIN_GERAL' ? 'Super Admin' : user?.role === 'FUNCIONARIO' ? (user.cargo || 'Funcionário') : 'Administrador'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive w-full transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar - Monday.com style */}
        <header className="h-12 bg-sidebar border-b border-border flex items-center justify-between px-6 shrink-0">
          <span className="text-base font-semibold text-foreground">
            {currentNav?.label || 'Início'}
          </span>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
