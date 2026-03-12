import { useState } from 'react';
import { mockAccount, mockEmployees, mockUnits, BRAZILIAN_TIMEZONES, BRAZILIAN_STATES, DEFAULT_EMPLOYEE_PERMISSIONS, Employee, EmployeePermissions, Unit } from '@/data/mock-data';
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

const tabs = ['Empresa', 'Unidades', 'Equipe'];

const ConfiguracoesPage = () => {
  const [activeTab, setActiveTab] = useState('Empresa');
  const [account] = useState(mockAccount);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie as configurações da sua conta</p>
      </div>

      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Empresa' && <EmpresaTab account={account} />}
      {activeTab === 'Unidades' && <UnidadesTab />}
      {activeTab === 'Equipe' && <EquipeTab />}
    </div>
  );
};

const InputField = ({ label, helper, value, placeholder, onChange }: {
  label: string; helper?: string; value?: string; placeholder?: string; onChange?: (v: string) => void;
}) => (
  <div>
    <label className="block text-sm text-muted-foreground mb-1">{label}</label>
    <input
      defaultValue={value}
      placeholder={placeholder}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
    />
    {helper && <p className="text-xs text-muted-foreground mt-1">{helper}</p>}
  </div>
);

const EmpresaTab = ({ account }: { account: typeof mockAccount }) => (
  <div className="space-y-6">
    <div className="bg-card border border-border rounded-lg p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">ℹ Informações da Empresa</h3>
        <p className="text-xs text-muted-foreground">Dados que aparecem nos formulários públicos</p>
      </div>
      <InputField label="Nome da Empresa" value={account.name} />
      <div>
        <label className="block text-sm text-muted-foreground mb-1">Logo da Empresa</label>
        <div className="border-2 border-dashed border-border rounded-md p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
          <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Clique ou arraste para enviar</p>
          <p className="text-xs text-muted-foreground/70">JPG, PNG, WEBP ou GIF (máx. 5MB)</p>
        </div>
      </div>
      <InputField label="Link do WhatsApp" value={account.whatsapp_link} placeholder="https://wa.me/5511900000000" helper="Será redirecionado https://wa.me/numero" />
      <InputField label="Fuso Horário" value={account.timezone} placeholder="America/Sao_Paulo" />
    </div>

    <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 rounded-md transition-colors">
      💾 Salvar Configurações
    </button>
  </div>
);

/* ==================== UNIDADES TAB ==================== */

const emptyUnit = (): Omit<Unit, 'id' | 'created_at'> => ({
  account_id: mockAccount.id, name: '', address: '', city: '', state: '', phone: '', responsible: '', status: 'active',
});

const UnidadesTab = () => {
  const [units, setUnits] = useState<Unit[]>(mockUnits);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [form, setForm] = useState<Omit<Unit, 'id' | 'created_at'>>(emptyUnit());

  const openCreate = () => { setEditingUnit(null); setForm(emptyUnit()); setModalOpen(true); };
  const openEdit = (u: Unit) => { setEditingUnit(u); setForm({ ...u }); setModalOpen(true); };

  const handleSave = () => {
    if (!form.name.trim()) { toast({ title: 'Preencha o nome da unidade', variant: 'destructive' }); return; }
    if (editingUnit) {
      setUnits(prev => prev.map(u => u.id === editingUnit.id ? { ...editingUnit, ...form } : u));
      toast({ title: 'Unidade atualizada com sucesso' });
    } else {
      const newUnit: Unit = { ...form, id: `unit-${Date.now()}`, created_at: new Date().toISOString() };
      setUnits(prev => [...prev, newUnit]);
      toast({ title: 'Unidade criada com sucesso' });
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setUnits(prev => prev.filter(u => u.id !== id));
    toast({ title: 'Unidade excluída' });
  };

  const activeCount = units.filter(u => u.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Unidades</h3>
            <p className="text-xs text-muted-foreground">Configure as filiais e pontos de atendimento</p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-1.5" size="sm"><Plus className="w-4 h-4" /> Nova Unidade</Button>
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <h4 className="text-sm font-semibold text-foreground mb-4">📍 Localizações — {activeCount} unidades ativas</h4>
        {units.length === 0 ? (
          <div className="py-10 text-center">
            <Building2 className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Nenhuma unidade cadastrada</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Crie unidades para organizar sua equipe e formulários por localização</p>
            <Button onClick={openCreate} className="mt-4 gap-1.5" size="sm"><Plus className="w-4 h-4" /> Criar Primeira Unidade</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {units.map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 rounded-md border border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{[u.city, u.state].filter(Boolean).join(' / ')}</p>
                    {u.responsible && <p className="text-xs text-muted-foreground">Responsável: {u.responsible} {u.phone && `• ${u.phone}`}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={u.status === 'active' ? 'bg-success/20 text-success border-success/30' : 'bg-muted text-muted-foreground'}>
                    {u.status === 'active' ? 'Ativa' : 'Inativa'}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(u)}><Pencil className="w-4 h-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="sm"><Trash2 className="w-4 h-4 text-destructive" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir unidade</AlertDialogTitle>
                        <AlertDialogDescription>Tem certeza que deseja excluir "{u.name}"?</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(u.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUnit ? 'Editar Unidade' : 'Nova Unidade'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
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
            <div className="space-y-1"><Label>Telefone da Unidade</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Responsável pela Unidade</Label><Input value={form.responsible} onChange={e => setForm(p => ({ ...p, responsible: e.target.value }))} /></div>
            <div className="flex items-center gap-3">
              <Label>Status</Label>
              <Switch checked={form.status === 'active'} onCheckedChange={v => setForm(p => ({ ...p, status: v ? 'active' : 'inactive' }))} />
              <span className="text-sm text-muted-foreground">{form.status === 'active' ? 'Ativa' : 'Inativa'}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>✓ {editingUnit ? 'Salvar' : 'Criar Unidade'}</Button>
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
  name: string;
  email: string;
  password: string;
  cargo: string;
  permissions: EmployeePermissions;
  active: boolean;
}

const emptyEmployeeForm = (): EmployeeFormState => ({
  name: '', email: '', password: generatePassword(), cargo: '',
  permissions: { ...DEFAULT_EMPLOYEE_PERMISSIONS }, active: true,
});

const EquipeTab = () => {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeFormState>(emptyEmployeeForm());
  const [showCredentials, setShowCredentials] = useState<{ email: string; password: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const openCreate = () => { setEditing(null); setForm(emptyEmployeeForm()); setShowPassword(false); setModalOpen(true); };
  const openEdit = (e: Employee) => {
    setEditing(e);
    setForm({ name: e.name, email: e.email, password: '', cargo: e.cargo, permissions: { ...e.permissions }, active: e.active });
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) { toast({ title: 'Preencha nome e email', variant: 'destructive' }); return; }
    if (!editing && !form.password.trim()) { toast({ title: 'Defina uma senha', variant: 'destructive' }); return; }

    if (editing) {
      setEmployees(prev => prev.map(e => e.id === editing.id ? {
        ...e, name: form.name, cargo: form.cargo, permissions: form.permissions, active: form.active,
      } : e));
      toast({ title: 'Funcionário atualizado com sucesso' });
      setModalOpen(false);
    } else {
      const newEmp: Employee = {
        id: `emp-${Date.now()}`, account_id: mockAccount.id, name: form.name, email: form.email,
        role: 'FUNCIONARIO', cargo: form.cargo, permissions: form.permissions, active: true,
        created_at: new Date().toISOString(),
      };
      setEmployees(prev => [...prev, newEmp]);
      setModalOpen(false);
      setShowCredentials({ email: form.email, password: form.password });
    }
  };

  const handleResetPassword = () => {
    const newPw = generatePassword();
    setForm(prev => ({ ...prev, password: newPw }));
    setShowPassword(true);
    toast({ title: 'Nova senha gerada' });
  };

  const handleDeactivate = (id: string) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, active: false } : e));
    toast({ title: 'Acesso do funcionário desativado' });
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado!' });
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Gestão de Equipe</h3>
            <p className="text-xs text-muted-foreground">Adicione funcionários e configure permissões de acesso</p>
          </div>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-1.5">👤 Novo Funcionário</Button>
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <h4 className="text-sm font-semibold text-foreground mb-4">👥 Funcionários — {employees.length} membros na equipe</h4>
        {employees.length === 0 ? (
          <div className="py-10 text-center">
            <Users className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Nenhum funcionário cadastrado</p>
            <Button onClick={openCreate} className="mt-4" size="sm">👤 Adicionar Primeiro Funcionário</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {employees.map(emp => (
              <div key={emp.id} className="flex items-center justify-between p-3 rounded-md border border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">{emp.email}</p>
                  </div>
                  {emp.cargo && <Badge variant="outline" className="text-xs">{emp.cargo}</Badge>}
                  <div className="flex items-center gap-1 ml-2">
                    {emp.permissions.pipeline && <Kanban className="w-3.5 h-3.5 text-muted-foreground" title="Pipeline" />}
                    {emp.permissions.dashboard && <LayoutDashboard className="w-3.5 h-3.5 text-muted-foreground" title="Dashboard" />}
                    {emp.permissions.export_leads && <Download className="w-3.5 h-3.5 text-muted-foreground" title="Exportar" />}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={emp.active ? 'bg-success/20 text-success border-success/30' : 'bg-muted text-muted-foreground'}>
                    {emp.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(emp)}><Pencil className="w-4 h-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="sm"><Trash2 className="w-4 h-4 text-destructive" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover funcionário</AlertDialogTitle>
                        <AlertDialogDescription>O acesso de "{emp.name}" será desativado.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeactivate(emp.id)} className="bg-destructive text-destructive-foreground">Remover</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Employee Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Funcionário' : 'Novo Funcionário'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
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
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setForm(p => ({ ...p, password: generatePassword() }))}>
                    <RefreshCw className="w-4 h-4 mr-1" /> Gerar
                  </Button>
                </div>
              </div>
            )}
            <div className="space-y-1"><Label>Cargo / Função</Label><Input value={form.cargo} onChange={e => setForm(p => ({ ...p, cargo: e.target.value }))} placeholder="Vendedor, Atendente..." /></div>

            {editing && (
              <div className="space-y-2 pt-2 border-t border-border">
                <Label className="text-xs text-muted-foreground">Redefinir Senha</Label>
                {showPassword && form.password ? (
                  <div className="flex gap-2 items-center">
                    <Input value={form.password} readOnly className="font-mono text-sm" />
                    <Button variant="outline" size="sm" onClick={() => copyText(form.password)}><Copy className="w-4 h-4" /></Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleResetPassword}><RefreshCw className="w-4 h-4 mr-1" /> Gerar Nova Senha</Button>
                )}
              </div>
            )}

            {editing && (
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <Label>Acesso ativo</Label>
                <Switch checked={form.active} onCheckedChange={v => setForm(p => ({ ...p, active: v }))} />
                <span className="text-sm text-muted-foreground">{form.active ? 'Ativo' : 'Desativado'}</span>
              </div>
            )}

            <div className="pt-3 border-t border-border">
              <Label className="text-sm font-semibold text-foreground">Permissões de Acesso</Label>
              <p className="text-xs text-muted-foreground mb-3">Funcionários nunca têm acesso a Configurações.</p>
              <div className="space-y-2">
                {PERMISSION_ITEMS.map(pi => (
                  <label key={pi.key} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer">
                    <Checkbox
                      checked={form.permissions[pi.key]}
                      onCheckedChange={(v) => setForm(p => ({ ...p, permissions: { ...p.permissions, [pi.key]: !!v } }))}
                    />
                    <pi.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm text-foreground">{pi.label}</p>
                      <p className="text-xs text-muted-foreground">{pi.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>✓ {editing ? 'Salvar Alterações' : 'Criar Funcionário'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Success Modal */}
      <Dialog open={!!showCredentials} onOpenChange={() => setShowCredentials(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Acesso criado!</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Compartilhe com o funcionário:</p>
          {showCredentials && (
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <div className="flex gap-2">
                  <Input value={showCredentials.email} readOnly className="font-mono text-sm" />
                  <Button variant="outline" size="sm" onClick={() => copyText(showCredentials.email)}><Copy className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Senha</Label>
                <div className="flex gap-2">
                  <Input value={showCredentials.password} readOnly className="font-mono text-sm" />
                  <Button variant="outline" size="sm" onClick={() => copyText(showCredentials.password)}><Copy className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          )}
          <Button onClick={() => setShowCredentials(null)} className="w-full">Fechar</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConfiguracoesPage;
