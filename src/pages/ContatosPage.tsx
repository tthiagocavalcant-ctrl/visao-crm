import { useState, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users, Users2, Search, Filter, Download, Pencil, MessageSquare, GitBranch,
  Clock, StickyNote, X, Plus, ChevronLeft, ChevronRight, Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PAGE_SIZE = 50;

const CANAL_OPTIONS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'trafego_pago', label: 'Tráfego Pago' },
  { value: 'google', label: 'Google' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'outro', label: 'Outro' },
];

const TEMP_OPTIONS = [
  { value: 'frio', label: '🔵 Frio' },
  { value: 'morno', label: '🟡 Aquecido' },
  { value: 'quente', label: '🔴 Quente' },
];

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  empresa: string;
  cargo: string;
  canal: string;
  temperature: string;
  tags: string[];
  notes: string;
  pipeline_status: string;
  created_at: string;
}

interface PipelineStatus {
  slug: string;
  name: string;
  color: string;
}

const statusColorMap: Record<string, string> = {
  purple: 'bg-purple text-purple-foreground',
  primary: 'bg-primary text-primary-foreground',
  success: 'bg-success text-success-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  warning: 'bg-warning text-warning-foreground',
};

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function getAvatarColor(name: string) {
  const colors = [
    'bg-purple-600', 'bg-blue-600', 'bg-emerald-600',
    'bg-amber-600', 'bg-rose-600', 'bg-cyan-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, '');
  if (d.length === 13) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}

function exportContactsCSV(leads: Lead[], statuses: PipelineStatus[]) {
  if (!leads.length) { toast({ title: 'Nenhum contato para exportar' }); return; }
  const statusMap = Object.fromEntries(statuses.map(s => [s.slug, s.name]));
  const header = 'Nome;Telefone;Email;Empresa;Cargo;Origem;Status Pipeline;Tags;Criado em';
  const fmtDate = (d: string) => { try { return format(new Date(d), 'dd/MM/yyyy HH:mm'); } catch { return d; } };
  const rows = leads.map(l =>
    [l.name, l.phone, l.email || '', l.empresa || '', l.cargo || '', l.canal || '', statusMap[l.pipeline_status] || l.pipeline_status, (l.tags || []).join(', '), fmtDate(l.created_at)]
      .map(v => `"${(v || '').replace(/"/g, '""')}"`)
      .join(';')
  );
  const bom = '\uFEFF';
  const csv = bom + header + '\n' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `contatos_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast({ title: `${leads.length} contatos exportados` });
}

// ============== MAIN PAGE ==============
const ContatosPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const accountId = user?.account_id || '';

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelTab, setPanelTab] = useState('perfil');

  // Fetch leads
  const { data: leads = [] } = useQuery({
    queryKey: ['contatos', accountId],
    queryFn: async () => {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });
      return (data || []) as unknown as Lead[];
    },
    enabled: !!accountId,
  });

  // Fetch statuses
  const { data: statuses = [] } = useQuery({
    queryKey: ['pipeline_statuses', accountId],
    queryFn: async () => {
      const { data } = await supabase
        .from('pipeline_statuses')
        .select('slug, name, color')
        .eq('account_id', accountId)
        .order('position');
      return (data || []) as PipelineStatus[];
    },
    enabled: !!accountId,
  });

  const statusMap = useMemo(() => Object.fromEntries(statuses.map(s => [s.slug, s])), [statuses]);

  const filtered = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.phone.includes(q) ||
      (l.email || '').toLowerCase().includes(q)
    );
  }, [leads, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const selectedLead = leads.find(l => l.id === selectedId) || null;

  const openPanel = (id: string, tab = 'perfil') => {
    setSelectedId(id);
    setPanelTab(tab);
  };

  return (
    <div className="flex h-[calc(100vh-48px)] -m-6">
      {/* Mini sidebar */}
      <div className="w-[72px] shrink-0 flex flex-col items-center pt-4 gap-4 border-r border-border" style={{ background: 'hsl(var(--sidebar-background) / 0.7)' }}>
        <button
          className="flex flex-col items-center gap-1 px-2 py-2 rounded-md text-xs font-medium"
          style={{ color: '#7c3aed' }}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">Contatos</span>
        </button>
        <button
          onClick={() => toast({ title: 'Em breve' })}
          className="flex flex-col items-center gap-1 px-2 py-2 rounded-md text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Users2 className="w-5 h-5" />
          <span className="text-[10px]">Grupos</span>
        </button>
      </div>

      {/* Central area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center gap-3 flex-wrap">
          <h1 className="text-lg font-semibold text-foreground">Contatos</h1>
          <Badge variant="secondary" className="text-xs">{filtered.length} contatos</Badge>
          <div className="flex-1" />
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="pl-9 h-8 text-xs"
            />
          </div>
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => exportContactsCSV(filtered, statuses)}>
            <Download className="w-3.5 h-3.5" /> Exportar CSV
          </Button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground w-8">#</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Nome</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Telefone</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Empresa</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Status Pipeline</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Tags</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground w-32">Ações</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((lead, i) => {
                const st = statusMap[lead.pipeline_status];
                const tags = lead.tags || [];
                return (
                  <tr
                    key={lead.id}
                    className="border-b border-border/50 hover:bg-accent/40 transition-colors cursor-pointer group"
                    onClick={() => openPanel(lead.id)}
                  >
                    <td className="px-4 py-2 text-xs text-muted-foreground">{page * PAGE_SIZE + i + 1}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${getAvatarColor(lead.name)}`}>
                          {getInitials(lead.name)}
                        </div>
                        <span className="text-foreground font-medium truncate max-w-[180px]">{lead.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground text-xs">{formatPhone(lead.phone)}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {lead.email ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="truncate max-w-[140px] block">{lead.email}</span>
                          </TooltipTrigger>
                          <TooltipContent>{lead.email}</TooltipContent>
                        </Tooltip>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{lead.empresa || '—'}</td>
                    <td className="px-4 py-2">
                      {st ? (
                        <span className={`status-badge text-[10px] ${statusColorMap[st.color] || 'bg-secondary text-secondary-foreground'}`}>
                          {st.name}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">{lead.pipeline_status}</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        {tags.slice(0, 2).map(t => (
                          <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0">{t}</Badge>
                        ))}
                        {tags.length > 2 && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">+{tags.length - 2}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip><TooltipTrigger asChild>
                          <button className="p-1.5 rounded hover:bg-accent" onClick={() => openPanel(lead.id, 'perfil')}><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                        </TooltipTrigger><TooltipContent>Editar</TooltipContent></Tooltip>

                        <Tooltip><TooltipTrigger asChild>
                          <button className="p-1.5 rounded hover:bg-accent" onClick={() => {
                            const phone = lead.phone.replace(/\D/g, '');
                            window.open(`https://wa.me/${phone}`, '_blank', 'noopener,noreferrer');
                          }}><MessageSquare className="w-3.5 h-3.5 text-muted-foreground" /></button>
                        </TooltipTrigger><TooltipContent>WhatsApp</TooltipContent></Tooltip>

                        <MoveStatusPopover lead={lead} statuses={statuses} accountId={accountId} />

                        <Tooltip><TooltipTrigger asChild>
                          <button className="p-1.5 rounded hover:bg-accent" onClick={() => openPanel(lead.id, 'agendamento')}><Clock className="w-3.5 h-3.5 text-muted-foreground" /></button>
                        </TooltipTrigger><TooltipContent>Agendar</TooltipContent></Tooltip>

                        <Tooltip><TooltipTrigger asChild>
                          <button className="p-1.5 rounded hover:bg-accent" onClick={() => openPanel(lead.id, 'notas')}><StickyNote className="w-3.5 h-3.5 text-muted-foreground" /></button>
                        </TooltipTrigger><TooltipContent>Notas</TooltipContent></Tooltip>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paged.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">Nenhum contato encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length}
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="text-xs gap-1">
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="text-xs gap-1">
                Next <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedLead && (
        <DetailPanel
          lead={selectedLead}
          statuses={statuses}
          statusMap={statusMap}
          accountId={accountId}
          tab={panelTab}
          onTabChange={setPanelTab}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
};

// ============== MOVE STATUS POPOVER ==============
function MoveStatusPopover({ lead, statuses, accountId }: { lead: Lead; statuses: PipelineStatus[]; accountId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const move = async (slug: string) => {
    await supabase.from('leads').update({ pipeline_status: slug } as any).eq('id', lead.id);
    await supabase.from('interactions').insert({
      account_id: accountId,
      lead_id: lead.id,
      type: 'status_change',
      description: `Status alterado para ${statuses.find(s => s.slug === slug)?.name || slug}`,
    } as any);
    qc.invalidateQueries({ queryKey: ['contatos', accountId] });
    toast({ title: `Lead movido para ${statuses.find(s => s.slug === slug)?.name || slug}` });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Tooltip><TooltipTrigger asChild>
          <button className="p-1.5 rounded hover:bg-accent"><GitBranch className="w-3.5 h-3.5 text-muted-foreground" /></button>
        </TooltipTrigger><TooltipContent>Mover pipeline</TooltipContent></Tooltip>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="end">
        {statuses.map(s => (
          <button
            key={s.slug}
            onClick={() => move(s.slug)}
            className={`w-full text-left px-3 py-1.5 text-xs rounded hover:bg-accent transition-colors flex items-center gap-2 ${lead.pipeline_status === s.slug ? 'bg-accent font-medium' : ''}`}
          >
            <span className={`w-2 h-2 rounded-full ${statusColorMap[s.color]?.split(' ')[0] || 'bg-secondary'}`} />
            {s.name}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// ============== DETAIL PANEL ==============
function DetailPanel({
  lead, statuses, statusMap, accountId, tab, onTabChange, onClose,
}: {
  lead: Lead; statuses: PipelineStatus[]; statusMap: Record<string, PipelineStatus>;
  accountId: string; tab: string; onTabChange: (t: string) => void; onClose: () => void;
}) {
  const st = statusMap[lead.pipeline_status];

  return (
    <div className="w-[380px] shrink-0 border-l border-border flex flex-col bg-card animate-in slide-in-from-right-10 duration-200">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-start gap-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0 ${getAvatarColor(lead.name)}`}>
          {getInitials(lead.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{lead.name}</p>
          <p className="text-xs text-muted-foreground">{formatPhone(lead.phone)}</p>
          {st && (
            <span className={`status-badge text-[10px] mt-1 ${statusColorMap[st.color] || 'bg-secondary text-secondary-foreground'}`}>
              {st.name}
            </span>
          )}
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-accent"><X className="w-4 h-4 text-muted-foreground" /></button>
      </div>

      <Tabs value={tab} onValueChange={onTabChange} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-2 bg-muted/50">
          <TabsTrigger value="perfil" className="text-xs">Perfil</TabsTrigger>
          <TabsTrigger value="funil" className="text-xs">Funil</TabsTrigger>
          <TabsTrigger value="agendamento" className="text-xs">Agendamento</TabsTrigger>
          <TabsTrigger value="notas" className="text-xs">Notas</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto">
          <TabsContent value="perfil" className="m-0 p-4">
            <ProfileTab lead={lead} accountId={accountId} />
          </TabsContent>
          <TabsContent value="funil" className="m-0 p-4">
            <FunnelTab lead={lead} statuses={statuses} accountId={accountId} />
          </TabsContent>
          <TabsContent value="agendamento" className="m-0 p-4">
            <ScheduleTab lead={lead} accountId={accountId} />
          </TabsContent>
          <TabsContent value="notas" className="m-0 p-4">
            <NotesTab lead={lead} accountId={accountId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// ============== PROFILE TAB ==============
function ProfileTab({ lead, accountId }: { lead: Lead; accountId: string }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: lead.name,
    empresa: lead.empresa || '',
    cargo: lead.cargo || '',
    email: lead.email || '',
    phone: lead.phone,
    canal: lead.canal || 'outro',
    temperature: lead.temperature || 'frio',
    notes: lead.notes || '',
    tags: lead.tags || [],
  });
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset form when lead changes
  const leadId = lead.id;
  useState(() => {
    setForm({
      name: lead.name,
      empresa: lead.empresa || '',
      cargo: lead.cargo || '',
      email: lead.email || '',
      phone: lead.phone,
      canal: lead.canal || 'outro',
      temperature: lead.temperature || 'frio',
      notes: lead.notes || '',
      tags: lead.tags || [],
    });
  });

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('leads').update({
      name: form.name,
      empresa: form.empresa,
      cargo: form.cargo,
      email: form.email,
      phone: form.phone,
      canal: form.canal,
      temperature: form.temperature,
      notes: form.notes,
      tags: form.tags,
    } as any).eq('id', lead.id);
    setSaving(false);
    if (error) { toast({ title: 'Erro ao salvar', variant: 'destructive' }); return; }
    qc.invalidateQueries({ queryKey: ['contatos', accountId] });
    toast({ title: 'Contato atualizado' });
  };

  const addTag = () => {
    if (newTag.trim() && !form.tags.includes(newTag.trim())) {
      setForm(f => ({ ...f, tags: [...f.tags, newTag.trim()] }));
      setNewTag('');
    }
  };

  const removeTag = (t: string) => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }));

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-3">
      <Field label="Nome"><Input value={form.name} onChange={e => set('name', e.target.value)} className="h-8 text-xs" /></Field>
      <Field label="Empresa"><Input value={form.empresa} onChange={e => set('empresa', e.target.value)} className="h-8 text-xs" /></Field>
      <Field label="Cargo"><Input value={form.cargo} onChange={e => set('cargo', e.target.value)} className="h-8 text-xs" /></Field>
      <Field label="Email"><Input value={form.email} onChange={e => set('email', e.target.value)} className="h-8 text-xs" /></Field>
      <Field label="Telefone"><Input value={form.phone} onChange={e => set('phone', e.target.value)} className="h-8 text-xs" /></Field>
      <Field label="Origem do Lead">
        <select value={form.canal} onChange={e => set('canal', e.target.value)} className="w-full bg-input border border-border rounded px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary">
          {CANAL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </Field>
      <Field label="Temperatura">
        <select value={form.temperature} onChange={e => set('temperature', e.target.value)} className="w-full bg-input border border-border rounded px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary">
          {TEMP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </Field>
      <Field label="Observação">
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
          className="w-full bg-input border border-border rounded px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary resize-none" />
      </Field>
      <Field label="Tags">
        <div className="flex flex-wrap gap-1 mb-1.5">
          {form.tags.map(t => (
            <Badge key={t} variant="secondary" className="text-[10px] gap-1 pr-1">
              {t}
              <button onClick={() => removeTag(t)}><X className="w-2.5 h-2.5" /></button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-1">
          <Input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Nova tag" className="h-7 text-xs flex-1"
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
          <Button size="sm" variant="outline" className="h-7 px-2" onClick={addTag}><Plus className="w-3 h-3" /></Button>
        </div>
      </Field>
      <Button className="w-full text-xs" size="sm" onClick={save} disabled={saving}>
        {saving ? 'Salvando...' : 'Salvar Alterações'}
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] text-muted-foreground mb-1 font-medium">{label}</label>
      {children}
    </div>
  );
}

// ============== FUNNEL TAB ==============
function FunnelTab({ lead, statuses, accountId }: { lead: Lead; statuses: PipelineStatus[]; accountId: string }) {
  const qc = useQueryClient();
  const st = statuses.find(s => s.slug === lead.pipeline_status);

  const move = async (slug: string) => {
    if (slug === lead.pipeline_status) return;
    const statusName = statuses.find(s => s.slug === slug)?.name || slug;
    await supabase.from('leads').update({ pipeline_status: slug } as any).eq('id', lead.id);
    await supabase.from('interactions').insert({
      account_id: accountId,
      lead_id: lead.id,
      type: 'status_change',
      description: `Status alterado para ${statusName}`,
    } as any);
    qc.invalidateQueries({ queryKey: ['contatos', accountId] });
    toast({ title: `Lead movido para ${statusName}` });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium text-muted-foreground">Mover na Pipeline</p>
      {st && (
        <div className="text-center">
          <span className={`status-badge text-xs ${statusColorMap[st.color] || 'bg-secondary text-secondary-foreground'}`}>{st.name}</span>
        </div>
      )}
      <div className="space-y-1.5">
        {statuses.map(s => (
          <button
            key={s.slug}
            onClick={() => move(s.slug)}
            className={`w-full text-left px-3 py-2 text-xs rounded border transition-colors flex items-center gap-2 ${
              lead.pipeline_status === s.slug
                ? 'border-primary bg-primary/10 font-medium text-foreground'
                : 'border-border hover:bg-accent text-muted-foreground'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${statusColorMap[s.color]?.split(' ')[0] || 'bg-secondary'}`} />
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============== SCHEDULE TAB ==============
function ScheduleTab({ lead, accountId }: { lead: Lead; accountId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [scheduledAt, setScheduledAt] = useState('');
  const [type, setType] = useState('text');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: reminders = [] } = useQuery({
    queryKey: ['lead_reminders', lead.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('lead_reminders')
        .select('*')
        .eq('lead_id', lead.id)
        .order('scheduled_at', { ascending: false });
      return data || [];
    },
  });

  const save = async () => {
    if (!scheduledAt || !content.trim()) { toast({ title: 'Preencha data e mensagem', variant: 'destructive' }); return; }
    setSaving(true);
    const { error } = await supabase.from('lead_reminders').insert({
      account_id: accountId,
      lead_id: lead.id,
      created_by: user?.id,
      type,
      content: content.trim(),
      scheduled_at: scheduledAt,
      status: 'pending',
    } as any);
    setSaving(false);
    if (error) { toast({ title: 'Erro ao agendar', variant: 'destructive' }); return; }
    qc.invalidateQueries({ queryKey: ['lead_reminders', lead.id] });
    setScheduledAt(''); setContent(''); setType('text');
    toast({ title: 'Agendamento criado' });
  };

  const cancel = async (id: string) => {
    await supabase.from('lead_reminders').update({ status: 'cancelled' } as any).eq('id', id);
    qc.invalidateQueries({ queryKey: ['lead_reminders', lead.id] });
    toast({ title: 'Agendamento cancelado' });
  };

  const typeLabels: Record<string, string> = { text: 'Mensagem de texto', reminder: 'Lembrete interno', call: 'Ligação' };
  const statusBadge: Record<string, string> = {
    pending: 'bg-warning/20 text-warning',
    sent: 'bg-success/20 text-success',
    cancelled: 'bg-destructive/20 text-destructive',
  };

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium text-muted-foreground">Agendar Mensagem</p>
      <div className="space-y-2.5">
        <Field label="Data e hora">
          <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="h-8 text-xs" />
        </Field>
        <Field label="Tipo">
          <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-input border border-border rounded px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary">
            <option value="text">Mensagem de texto</option>
            <option value="reminder">Lembrete interno</option>
            <option value="call">Ligação</option>
          </select>
        </Field>
        <Field label="Mensagem">
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={4}
            className="w-full bg-input border border-border rounded px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary resize-none" />
        </Field>
        <Button className="w-full text-xs" size="sm" onClick={save} disabled={saving}>
          {saving ? 'Agendando...' : 'Agendar'}
        </Button>
      </div>

      {reminders.length > 0 && (
        <div className="space-y-2 mt-4">
          <p className="text-xs font-medium text-muted-foreground">Agendamentos anteriores</p>
          {reminders.map((r: any) => (
            <div key={r.id} className="border border-border rounded p-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">
                    {format(new Date(r.scheduled_at), "dd/MM/yyyy 'às' HH:mm")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusBadge[r.status] || ''}`}>
                    {r.status === 'pending' ? 'Pendente' : r.status === 'sent' ? 'Enviado' : 'Cancelado'}
                  </span>
                  {r.status === 'pending' && (
                    <button onClick={() => cancel(r.id)} className="p-0.5 rounded hover:bg-accent">
                      <X className="w-3 h-3 text-destructive" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-foreground line-clamp-2">{r.content}</p>
              <span className="text-[10px] text-muted-foreground">{typeLabels[r.type] || r.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============== NOTES TAB ==============
function NotesTab({ lead, accountId }: { lead: Lead; accountId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: notes = [] } = useQuery({
    queryKey: ['lead_notes', lead.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('lead_notes')
        .select('*, profiles:created_by(name)')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const save = async () => {
    if (!content.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('lead_notes').insert({
      account_id: accountId,
      lead_id: lead.id,
      created_by: user?.id,
      content: content.trim(),
    } as any);
    setSaving(false);
    if (error) { toast({ title: 'Erro ao salvar nota', variant: 'destructive' }); return; }
    qc.invalidateQueries({ queryKey: ['lead_notes', lead.id] });
    setContent(''); setShowForm(false);
    toast({ title: 'Nota adicionada' });
  };

  const remove = async (id: string) => {
    await supabase.from('lead_notes').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['lead_notes', lead.id] });
    toast({ title: 'Nota removida' });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Notas</p>
        <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => setShowForm(true)}>
          <Plus className="w-3 h-3" /> Nova Nota
        </Button>
      </div>

      {showForm && (
        <div className="space-y-2 border border-border rounded p-2.5">
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={3}
            className="w-full bg-input border border-border rounded px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary resize-none"
            placeholder="Escreva sua nota..." autoFocus />
          <div className="flex gap-1.5 justify-end">
            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => { setShowForm(false); setContent(''); }}>Cancelar</Button>
            <Button size="sm" className="text-xs h-7" onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </div>
      )}

      {notes.map((n: any) => (
        <div key={n.id} className="border border-border rounded p-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold ${getAvatarColor((n.profiles as any)?.name || 'U')}`}>
                {getInitials((n.profiles as any)?.name || 'U')}
              </div>
              <span className="text-xs font-medium text-foreground">{(n.profiles as any)?.name || 'Usuário'}</span>
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
              </span>
            </div>
            {n.created_by === user?.id && (
              <button onClick={() => remove(n.id)} className="p-0.5 rounded hover:bg-accent">
                <Trash2 className="w-3 h-3 text-destructive" />
              </button>
            )}
          </div>
          <p className="text-xs text-foreground">{n.content}</p>
        </div>
      ))}

      {notes.length === 0 && !showForm && (
        <p className="text-xs text-muted-foreground text-center py-6">Nenhuma nota para este contato</p>
      )}
    </div>
  );
}

export default ContatosPage;
