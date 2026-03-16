import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/contexts/ThemeContext';
import { Shield, Sun, Moon, CheckCircle2 } from 'lucide-react';

const SetupPage = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'ADMIN_GERAL' as any)
        .limit(1);
      if (data && data.length > 0) {
        navigate('/', { replace: true });
      } else {
        setChecking(false);
      }
    };
    checkAdmin();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role: 'ADMIN_GERAL' } },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.user) {
        await supabase
          .from('profiles')
          .update({ role: 'ADMIN_GERAL' as any, account_id: null })
          .eq('id', data.user.id);
      }

      setSuccess(true);
      setTimeout(() => navigate('/', { replace: true }), 2000);
    } catch {
      setError('Erro ao conectar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
        title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      <div className="w-full max-w-sm">
        <div className="glass-card border border-border rounded-md p-6">
          {success ? (
            <div className="text-center py-4">
              <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <h2 className="text-page-title text-foreground">Administrador criado!</h2>
              <p className="text-muted-foreground text-xs mt-2">Faça login para continuar.</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-10 h-10 bg-primary rounded flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-page-title text-foreground">Configuração Inicial</h1>
                <p className="text-muted-foreground text-xs mt-1">Crie a conta de administrador da plataforma</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-label text-muted-foreground mb-1">Nome completo</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
                    placeholder="Seu nome"
                    required
                  />
                </div>
                <div>
                  <label className="block text-label text-muted-foreground mb-1">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
                    placeholder="admin@empresa.com"
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
                    placeholder="Mínimo 8 caracteres"
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <label className="block text-label text-muted-foreground mb-1">Confirmar senha</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                </div>

                {error && <p className="text-xs text-destructive">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary hover:bg-primary/85 text-primary-foreground font-medium py-2 rounded text-[13px] disabled:opacity-60"
                >
                  {submitting ? 'Criando...' : 'Criar conta de administrador'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetupPage;
