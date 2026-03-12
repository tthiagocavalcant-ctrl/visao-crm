import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Users, UserPlus, Bell, LogOut, ChevronRight } from 'lucide-react';

const navItems = [
  { label: 'Clientes', icon: Users, href: '/admin/clientes' },
  { label: 'Novo Cliente', icon: UserPlus, href: '/admin/clientes/novo' },
];

const SuperAdminLayout = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const currentNav = navItems.find((n) => location.pathname === n.href) || navItems[0];
  const breadcrumbs = [
    { label: 'Super Admin', href: '/admin/clientes' },
    ...(currentNav ? [{ label: currentNav.label, href: currentNav.href }] : []),
  ];

  // For dynamic config pages
  if (location.pathname.includes('/configurar')) {
    breadcrumbs.push({ label: 'Configurar', href: location.pathname });
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-60 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
        <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
          <span className="font-bold text-foreground text-lg tracking-tight">🛡️ Super Admin</span>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
              {user?.name?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">Super Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-1 text-sm">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                <Link
                  to={b.href}
                  className={i === breadcrumbs.length - 1 ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}
                >
                  {b.label}
                </Link>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
