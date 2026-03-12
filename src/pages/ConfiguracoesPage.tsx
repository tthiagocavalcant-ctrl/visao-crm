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

      {activeTab === 'Empresa' && <EmpresaTab account={account} />}
      {activeTab === 'Unidades' && <UnidadesTab />}
      {activeTab === 'Equipe' && <EquipeTab />}
    </div>
  );
};

const EmpresaTab = ({ account }: { account: typeof mockAccount }) => (
  <div className="space-y-4">
    <div className="bg-card border border-border rounded p-4 space-y-3">
      <div>
        <h3 className="text-section-title uppercase text-muted-foreground">Informações da Empresa</h3>
      </div>
      <div>
        <label className="block text-label text-muted-foreground mb-1">Nome da Empresa</label>
        <Input defaultValue={account.name} />
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
        <Input defaultValue={account.whatsapp_link} placeholder="https://wa.me/5511900000000" />
      </div>
      <div>
        <label className="block text-label text-muted-foreground mb-1">Fuso Horário</label>
        <Input defaultValue={account.timezone} />
      </div>
    </div>
    <Button className="w-full">💾 Salvar Configurações</Button>
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
                      <AlertDialogAction onClick={() => handleDelete(u.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
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
  name: string; email: string; password: string; cargo: string;
  permissions: EmployeePermissions; active: boolean;
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
    setShowPassword(false); setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) { toast({ title: 'Preencha nome e email', variant: 'destructive' }); return; }
    if (!editing && !form.password.trim()) { toast({ title: 'Defina uma senha', variant: 'destructive' }); return; }
    if (editing) {
      setEmployees(prev => prev.map(e => e.id === editing.id ? { ...e, name: form.name, cargo: form.cargo, permissions: form.permissions, active: form.active } : e));
      toast({ title: 'Funcionário atualizado com sucesso' }); setModalOpen(false);
    } else {
      const newEmp: Employee = {
        id: `emp-${Date.now()}`, account_id: mockAccount.id, name: form.name, email: form.email,
        role: 'FUNCIONARIO', cargo: form.cargo, permissions: form.permissions, active: true, created_at: new Date().toISOString(),
      };
      setEmployees(prev => [...prev, newEmp]); setModalOpen(false);
      setShowCredentials({ email: form.email, password: form.password });
    }
  };

  const handleResetPassword = () => {
    const newPw = generatePassword();
    setForm(prev => ({ ...prev, password: newPw })); setShowPassword(true);
    toast({ title: 'Nova senha gerada' });
  };

  const handleDeactivate = (id: string) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, active: false } : e));
    toast({ title: 'Acesso do funcionário desativado' });
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
          {employees.map((emp, i) => (
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
                  {emp.permissions.pipeline && <Kanban className="w-3 h-3 text-muted-foreground" />}
                  {emp.permissions.dashboard && <LayoutDashboard className="w-3 h-3 text-muted-foreground" />}
                  {emp.permissions.export_leads && <Download className="w-3 h-3 text-muted-foreground" />}
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
                      <AlertDialogAction onClick={() => handleDeactivate(emp.id)} className="bg-destructive text-destructive-foreground">Remover</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
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
            <Button onClick={handleSave}>✓ {editing ? 'Salvar Alterações' : 'Criar Funcionário'}</Button>
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
