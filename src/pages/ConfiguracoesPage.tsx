import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tables } from '@/integrations/supabase/types';
import { BRAZILIAN_STATES } from '@/data/mock-data';
import {
  Copy, Building2, Users, Upload, Plus, Pencil, Trash2, Eye, EyeOff, RefreshCw,
  Kanban, LayoutDashboard, Download, Shield,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

type Account = Tables<'accounts'>;
type Profile = Tables<'profiles'>;
type Unit = Tables<'units'>;

interface EmployeePermissions {
  pipeline: boolean;
  dashboard: boolean;
  export_leads: boolean;
  delete_leads: boolean;
  manage_statuses: boolean;
  conversas: boolean;
}

const DEFAULT_EMPLOYEE_PERMISSIONS: EmployeePermissions = {
  pipeline: true, dashboard: false, export_leads: false,
  delete_leads: false, manage_statuses: false, conversas: false,
};

const tabs = ['Empresa', 'Unidades', 'Equipe'];

const ConfiguracoesPage = () => {
  const { user } = useAuth();
  const accountId = user?.account_id;
  const [activeTab, setActiveTab] = useState('Empresa');

  const { data: account } = useQuery({
    queryKey: ['my-account', accountId],
    queryFn: async () => {
      const { data, error } = await supabase.from('accounts').select('*').eq('id', accountId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!accountId,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-page-title text-foreground">Configurações</h1>
        <p className="text-muted-foreground text-xs mt-0.5">Gerencie as configurações da sua conta</p>
      </div>

      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Empresa' && account && <EmpresaTab account={account} />}
      {activeTab === 'Unidades' && <UnidadesTab />}
      {activeTab === 'Equipe' && <EquipeTab />}
    </div>
  );
};

const EmpresaTab = ({ account }: { account: Account }) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState(account.name);
  const [whatsappLink, setWhatsappLink] = useState(account.whatsapp_link || '');
  const [timezone, setTimezone] = useState(account.timezone || 'America/Sao_Paulo');

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('accounts').update({ name, whatsapp_link: whatsappLink, timezone }).eq('id', account.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-account'] });
      toast({ title: 'Configurações salvas!' });
    },
    onError: () => toast({ title: 'Erro ao salvar', variant: 'destructive' }),
  });

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded p-4 space-y-3">
        <div><h3 className="text-section-title uppercase text-muted-foreground">Informações da Empresa</h3></div>
        <div>
          <label className="block text-label text-muted-foreground mb-1">Nome da Empresa</label>
          <Input value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-label text-muted-foreground mb-1">Logo da Empresa</label>
          <div className="border border-dashed border-border rounded p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Clique ou arraste para enviar</p>
          </div>
        </div>
        <div>
          <label className="block text-label text-muted-foreground mb-1">Link do WhatsApp</label>
          <Input value={whatsappLink} onChange={e => setWhatsappLink(e.target.value)} placeholder="https://wa.me/5511900000000" />
        </div>
        <div>
          <label className="block text-label text-muted-foreground mb-1">Fuso Horário</label>
          <Input value={timezone} onChange={e => setTimezone(e.target.value)} />
        </div>
      </div>
      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full">
        {saveMutation.isPending ? 'Salvando...' : '💾 Salvar Configurações'}
      </Button>
    </div>
  );
};

/* ==================== UNIDADES TAB ==================== */

const UnidadesTab = () => {
  const { user } = useAuth();
  const accountId = user?.account_id;
  const queryClient = useQueryClient();

  const { data: units = [] } = useQuery({
    queryKey: ['units', accountId],
    queryFn: async () => {
      const { data, error } = await supabase.from('units').select('*').eq('account_id', accountId!);
      if (error) throw error;
      return data;
    },
    enabled: !!accountId,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [form, setForm] = useState({ name: '', address: '', city: '', state: '', phone: '', responsible: '', status: 'active' as 'active' | 'inactive' });

  const resetForm = () => setForm({ name: '', address: '', city: '', state: '', phone: '', responsible: '', status: 'active' });
  const openCreate = () => { setEditingUnit(null); resetForm(); setModalOpen(true); };
  const openEdit = (u: Unit) => {
    setEditingUnit(u);
    setForm({ name: u.name, address: u.address || '', city: u.city || '', state: u.state || '', phone: u.phone || '', responsible: u.responsible || '', status: (u.status as 'active' | 'inactive') || 'active' });
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingUnit) {
        const { error } = await supabase.from('units').update(form).eq('id', editingUnit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('units').insert({ ...form, account_id: accountId! });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', accountId] });
      toast({ title: editingUnit ? 'Unidade atualizada' : 'Unidade criada' });
      setModalOpen(false);
    },
    onError: () => toast({ title: 'Erro ao salvar unidade', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('units').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', accountId] });
      toast({ title: 'Unidade excluída' });
    },
  });

  const handleSave = () => {
    if (!form.name.trim()) { toast({ title: 'Preencha o nome da unidade', variant: 'destructive' }); return; }
    saveMutation.mutate();
  };

  const activeCount = units.filter(u => u.status === 'active').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Unidades — {activeCount} ativas</span>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-1"><Plus className="w-3.5 h-3.5" /> Nova Unidade</Button>
      </div>

      {units.length === 0 ? (
        <div className="bg-card border border-border rounded p-8 text-center">
          <Building2 className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma unidade cadastrada</p>
          <Button onClick={openCreate} size="sm" className="mt-3 gap-1"><Plus className="w-3.5 h-3.5" /> Criar Primeira Unidade</Button>
        </div>
      ) : (
        <div className="border border-border rounded overflow-hidden">
          {units.map((u, i) => (
            <div key={u.id} className={`flex items-center justify-between px-4 h-12 border-b border-border last:border-0 table-row-hover ${i % 2 === 0 ? 'table-row-even' : 'table-row-odd'}`}>
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{u.name}</p>
                  <p className="text-[11px] text-muted-foreground">{[u.city, u.state].filter(Boolean).join(' / ')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`status-badge ${u.status === 'active' ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {u.status === 'active' ? 'Ativa' : 'Inativa'}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(u)}><Pencil className="w-3.5 h-3.5" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir unidade</AlertDialogTitle>
                      <AlertDialogDescription>Tem certeza que deseja excluir "{u.name}"?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMutation.mutate(u.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUnit ? 'Editar Unidade' : 'Nova Unidade'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 px-6 py-3">
            <div className="space-y-1"><Label>Nome da Unidade *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Unidade Centro" /></div>
            <div className="space-y-1"><Label>Endereço</Label><Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Cidade</Label><Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} /></div>
              <div className="space-y-1">
                <Label>Estado</Label>
                <Select value={form.state} onValueChange={v => setForm(p => ({ ...p, state: v }))}>
                  <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>{BRAZILIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Responsável</Label><Input value={form.responsible} onChange={e => setForm(p => ({ ...p, responsible: e.target.value }))} /></div>
            <div className="flex items-center gap-3">
              <Label>Status</Label>
              <Switch checked={form.status === 'active'} onCheckedChange={v => setForm(p => ({ ...p, status: v ? 'active' : 'inactive' }))} />
              <span className="text-xs text-muted-foreground">{form.status === 'active' ? 'Ativa' : 'Inativa'}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>✓ {editingUnit ? 'Salvar' : 'Criar Unidade'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ==================== EQUIPE TAB ==================== */

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const PERMISSION_ITEMS: { key: keyof EmployeePermissions; label: string; description: string; icon: any }[] = [
  { key: 'pipeline', label: 'Pipeline CRM', description: 'Visualizar e gerenciar leads', icon: Kanban },
  { key: 'dashboard', label: 'Dashboard', description: 'Visualizar métricas e gráficos', icon: LayoutDashboard },
  { key: 'export_leads', label: 'Exportar leads', description: 'Usar o botão de exportar', icon: Download },
  { key: 'delete_leads', label: 'Excluir leads', description: 'Pode deletar leads', icon: Trash2 },
  { key: 'manage_statuses', label: 'Gerenciar Status', description: 'Adicionar/editar status do pipeline', icon: Shield },
];

interface EmployeeFormState {
  name: string; email: string; password: string; cargo: string;
  permissions: EmployeePermissions; active: boolean;
}

const emptyEmployeeForm = (): EmployeeFormState => ({
  name: '', email: '', password: generatePassword(), cargo: '',
  permissions: { ...DEFAULT_EMPLOYEE_PERMISSIONS }, active: true,
});

const EquipeTab = () => {
  const { user } = useAuth();
  const accountId = user?.account_id;
  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('account_id', accountId!)
        .neq('role', 'ADMIN_GERAL');
      if (error) throw error;
      return data;
    },
    enabled: !!accountId,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [form, setForm] = useState<EmployeeFormState>(emptyEmployeeForm());
  const [showCredentials, setShowCredentials] = useState<{ email: string; password: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const openCreate = () => { setEditing(null); setForm(emptyEmployeeForm()); setShowPassword(false); setModalOpen(true); };
  const openEdit = (e: Profile) => {
    setEditing(e);
    const perms = (e.permissions as any as EmployeePermissions) || { ...DEFAULT_EMPLOYEE_PERMISSIONS };
    setForm({ name: e.name, email: e.email, password: '', cargo: e.cargo || '', permissions: { ...perms }, active: e.active ?? true });
    setShowPassword(false); setModalOpen(true);
  };

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const { error } = await supabase.from('profiles').update({
        name: form.name,
        cargo: form.cargo,
        permissions: form.permissions as any,
        active: form.active,
      }).eq('id', editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', accountId] });
      toast({ title: 'Funcionário atualizado' });
      setModalOpen(false);
    },
    onError: () => toast({ title: 'Erro ao atualizar', variant: 'destructive' }),
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async () => {
      // Create auth user via supabase admin (this would need an edge function in production)
      // For now, we create the profile directly
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            name: form.name,
            role: 'FUNCIONARIO',
            account_id: accountId,
          },
        },
      });
      if (authError) throw authError;
      // Profile is auto-created by handle_new_user trigger
      // Update permissions
      if (authData.user) {
        const { error } = await supabase.from('profiles').update({
          cargo: form.cargo,
          permissions: form.permissions as any,
        }).eq('id', authData.user.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', accountId] });
      setModalOpen(false);
      setShowCredentials({ email: form.email, password: form.password });
    },
    onError: (e: any) => toast({ title: e.message || 'Erro ao criar funcionário', variant: 'destructive' }),
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('profiles').update({ active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', accountId] });
      toast({ title: 'Acesso do funcionário desativado' });
    },
  });

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) { toast({ title: 'Preencha nome e email', variant: 'destructive' }); return; }
    if (!editing && !form.password.trim()) { toast({ title: 'Defina uma senha', variant: 'destructive' }); return; }
    if (editing) {
      updateProfileMutation.mutate();
    } else {
      createEmployeeMutation.mutate();
    }
  };

  const handleResetPassword = () => {
    const newPw = generatePassword();
    setForm(prev => ({ ...prev, password: newPw })); setShowPassword(true);
    toast({ title: 'Nova senha gerada' });
  };

  const copyText = (text: string) => { navigator.clipboard.writeText(text); toast({ title: 'Copiado!' }); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Equipe — {employees.length} membros</span>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-1">👤 Novo Funcionário</Button>
      </div>

      {employees.length === 0 ? (
        <div className="bg-card border border-border rounded p-8 text-center">
          <Users className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum funcionário cadastrado</p>
          <Button onClick={openCreate} size="sm" className="mt-3">👤 Adicionar Primeiro</Button>
        </div>
      ) : (
        <div className="border border-border rounded overflow-hidden">
          {employees.map((emp, i) => {
            const perms = (emp.permissions as any as EmployeePermissions) || DEFAULT_EMPLOYEE_PERMISSIONS;
            return (
              <div key={emp.id} className={`flex items-center justify-between px-4 h-12 border-b border-border last:border-0 table-row-hover ${i % 2 === 0 ? 'table-row-even' : 'table-row-odd'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[11px] font-bold shrink-0">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{emp.name}</p>
                    <p className="text-[11px] text-muted-foreground">{emp.email}</p>
                  </div>
                  {emp.cargo && <span className="text-[11px] bg-accent text-accent-foreground px-2 py-0.5 rounded">{emp.cargo}</span>}
                  <div className="flex items-center gap-1 ml-1">
                    {perms.pipeline && <Kanban className="w-3 h-3 text-muted-foreground" />}
                    {perms.dashboard && <LayoutDashboard className="w-3 h-3 text-muted-foreground" />}
                    {perms.export_leads && <Download className="w-3 h-3 text-muted-foreground" />}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`status-badge ${emp.active ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {emp.active ? 'Ativo' : 'Inativo'}
                  </span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(emp)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover funcionário</AlertDialogTitle>
                        <AlertDialogDescription>O acesso de "{emp.name}" será desativado.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deactivateMutation.mutate(emp.id)} className="bg-destructive text-destructive-foreground">Remover</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Employee Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Funcionário' : 'Novo Funcionário'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 px-6 py-3">
            <div className="space-y-1"><Label>Nome completo *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="space-y-1">
              <Label>Email de acesso *</Label>
              <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} disabled={!!editing} />
            </div>
            {!editing && (
              <div className="space-y-1">
                <Label>Senha provisória *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setForm(p => ({ ...p, password: generatePassword() }))}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1" /> Gerar
                  </Button>
                </div>
              </div>
            )}
            <div className="space-y-1"><Label>Cargo / Função</Label><Input value={form.cargo} onChange={e => setForm(p => ({ ...p, cargo: e.target.value }))} placeholder="Vendedor, Atendente..." /></div>

            {editing && (
              <div className="space-y-2 pt-2 border-t border-border">
                <Label className="text-[11px] text-muted-foreground">Redefinir Senha</Label>
                {showPassword && form.password ? (
                  <div className="flex gap-2 items-center">
                    <Input value={form.password} readOnly className="font-mono text-xs" />
                    <Button variant="outline" size="sm" onClick={() => copyText(form.password)}><Copy className="w-3.5 h-3.5" /></Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleResetPassword}><RefreshCw className="w-3.5 h-3.5 mr-1" /> Gerar Nova Senha</Button>
                )}
              </div>
            )}

            {editing && (
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <Label>Acesso ativo</Label>
                <Switch checked={form.active} onCheckedChange={v => setForm(p => ({ ...p, active: v }))} />
                <span className="text-xs text-muted-foreground">{form.active ? 'Ativo' : 'Desativado'}</span>
              </div>
            )}

            <div className="pt-3 border-t border-border">
              <Label className="text-sm font-semibold text-foreground">Permissões de Acesso</Label>
              <p className="text-[11px] text-muted-foreground mb-2">Funcionários nunca têm acesso a Configurações.</p>
              <div className="space-y-1">
                {PERMISSION_ITEMS.map(pi => (
                  <label key={pi.key} className="flex items-center gap-3 p-1.5 rounded hover:bg-accent cursor-pointer">
                    <Checkbox checked={form.permissions[pi.key]} onCheckedChange={(v) => setForm(p => ({ ...p, permissions: { ...p.permissions, [pi.key]: !!v } }))} />
                    <pi.icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm text-foreground">{pi.label}</p>
                      <p className="text-[11px] text-muted-foreground">{pi.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={updateProfileMutation.isPending || createEmployeeMutation.isPending}>
              ✓ {editing ? 'Salvar Alterações' : 'Criar Funcionário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Success Modal */}
      <Dialog open={!!showCredentials} onOpenChange={() => setShowCredentials(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Acesso criado!</DialogTitle></DialogHeader>
          <div className="px-6 py-3">
            <p className="text-xs text-muted-foreground mb-3">Compartilhe com o funcionário:</p>
            {showCredentials && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Email</Label>
                  <div className="flex gap-2">
                    <Input value={showCredentials.email} readOnly className="font-mono text-xs" />
                    <Button variant="outline" size="sm" onClick={() => copyText(showCredentials.email)}><Copy className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Senha</Label>
                  <div className="flex gap-2">
                    <Input value={showCredentials.password} readOnly className="font-mono text-xs" />
                    <Button variant="outline" size="sm" onClick={() => copyText(showCredentials.password)}><Copy className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter><Button onClick={() => setShowCredentials(null)} className="w-full">Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConfiguracoesPage;
