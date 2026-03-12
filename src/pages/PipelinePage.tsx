import { useState, useMemo, useCallback } from 'react';
import { mockLeads, Lead } from '@/data/mock-data';
import { User, Phone, Calendar, MessageCircle, Download, Settings, Users } from 'lucide-react';
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

const statusDotColors: Record<string, string> = {
  purple: 'bg-purple',
  primary: 'bg-primary',
  success: 'bg-success',
  destructive: 'bg-destructive',
  warning: 'bg-warning',
};

type PeriodFilter = 'all' | 'today' | 'yesterday' | '7days' | '30days' | 'this_month' | 'last_month' | 'custom';

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
    case 'today':
      return { start: today, end: new Date(today.getTime() + 86400000 - 1) };
    case 'yesterday': {
      const y = new Date(today.getTime() - 86400000);
      return { start: y, end: new Date(today.getTime() - 1) };
    }
    case '7days':
      return { start: new Date(today.getTime() - 7 * 86400000), end: now };
    case '30days':
      return { start: new Date(today.getTime() - 30 * 86400000), end: now };
    case 'this_month':
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
    case 'last_month': {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { start: s, end: e };
    }
    default:
      return { start: null, end: null };
  }
}

// Draggable card wrapper
function DraggableCard({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn('transition-shadow', isDragging && 'opacity-50 shadow-xl scale-105 z-50')}
    >
      {children}
    </div>
  );
}

// Droppable column wrapper
function DroppableColumn({ id, children, isOver }: { id: string; children: React.ReactNode; isOver?: boolean }) {
  const { setNodeRef, isOver: over } = useDroppable({ id });
  const active = isOver || over;
  return (
    <div ref={setNodeRef} className={cn('min-w-[280px] w-[280px] shrink-0 rounded-lg p-1 transition-colors', active && 'ring-2 ring-primary/60 bg-primary/5')}>
      {children}
    </div>
  );
}

// CSV export
function exportLeadsCSV(leads: Lead[], statuses: PipelineStatus[]) {
  if (leads.length === 0) {
    toast({ title: 'Nenhum lead para exportar' });
    return;
  }
  toast({ title: 'Exportando leads...' });

  const statusMap = Object.fromEntries(statuses.map(s => [s.id, s.name]));
  const header = 'Nome;Telefone;Email;Status;Temperatura;Origem;Data do Agendamento;Tags;Observações;Data de Criação';
  const fmtDate = (d: string) => {
    try { return format(new Date(d), 'dd/MM/yyyy HH:mm'); } catch { return d; }
  };
  const rows = leads.map(l =>
    [l.name, l.phone, '', statusMap[l.pipeline_status] || l.pipeline_status, '', '', fmtDate(l.scheduled_at), l.tags.join(', '), l.notes, fmtDate(l.created_at)].map(v => `"${(v || '').replace(/"/g, '""')}"`).join(';')
  );

  const bom = '\uFEFF';
  const csv = bom + header + '\n' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `leads_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  toast({ title: `${leads.length} leads exportados com sucesso` });
}

const PipelinePage = () => {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [statuses, setStatuses] = useState<PipelineStatus[]>(INITIAL_STATUSES);
  const [showManageStatus, setShowManageStatus] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Period filter state
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const [periodOpen, setPeriodOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Filtered leads
  const filteredLeads = useMemo(() => {
    if (period === 'all') return leads;
    if (period === 'custom') {
      if (!customStart || !customEnd) return leads;
      return leads.filter(l => {
        const d = new Date(l.created_at);
        return d >= customStart && d <= new Date(customEnd.getTime() + 86400000 - 1);
      });
    }
    const { start, end } = getDateRange(period);
    if (!start || !end) return leads;
    return leads.filter(l => {
      const d = new Date(l.created_at);
      return d >= start && d <= end;
    });
  }, [leads, period, customStart, customEnd]);

  const leadCountByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(l => { counts[l.pipeline_status] = (counts[l.pipeline_status] || 0) + 1; });
    return counts;
  }, [leads]);

  const visibleStatuses = useMemo(() => statuses.filter(s => s.visible), [statuses]);

  const periodLabel = useMemo(() => {
    if (period === 'custom' && customStart && customEnd) {
      return `${format(customStart, 'dd/MM')} - ${format(customEnd, 'dd/MM')}`;
    }
    return PERIOD_OPTIONS.find(p => p.value === period)?.label || 'Todo Período';
  }, [period, customStart, customEnd]);

  // DnD handlers
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline CRM</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie seus leads e oportunidades</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Period Filter */}
          <Popover open={periodOpen} onOpenChange={setPeriodOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Calendar className="w-4 h-4" /> {periodLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-1" align="end">
              <div className="flex flex-col">
                {PERIOD_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setPeriod(opt.value);
                      if (opt.value !== 'custom') setPeriodOpen(false);
                    }}
                    className={cn(
                      'text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors',
                      period === opt.value && 'bg-accent text-accent-foreground font-medium'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {period === 'custom' && (
                <div className="border-t border-border mt-1 pt-2 px-2 pb-2 space-y-2">
                  <div className="text-xs text-muted-foreground">De:</div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start text-sm">
                        {customStart ? format(customStart, 'dd/MM/yyyy') : 'Selecionar...'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarPicker mode="single" selected={customStart} onSelect={setCustomStart} className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <div className="text-xs text-muted-foreground">Até:</div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start text-sm">
                        {customEnd ? format(customEnd, 'dd/MM/yyyy') : 'Selecionar...'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarPicker mode="single" selected={customEnd} onSelect={setCustomEnd} className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <Button size="sm" className="w-full" onClick={() => setPeriodOpen(false)} disabled={!customStart || !customEnd}>
                    Aplicar
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="w-4 h-4" /> {filteredLeads.length} leads no total
          </span>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportLeadsCSV(filteredLeads, statuses)}>
            <Download className="w-4 h-4" /> Exportar
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowManageStatus(true)}>
            <Settings className="w-4 h-4" /> Gerenciar Status
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {visibleStatuses.map((status) => {
            const columnLeads = filteredLeads.filter((l) => l.pipeline_status === status.id);
            return (
              <DroppableColumn key={status.id} id={status.id}>
                {/* Column Header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${statusDotColors[status.color] || 'bg-muted-foreground'}`} />
                  <span className="text-sm font-semibold text-foreground">{status.name}</span>
                  <span className="bg-primary/20 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                    {columnLeads.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-3">
                  {columnLeads.length === 0 ? (
                    <div className="bg-card border border-border rounded-lg p-6 flex flex-col items-center text-center">
                      <User className="w-8 h-8 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">Nenhum lead neste status</p>
                    </div>
                  ) : (
                    columnLeads.map((lead) => (
                      <DraggableCard key={lead.id} id={lead.id}>
                        <div
                          onClick={() => setSelectedLead(lead)}
                          className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors"
                        >
                          <p className="text-sm font-semibold text-foreground mb-1">{lead.name}</p>
                          <p className="text-xs text-primary flex items-center gap-1 mb-2">
                            <Phone className="w-3 h-3" /> {lead.phone}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                            <Calendar className="w-3 h-3" /> {new Date(lead.scheduled_at).toLocaleDateString('pt-BR')}
                          </p>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {lead.symptoms.map((s) => (
                              <span key={s} className="bg-primary/15 text-primary text-[10px] font-medium px-2 py-0.5 rounded-full">{s}</span>
                            ))}
                            {lead.interest && (
                              <span className="bg-success/15 text-success text-[10px] font-medium px-2 py-0.5 rounded-full truncate max-w-[200px]">
                                {lead.interest}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              let phone = lead.phone.replace(/\D/g, '');
                              if (!phone.startsWith('55')) phone = '55' + phone;
                              window.open(`https://wa.me/${phone}`, '_blank', 'noopener,noreferrer');
                            }}
                            className="flex items-center justify-center gap-2 w-full bg-success/20 hover:bg-success/30 text-success text-xs font-medium py-2 rounded-md transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> Chamar no WhatsApp
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
            <div className="bg-card border-2 border-primary rounded-lg p-4 shadow-2xl opacity-90 w-[270px]">
              <p className="text-sm font-semibold text-foreground">{draggedLead.name}</p>
              <p className="text-xs text-primary">{draggedLead.phone}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {selectedLead && (
        <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}

      <ManageStatusModal
        open={showManageStatus}
        onClose={() => setShowManageStatus(false)}
        statuses={statuses}
        onSave={setStatuses}
        leadCountByStatus={leadCountByStatus}
      />
    </div>
  );
};

export default PipelinePage;
