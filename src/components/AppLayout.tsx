import { ReactNode, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Home, CheckSquare, FolderKanban, MessageCircle, Kanban, Settings, LogOut, Sun, Moon, Users,
} from 'lucide-react';
import { mockAccounts, mockEmployees, mockTasks, mockProjects } from '@/data/mock-data';
import { Progress } from '@/components/ui/progress';

const allNavItems = [
  { label: 'Início', icon: Home, href: '/dashboard', permission: 'dashboard' as const },
  { label: 'Tarefas', icon: CheckSquare, href: '/tarefas', permission: 'tarefas' as const },
  { label: 'Projetos', icon: FolderKanban, href: '/projetos', permission: 'projetos' as const },
  { label: 'Pipeline CRM', icon: Kanban, href: '/pipeline', permission: 'pipeline' as const },
  { label: 'Conversas', icon: MessageCircle, href: '/conversas', permission: 'conversas' as const },
  { label: 'Configurações', icon: Settings, href: '/configuracoes', permission: 'settings' as const },
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
        // tarefas and projetos always visible for employees
        if (item.permission === 'tarefas' || item.permission === 'projetos') return true;
        return true;
      });
    }
    return allNavItems;
  }, [user]);

  const currentNav = navItems.find((n) => location.pathname.startsWith(n.href));

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

  const myDemands = useMemo(() => {
    const assigneeId = myEmployeeId || user?.id;
    return accountTasks.filter(t => t.assigned_to === assigneeId && t.status !== 'concluido').slice(0, 3);
  }, [accountTasks, myEmployeeId, user]);

  const activeProjects = mockProjects.filter(p => p.account_id === (user?.account_id || 'acc-1') && p.status === 'active').slice(0, 3);
  const completedProjects = mockProjects.filter(p => p.account_id === (user?.account_id || 'acc-1') && p.status === 'completed').length;
  const totalProjects = mockProjects.filter(p => p.account_id === (user?.account_id || 'acc-1')).length;

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const getAvatarColor = (name: string) => {
    const colors = ['bg-purple-600', 'bg-blue-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600', 'bg-cyan-600'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const statusDotColor = (status: string) => {
    if (status === 'em_andamento') return 'bg-warning';
    if (status === 'a_fazer') return 'bg-primary';
    return 'bg-success';
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-[260px] glass-sidebar flex flex-col shrink-0 overflow-y-auto">
        {/* Account card */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
              {account?.name?.charAt(0) || 'C'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">{account?.name || 'Empresa'}</p>
              <p className="text-[11px] text-primary flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span className="text-primary font-medium">{teamMembers.length}</span>
                <span className="text-muted-foreground">membros no time</span>
              </p>
            </div>
          </div>
          <div className="space-y-1 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span>✓</span>
              <span>{completedProjects}/{totalProjects} projetos concluídos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>☐</span>
              <span>{completedTasks}/{totalTasks} tarefas concluídas</span>
            </div>
          </div>
          <Progress value={taskPct} className="h-1.5 mt-2" />
        </div>

        {/* Navigation */}
        <nav className="py-2">
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-2.5 px-4 py-2 text-sm ${
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

        {/* Suas Demandas */}
        <div className="px-4 py-2 border-t border-sidebar-border">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Suas Demandas</p>
          {myDemands.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">Nenhuma demanda pendente</p>
          ) : (
            <div className="space-y-1.5">
              {myDemands.map(task => (
                <Link key={task.id} to="/tarefas" className="flex items-center gap-2 text-[11px] text-foreground hover:text-primary transition-colors">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDotColor(task.status)}`} />
                  <span className="truncate">{task.title}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Meus Projetos */}
        <div className="px-4 py-2 border-t border-sidebar-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Meus Projetos</p>
            <Link to="/projetos" className="text-[10px] text-primary hover:underline">Ver todos</Link>
          </div>
          {activeProjects.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">Nenhum projeto ativo</p>
          ) : (
            <div className="space-y-2">
              {activeProjects.map(proj => {
                const pct = proj.total_tasks > 0 ? Math.round((proj.completed_tasks / proj.total_tasks) * 100) : 0;
                return (
                  <Link key={proj.id} to="/projetos" className="block">
                    <p className="text-[11px] text-foreground truncate">{proj.name}</p>
                    <Progress value={pct} className="h-1 mt-0.5" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Meu Time */}
        <div className="px-4 py-2 border-t border-sidebar-border flex-1 min-h-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Meu Time</p>
          <div className="space-y-1 overflow-y-auto max-h-40">
            {teamMembers.slice(0, 5).map(member => (
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

        {/* User section */}
        <div className="p-3 border-t border-sidebar-border mt-auto">
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
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive w-full"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-12 glass-topbar flex items-center justify-between px-6 shrink-0">
          <span className="text-base font-semibold text-foreground">
            {currentNav?.label || 'Início'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
