import { ReactNode, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Home, CheckSquare, MessageCircle, MessageSquare, Kanban, Settings, LogOut, Sun, Moon, Users,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const allNavItems = [
  { label: 'Início', icon: Home, href: '/dashboard', permission: 'dashboard' as const },
  { label: 'Pipeline CRM', icon: Kanban, href: '/pipeline', permission: 'pipeline' as const },
  { label: 'Tarefas', icon: CheckSquare, href: '/tarefas', permission: 'tarefas' as const },
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
        return true;
      });
    }
    return allNavItems;
  }, [user]);

  const handleLogout = () => { logout(); navigate('/'); };

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team', user?.account_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, email, cargo, active')
        .eq('account_id', user!.account_id!)
        .eq('active', true)
        .order('name');
      return data || [];
    },
    enabled: !!user?.account_id,
  });

  const { data: account } = useQuery({
    queryKey: ['account', user?.account_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('accounts')
        .select('id, name')
        .eq('id', user!.account_id!)
        .single();
      return data;
    },
    enabled: !!user?.account_id,
  });
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const getAvatarColor = (name: string) => {
    const colors = ['bg-purple-600', 'bg-blue-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600', 'bg-cyan-600'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const userRoleLabel = user?.role === 'ADMIN_GERAL' ? 'Super Admin' : user?.role === 'FUNCIONARIO' ? (user.cargo || 'Funcionário') : 'Administrador';

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-[220px] glass-sidebar flex flex-col shrink-0 border-r border-border">
        {/* Company header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
              {account?.name?.charAt(0) || 'C'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">{account?.name || 'Empresa'}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" />
                {teamMembers.length} membros
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-0.5">
          {navItems.map(item => {
            const active = location.pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mx-3 my-2 border-t border-border" />

        {/* Meu Time */}
        <div className="px-3 flex-1 min-h-0 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Meu Time</p>
          <div className="space-y-1">
            {teamMembers.map(member => (
              <div key={member.id} className="flex items-center gap-2 py-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0 ${getAvatarColor(member.name)}`}>
                  {getInitials(member.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{member.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{member.cargo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer: theme toggle + user + logout */}
        <div className="p-3 border-t border-border mt-auto space-y-2">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent w-full transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">
              {user?.name?.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{userRoleLabel}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-destructive w-full transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
};

export default AppLayout;
