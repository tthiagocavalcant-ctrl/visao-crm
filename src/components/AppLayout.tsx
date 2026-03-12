import { ReactNode, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Home, CheckSquare, MessageCircle, Kanban, Settings, LogOut, Sun, Moon, Users, Bell, ChevronDown,
} from 'lucide-react';
import { mockAccounts, mockEmployees, mockTasks } from '@/data/mock-data';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const allNavItems = [
  { label: 'Início', href: '/dashboard', permission: 'dashboard' as const },
  { label: 'Pipeline CRM', href: '/pipeline', permission: 'pipeline' as const },
  { label: 'Tarefas', href: '/tarefas', permission: 'tarefas' as const },
  { label: 'Conversas', href: '/conversas', permission: 'conversas' as const },
  { label: 'Configurações', href: '/configuracoes', permission: 'settings' as const },
];

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = useMemo(() => {
    if (user?.role === 'FUNCIONARIO') {
      return allNavItems.filter(item => {
        if (item.permission === 'settings') return false;
        if (item.permission === 'dashboard') return user.permissions?.dashboard;
        if (item.permission === 'conversas') return user.permissions?.conversas;
        return true;
      });
    }
    return allNavItems;
  }, [user]);

  const handleLogout = () => { logout(); navigate('/'); };

  // Sidebar stats
  const account = mockAccounts.find(a => a.id === (user?.account_id || 'acc-1'));
  const teamMembers = mockEmployees.filter(e => e.account_id === (user?.account_id || 'acc-1') && e.active);
  const accountTasks = mockTasks.filter(t => t.account_id === (user?.account_id || 'acc-1'));
  const myEmployeeId = user?.role === 'FUNCIONARIO' ? mockEmployees.find(e => e.email === user?.email)?.id : null;

  const relevantTasks = useMemo(() => {
    if (user?.role === 'FUNCIONARIO' && myEmployeeId) {
      return accountTasks.filter(t => t.assigned_to === myEmployeeId);
    }
    return accountTasks;
  }, [accountTasks, user, myEmployeeId]);

  const completedTasks = relevantTasks.filter(t => t.status === 'concluido').length;
  const totalTasks = relevantTasks.length;
  const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const getAvatarColor = (name: string) => {
    const colors = ['bg-purple-600', 'bg-blue-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600', 'bg-cyan-600'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const userRoleLabel = user?.role === 'ADMIN_GERAL' ? 'Super Admin' : user?.role === 'FUNCIONARIO' ? (user.cargo || 'Funcionário') : 'Administrador';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-14 glass-topbar flex items-center px-4 shrink-0 z-20">
        {/* Left: Logo */}
        <div className="flex items-center gap-2 mr-6">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
            C
          </div>
        </div>

        {/* Center: Nav links */}
        <nav className="flex items-center gap-0 flex-1">
          {navItems.map(item => {
            const active = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`px-4 h-14 flex items-center text-sm font-medium transition-colors relative ${
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
            title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent">
            <Bell className="w-4 h-4" />
          </button>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                  {user?.name?.charAt(0)}
                </div>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-foreground">{user?.name}</p>
                <p className="text-[11px] text-muted-foreground">{userRoleLabel}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
                <Settings className="w-3.5 h-3.5 mr-2" /> Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="w-3.5 h-3.5 mr-2" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar — Profile panel only */}
        <aside className="w-[200px] glass-sidebar flex flex-col shrink-0 overflow-y-auto">
          {/* Account card */}
          <div className="p-3 border-b border-sidebar-border">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                {account?.name?.charAt(0) || 'C'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">{account?.name || 'Empresa'}</p>
                <p className="text-[10px] text-primary flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span className="font-medium">{teamMembers.length}</span>
                  <span className="text-muted-foreground">membros</span>
                </p>
              </div>
            </div>
            <div className="space-y-0.5 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <span>☐</span>
                <span>{completedTasks}/{totalTasks} tarefas concluídas</span>
              </div>
            </div>
            <Progress value={taskPct} className="h-1 mt-1.5" />
          </div>

          {/* Meu Time */}
          <div className="px-3 py-2 flex-1 min-h-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Meu Time</p>
            <div className="space-y-1 overflow-y-auto">
              {teamMembers.map(member => (
                <div key={member.id} className="flex items-center gap-2 h-8">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0 ${getAvatarColor(member.name)}`}>
                    {getInitials(member.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-foreground truncate">{member.name}</p>
                    <p className="text-[9px] text-muted-foreground truncate">{member.cargo}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User footer */}
          <div className="p-3 border-t border-sidebar-border mt-auto">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">
                {user?.name?.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-foreground truncate">{user?.name}</p>
                <p className="text-[9px] text-muted-foreground truncate">{userRoleLabel}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-muted-foreground hover:text-destructive w-full"
            >
              <LogOut className="w-3 h-3" />
              <span>Sair</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
