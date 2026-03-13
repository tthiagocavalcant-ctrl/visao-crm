import { useState, useMemo, useCallback } from 'react';
import { mockLeads, Lead } from '@/data/mock-data';
import { User, Phone, Calendar, MessageCircle, Download, Settings, Users, List, Kanban as KanbanIcon, ChevronDown, ChevronRight } from 'lucide-react';
import LeadDetailModal from '@/components/pipeline/LeadDetailModal';
import ManageStatusModal, { PipelineStatus } from '@/components/pipeline/ManageStatusModal';
import { toast } from '@/hooks/use-toast';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, useDroppable, closestCenter } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const INITIAL_STATUSES: PipelineStatus[] = [
  { id: 'lead', name: 'LEAD', color: 'purple', visible: true },
  { id: 'agendou', name: 'Agendou exame', color: 'primary', visible: true },
  { id: 'confirmado', name: 'Confirmado', color: 'success', visible: true },
  { id: 'desqualificado', name: 'Desqualificado', color: 'destructive', visible: true },
  { id: 'followup', name: 'Follow Up', color: 'warning', visible: true },
  { id: 'nao_compareceu', name: 'Não compareceu', color: 'primary', visible: true },
  { id: 'compareceu', name: 'Compareceu', color: 'warning', visible: true },
];

const statusColors: Record<string, string> = {
  purple: 'bg-purple text-purple-foreground',
  primary: 'bg-primary text-primary-foreground',
  success: 'bg-success text-success-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  warning: 'bg-warning text-warning-foreground',
};

const statusDotColors: Record<string, string> = {
  purple: 'bg-purple',
  primary: 'bg-primary',
  success: 'bg-success',
  destructive: 'bg-destructive',
  warning: 'bg-warning',
};

type PeriodFilter = 'all' | 'today' | 'yesterday' | '7days' | '30days' | 'this_month' | 'last_month' | 'custom';
type ViewMode = 'kanban' | 'list';

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: 'all', label: 'Todo Período' },
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: '7days', label: 'Últimos 7 dias' },
  { value: '30days', label: 'Últimos 30 dias' },
  { value: 'this_month', label: 'Este mês' },
  { value: 'last_month', label: 'Mês passado' },
  { value: 'custom', label: 'Personalizado' },
];

function getDateRange(period: PeriodFilter): { start: Date | null; end: Date | null } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (period) {
    case 'today': return { start: today, end: new Date(today.getTime() + 86400000 - 1) };
    case 'yesterday': { const y = new Date(today.getTime() - 86400000); return { start: y, end: new Date(today.getTime() - 1) }; }
    case '7days': return { start: new Date(today.getTime() - 7 * 86400000), end: now };
    case '30days': return { start: new Date(today.getTime() - 30 * 86400000), end: now };
    case 'this_month': return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
    case 'last_month': { const s = new Date(now.getFullYear(), now.getMonth() - 1, 1); const e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59); return { start: s, end: e }; }
    default: return { start: null, end: null };
  }
}

function DraggableCard({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={cn('transition-shadow', isDragging && 'opacity-40 z-50')}>
      {children}
    </div>
  );
}

function DroppableColumn({ id, children, isOver }: { id: string; children: React.ReactNode; isOver?: boolean }) {
  const { setNodeRef, isOver: over } = useDroppable({ id });
  const active = isOver || over;
  return (
    <div ref={setNodeRef} className={cn('min-w-[260px] w-[260px] shrink-0 p-1 transition-colors rounded', active && 'ring-2 ring-primary/60 bg-primary/5')}>
      {children}
    </div>
  );
}

function exportLeadsCSV(leads: Lead[], statuses: PipelineStatus[]) {
  if (leads.length === 0) { toast({ title: 'Nenhum lead para exportar' }); return; }
  toast({ title: 'Exportando leads...' });
  const statusMap = Object.fromEntries(statuses.map(s => [s.id, s.name]));
  const header = 'Nome;Telefone;Email;Status;Temperatura;Origem;Data do Agendamento;Tags;Observações;Data de Criação';
  const fmtDate = (d: string) => { try { return format(new Date(d), 'dd/MM/yyyy HH:mm'); } catch { return d; } };
  const rows = leads.map(l =>
    [l.name, l.phone, '', statusMap[l.pipeline_status] || l.pipeline_status, '', '', fmtDate(l.scheduled_at), l.tags.join(', '), l.notes, fmtDate(l.created_at)].map(v => `"${(v || '').replace(/"/g, '""')}"`).join(';')
  );
  const bom = '\uFEFF';
  const csv = bom + header + '\n' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `leads_${format(new Date(), 'yyyy-MM-dd')}.csv`; a.click();
  URL.revokeObjectURL(url);
  toast({ title: `${leads.length} leads exportados com sucesso` });
}

const PipelinePage = () => {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [statuses, setStatuses] = useState<PipelineStatus[]>(INITIAL_STATUSES);
  const [showManageStatus, setShowManageStatus] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const [periodOpen, setPeriodOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const filteredLeads = useMemo(() => {
    if (period === 'all') return leads;
    if (period === 'custom') {
      if (!customStart || !customEnd) return leads;
      return leads.filter(l => { const d = new Date(l.created_at); return d >= customStart && d <= new Date(customEnd.getTime() + 86400000 - 1); });
    }
    const { start, end } = getDateRange(period);
    if (!start || !end) return leads;
    return leads.filter(l => { const d = new Date(l.created_at); return d >= start && d <= end; });
  }, [leads, period, customStart, customEnd]);

  const leadCountByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(l => { counts[l.pipeline_status] = (counts[l.pipeline_status] || 0) + 1; });
    return counts;
  }, [leads]);

  const visibleStatuses = useMemo(() => statuses.filter(s => s.visible), [statuses]);

  const periodLabel = useMemo(() => {
    if (period === 'custom' && customStart && customEnd) return `${format(customStart, 'dd/MM')} - ${format(customEnd, 'dd/MM')}`;
    return PERIOD_OPTIONS.find(p => p.value === period)?.label || 'Todo Período';
  }, [period, customStart, customEnd]);

  const handleDragStart = (event: DragStartEvent) => setActiveDragId(event.active.id as string);
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;
    const leadId = active.id as string;
    const newStatus = over.id as string;
    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.pipeline_status === newStatus) return;
    const statusName = statuses.find(s => s.id === newStatus)?.name || newStatus;
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, pipeline_status: newStatus } : l));
    toast({ title: `Lead movido para ${statusName}` });
  }, [leads, statuses]);

  const draggedLead = activeDragId ? leads.find(l => l.id === activeDragId) : null;

  // List view collapsed groups
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (id: string) => setCollapsedGroups(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-4">
      {/* Header toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-page-title text-foreground">Pipeline CRM</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex border border-border rounded overflow-hidden">
            <button onClick={() => setViewMode('list')} className={cn('px-2.5 py-1 text-xs flex items-center gap-1 transition-colors', viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-accent')}>
              <List className="w-3.5 h-3.5" /> Lista
            </button>
            <button onClick={() => setViewMode('kanban')} className={cn('px-2.5 py-1 text-xs flex items-center gap-1 transition-colors border-l border-border', viewMode === 'kanban' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-accent')}>
              <KanbanIcon className="w-3.5 h-3.5" /> Kanban
            </button>
          </div>

          {/* Period filter */}
          <Popover open={periodOpen} onOpenChange={setPeriodOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Calendar className="w-3.5 h-3.5" /> {periodLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-1" align="end">
              <div className="flex flex-col">
                {PERIOD_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => { setPeriod(opt.value); if (opt.value !== 'custom') setPeriodOpen(false); }}
                    className={cn('text-left px-3 py-1.5 text-xs rounded hover:bg-accent transition-colors', period === opt.value && 'bg-accent text-accent-foreground font-medium')}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {period === 'custom' && (
                <div className="border-t border-border mt-1 pt-2 px-2 pb-2 space-y-2">
                  <div className="text-[11px] text-muted-foreground">De:</div>
                  <Popover>
                    <PopoverTrigger asChild><Button variant="outline" size="sm" className="w-full justify-start text-xs">{customStart ? format(customStart, 'dd/MM/yyyy') : 'Selecionar...'}</Button></PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start"><CalendarPicker mode="single" selected={customStart} onSelect={setCustomStart} className="p-3 pointer-events-auto" /></PopoverContent>
                  </Popover>
                  <div className="text-[11px] text-muted-foreground">Até:</div>
                  <Popover>
                    <PopoverTrigger asChild><Button variant="outline" size="sm" className="w-full justify-start text-xs">{customEnd ? format(customEnd, 'dd/MM/yyyy') : 'Selecionar...'}</Button></PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start"><CalendarPicker mode="single" selected={customEnd} onSelect={setCustomEnd} className="p-3 pointer-events-auto" /></PopoverContent>
                  </Popover>
                  <Button size="sm" className="w-full text-xs" onClick={() => setPeriodOpen(false)} disabled={!customStart || !customEnd}>Aplicar</Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {filteredLeads.length} leads
          </span>
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => exportLeadsCSV(filteredLeads, statuses)}>
            <Download className="w-3.5 h-3.5" /> Exportar
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setShowManageStatus(true)}>
            <Settings className="w-3.5 h-3.5" /> Gerenciar Status
          </Button>
        </div>
      </div>

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="border border-border rounded overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_130px_140px_110px_100px_120px] bg-accent h-9 items-center px-4 text-label uppercase text-muted-foreground border-b border-border">
            <span>Nome</span>
            <span>Telefone</span>
            <span>Status</span>
            <span>Origem</span>
            <span>Tags</span>
            <span>Agendamento</span>
          </div>
          {visibleStatuses.map(status => {
            const groupLeads = filteredLeads.filter(l => l.pipeline_status === status.id);
            const collapsed = collapsedGroups[status.id];
            return (
              <div key={status.id}>
                {/* Group header */}
                <button onClick={() => toggleGroup(status.id)} className="w-full flex items-center gap-2 h-9 px-4 bg-muted border-b border-border hover:bg-accent transition-colors">
                  {collapsed ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                  <span className={`w-2 h-2 rounded-full ${statusDotColors[status.color] || 'bg-muted-foreground'}`} />
                  <span className="text-xs font-semibold text-foreground uppercase">{status.name}</span>
                  <span className="text-[11px] text-muted-foreground ml-1">{groupLeads.length}</span>
                </button>
                {!collapsed && groupLeads.map((lead, i) => (
                  <div key={lead.id} onClick={() => setSelectedLead(lead)}
                    className={`grid grid-cols-[1fr_130px_140px_110px_100px_120px] h-10 items-center px-4 border-b border-border cursor-pointer table-row-hover ${i % 2 === 0 ? 'table-row-even' : 'table-row-odd'}`}>
                    <span className="text-sm font-medium text-foreground truncate">{lead.name}</span>
                    <span className="text-xs text-muted-foreground">{lead.phone}</span>
                    <span className={`status-badge w-fit ${statusColors[status.color] || 'bg-muted text-foreground'}`}>{status.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{lead.canal || '—'}</span>
                    <div className="flex gap-1 overflow-hidden">
                      {lead.tags.slice(0, 2).map(t => <span key={t} className="text-[10px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded">{t}</span>)}
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(lead.scheduled_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {visibleStatuses.map((status) => {
              const columnLeads = filteredLeads.filter((l) => l.pipeline_status === status.id);
              return (
                <DroppableColumn key={status.id} id={status.id}>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span className={`w-2 h-2 rounded-full ${statusDotColors[status.color] || 'bg-muted-foreground'}`} />
                    <span className="text-xs font-semibold text-foreground uppercase">{status.name}</span>
                    <span className="text-[11px] text-muted-foreground">{columnLeads.length}</span>
                  </div>
                  <div className="space-y-1.5">
                    {columnLeads.length === 0 ? (
                      <div className="glass-card border border-border rounded p-4 flex flex-col items-center text-center">
                        <User className="w-6 h-6 text-muted-foreground/30 mb-1" />
                        <p className="text-xs text-muted-foreground">Nenhum lead</p>
                      </div>
                    ) : (
                      columnLeads.map((lead) => (
                        <DraggableCard key={lead.id} id={lead.id}>
                          <div onClick={() => setSelectedLead(lead)} className="glass-card border border-border rounded p-3 cursor-pointer hover:bg-card-hover">
                            <p className="text-sm font-medium text-foreground mb-0.5">{lead.name}</p>
                            <p className="text-[11px] text-primary flex items-center gap-1 mb-1.5">
                              <Phone className="w-3 h-3" /> {lead.phone}
                            </p>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mb-2">
                              <Calendar className="w-3 h-3" /> {new Date(lead.scheduled_at).toLocaleDateString('pt-BR')}
                            </p>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {lead.tags.map((t) => (
                                <span key={t} className="bg-accent text-accent-foreground text-[10px] font-medium px-1.5 py-0.5 rounded">{t}</span>
                              ))}
                            </div>
                            <button type="button" onClick={(e) => {
                              e.stopPropagation();
                              let phone = lead.phone.replace(/\D/g, '');
                              if (!phone.startsWith('55')) phone = '55' + phone;
                              window.open(`https://wa.me/${phone}`, '_blank', 'noopener,noreferrer');
                            }} className="flex items-center justify-center gap-1.5 w-full bg-success/15 hover:bg-success/25 text-success text-[11px] font-medium py-1.5 rounded transition-colors">
                              <MessageCircle className="w-3 h-3" /> Chamar no WhatsApp
                            </button>
                          </div>
                        </DraggableCard>
                      ))
                    )}
                  </div>
                </DroppableColumn>
              );
            })}
          </div>
          <DragOverlay>
            {draggedLead ? (
              <div className="glass-card border-2 border-primary rounded p-3 shadow-lg opacity-90 w-[250px]">
                <p className="text-sm font-medium text-foreground">{draggedLead.name}</p>
                <p className="text-[11px] text-primary">{draggedLead.phone}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onDelete={(leadId) => {
            setLeads(prev => prev.filter(l => l.id !== leadId));
            setSelectedLead(null);
          }}
          onUpdate={(updatedLead) => {
            setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
            setSelectedLead(updatedLead);
          }}
        />
      )}
      <ManageStatusModal open={showManageStatus} onClose={() => setShowManageStatus(false)} statuses={statuses} onSave={setStatuses} leadCountByStatus={leadCountByStatus} />
    </div>
  );
};

export default PipelinePage;
