import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, Sun, Moon } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const success = await login(email, password);
    setSubmitting(false);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Credenciais inválidas. Verifique seu e-mail e senha.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
        title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      <div className="w-full max-w-sm">
        <div className="glass-card border border-border rounded-md p-6">
          <div className="text-center mb-6">
            <div className="w-10 h-10 bg-primary rounded flex items-center justify-center mx-auto mb-3">
              <LogIn className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-page-title text-foreground">Entrar no CRM</h1>
            <p className="text-muted-foreground text-xs mt-1">Acesse sua conta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-label text-muted-foreground mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
                placeholder="seu@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-label text-muted-foreground mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/85 text-primary-foreground font-medium py-2 rounded text-[13px]"
            >
              Entrar
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-[11px] text-muted-foreground text-center">
              Demo: <strong>admin@sistema.com</strong> (Super Admin) ou <strong>cliente@empresa.com</strong> (Cliente)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
