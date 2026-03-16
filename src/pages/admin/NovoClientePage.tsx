import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ArrowLeft, Eye, EyeOff, RefreshCw, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BRAZILIAN_TIMEZONES } from '@/data/mock-data';

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const NovoClientePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({
    companyName: '',
    email: '',
    password: '',
    responsibleName: '',
    phone: '',
    status: true,
    whatsappLink: '',
    timezone: 'America/Sao_Paulo',
    permissions: { dashboard: true, pipeline: true, settings: true, reports: false },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: string, value: any) => setForm((p) => ({ ...p, [field]: value }));
  const updatePerm = (key: string, val: boolean) =>
    setForm((p) => ({ ...p, permissions: { ...p.permissions, [key]: val } }));

  const handleGenerate = () => {
    const pw = generatePassword();
    update('password', pw);
    setShowPassword(true);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmit = async () => {
    if (!form.companyName || !form.email || !form.password) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert({
          name: form.companyName,
          email: form.email,
          responsible_name: form.responsibleName,
          phone: form.phone,
          status: form.status ? 'active' as const : 'inactive' as const,
          whatsapp_link: form.whatsappLink || null,
          timezone: form.timezone,
          permissions: form.permissions,
        })
        .select()
        .single();

      if (error) {
        toast({ title: 'Erro ao criar cliente', description: error.message, variant: 'destructive' });
        return;
      }

      // Create admin user for this account
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { name: form.responsibleName || form.companyName, role: 'ADMIN', account_id: data.id } },
      });

      if (signUpError) {
        await supabase.from('accounts').delete().eq('id', data.id);
        toast({ title: 'Erro ao criar usuário', description: signUpError.message, variant: 'destructive' });
        return;
      }

      toast({ title: 'Cliente criado com sucesso!' });
      setShowCredentials(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <button
        onClick={() => navigate('/admin/clientes')}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Clientes
      </button>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Novo Cliente</h1>
        <p className="text-muted-foreground text-sm mt-1">Crie um novo acesso de cliente na plataforma</p>
      </div>

      {/* Account Info */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Informações da Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da Empresa *</Label>
            <Input value={form.companyName} onChange={(e) => update('companyName', e.target.value)} placeholder="Ex: Ótica Visão Clara" />
          </div>
          <div className="space-y-2">
            <Label>Email de Acesso *</Label>
            <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="email@empresa.com" />
          </div>
          <div className="space-y-2">
            <Label>Senha Provisória *</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="Senha de acesso"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button variant="outline" onClick={handleGenerate} className="gap-1.5 shrink-0">
                <RefreshCw className="w-3.5 h-3.5" />
                Gerar Senha
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Responsável</Label>
              <Input value={form.responsibleName} onChange={(e) => update('responsibleName', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="11999999999" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Label>Status</Label>
            <Switch checked={form.status} onCheckedChange={(v) => update('status', v)} />
            <span className="text-sm text-muted-foreground">{form.status ? 'Ativo' : 'Inativo'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Initial Config */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Configurações Iniciais</CardTitle>
          <CardDescription>Opcional — pode ser configurado depois</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Link do WhatsApp</Label>
            <Input value={form.whatsappLink} onChange={(e) => update('whatsappLink', e.target.value)} placeholder="https://wa.me/55..." />
          </div>
          <div className="space-y-2">
            <Label>Fuso Horário</Label>
            <Select value={form.timezone} onValueChange={(v) => update('timezone', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BRAZILIAN_TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Permissões</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: 'dashboard', label: 'Dashboard', enabled: true },
            { key: 'pipeline', label: 'Pipeline CRM', enabled: true },
            { key: 'settings', label: 'Configurações', enabled: true },
            { key: 'reports', label: 'Relatórios', enabled: false },
          ].map((perm) => (
            <div key={perm.key} className="flex items-center gap-3">
              <Checkbox
                checked={(form.permissions as any)[perm.key]}
                onCheckedChange={(v) => perm.enabled && updatePerm(perm.key, !!v)}
                disabled={!perm.enabled}
              />
              <span className={`text-sm ${perm.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>{perm.label}</span>
              {!perm.enabled && (
                <Badge variant="secondary" className="text-xs">Em breve</Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <Button variant="ghost" onClick={() => navigate('/admin/clientes')}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
          <Check className="w-4 h-4" />
          {submitting ? 'Criando...' : 'Criar Cliente'}
        </Button>
      </div>

      {/* Credentials Modal */}
      <Dialog open={showCredentials} onOpenChange={(open) => { if (!open) { setShowCredentials(false); navigate('/admin/clientes'); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acesso criado!</DialogTitle>
            <DialogDescription>Compartilhe as credenciais com o cliente</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Email</Label>
              <div className="flex items-center gap-2">
                <Input value={form.email} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="sm" onClick={() => handleCopy(form.email, 'email')}>
                  {copied === 'email' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Senha</Label>
              <div className="flex items-center gap-2">
                <Input value={form.password} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="sm" onClick={() => handleCopy(form.password, 'password')}>
                  {copied === 'password' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
          <Button onClick={() => { setShowCredentials(false); navigate('/admin/clientes'); }} className="w-full">
            Fechar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NovoClientePage;
