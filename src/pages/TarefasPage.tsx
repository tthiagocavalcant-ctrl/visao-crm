import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Plus, CalendarIcon, Trash2, Clock, User as UserIcon, AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';

type Task = Tables<'tasks'>;
type TaskActivity = Tables<'task_activities'>;
type Profile = Tables<'profiles'>;

const TASK_STATUSES = [
  { id: 'a_fazer' as const, name: 'A Fazer', icon: Circle, color: 'bg-primary/20 text-primary border-primary/40' },
  { id: 'em_andamento' as const, name: 'Em Andamento', icon: Clock, color: 'bg-warning/20 text-warning border-warning/40' },
  { id: 'concluido' as const, name: 'Concluído', icon: CheckCircle2, color: 'bg-success/20 text-success border-success/40' },
];

const PRIORITY_CONFIG = {
  alta: { label: 'Alta', dot: 'bg-destructive', badge: 'bg-destructive/20 text-destructive border-destructive/40' },
  media: { label: 'Média', dot: 'bg-warning', badge: 'bg-warning/20 text-warning border-warning/40' },
  baixa: { label: 'Baixa', dot: 'bg-success', badge: 'bg-success/20 text-success border-success/40' },
};

function DraggableTaskCard({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={cn('transition-shadow', isDragging && 'opacity-40 z-50')}>
      {children}
    </div>
  );
}

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={cn('flex-1 min-w-[280px] p-1 transition-colors rounded', isOver && 'ring-2 ring-primary/60 bg-primary/5')}>
      {children}
    </div>
  );
}

const TarefasPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const accountId = user?.account_id;
  const isAdmin = user?.role === 'ADMIN';
  const isFuncionario = user?.role === 'FUNCIONARIO';

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [tab, setTab] = useState<'all' | 'mine' | 'by_person'>('all');
  const [filterPerson, setFilterPerson] = useState<string>('');

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<'alta' | 'media' | 'baixa'>('media');
  const [formAssignedTo, setFormAssignedTo] = useState('');
  const [formDueDate, setFormDueDate] = useState<Date | undefined>();
  const [formStatus, setFormStatus] = useState<'a_fazer' | 'em_andamento' | 'concluido'>('a_fazer');
  const [formTags, setFormTags] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // ── Fetch tasks ──
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('account_id', accountId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!accountId,
  });

  // ── Fetch profiles (assignees) ──
  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('account_id', accountId!);
      if (error) throw error;
      return data;
    },
    enabled: !!accountId,
  });

  // ── Fetch task activities for selected task ──
  const { data: activities = [] } = useQuery({
    queryKey: ['task_activities', selectedTask?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_activities')
        .select('*')
        .eq('task_id', selectedTask!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedTask,
  });

  const allAssignees = useMemo(() => {
    return profiles.filter(p => p.active !== false).map(p => ({ id: p.id, name: p.name, cargo: p.cargo || '' }));
  }, [profiles]);

  const getAssigneeName = (id: string | null) => {
    if (!id) return 'Não atribuído';
    const p = profiles.find(p => p.id === id);
    return p?.name || 'Desconhecido';
  };

  const filteredTasks = useMemo(() => {
    let list = tasks;
    if (isFuncionario) {
      list = list.filter(t => t.assigned_to === user?.id);
    } else if (tab === 'mine') {
      list = list.filter(t => t.assigned_to === user?.id || t.created_by === user?.id);
    } else if (tab === 'by_person' && filterPerson) {
      list = list.filter(t => t.assigned_to === filterPerson);
    }
    return list;
  }, [tasks, user, isFuncionario, tab, filterPerson]);

  // ── Mutations ──
  const createTaskMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('tasks').insert({
        account_id: accountId!,
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        priority: formPriority,
        status: formStatus,
        assigned_to: formAssignedTo || null,
        created_by: user?.id,
        due_date: formDueDate ? format(formDueDate, 'yyyy-MM-dd') : null,
        tags: formTags ? formTags.split(',').map(t => t.trim()).filter(Boolean) : [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', accountId] });
      toast({ title: `Tarefa criada e atribuída para ${getAssigneeName(formAssignedTo)}` });
      setShowCreateModal(false);
      resetForm();
    },
    onError: () => toast({ title: 'Erro ao criar tarefa', variant: 'destructive' }),
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (updates: Partial<Task> & { id: string }) => {
      const { id, ...rest } = updates;
      const { error } = await supabase.from('tasks').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', accountId] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', accountId] });
      toast({ title: 'Tarefa excluída' });
      setSelectedTask(null);
      setShowDeleteConfirm(false);
    },
  });

  const addActivityMutation = useMutation({
    mutationFn: async (activity: { task_id: string; action: string; description: string }) => {
      const { error } = await supabase.from('task_activities').insert({
        ...activity,
        user_id: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_activities'] });
    },
  });

  const resetForm = () => {
    setFormTitle(''); setFormDescription(''); setFormPriority('media');
    setFormAssignedTo(''); setFormDueDate(undefined); setFormStatus('a_fazer'); setFormTags('');
  };

  const handleCreate = () => {
    if (!formTitle.trim() || !formAssignedTo) return;
    createTaskMutation.mutate();
  };

  const handleUpdateTask = (updated: Task) => {
    setSelectedTask(updated);
    updateTaskMutation.mutate({ id: updated.id, description: updated.description, priority: updated.priority, status: updated.status, assigned_to: updated.assigned_to, due_date: updated.due_date });
  };

  const handleDeleteTask = () => {
    if (!selectedTask) return;
    deleteTaskMutation.mutate(selectedTask.id);
  };

  const handleDragStart = (event: DragStartEvent) => setActiveDragId(event.active.id as string);
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;
    const newStatus = over.id as 'a_fazer' | 'em_andamento' | 'concluido';
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;
    const statusName = TASK_STATUSES.find(s => s.id === newStatus)?.name || newStatus;
    updateTaskMutation.mutate({ id: taskId, status: newStatus });
    addActivityMutation.mutate({ task_id: taskId, action: 'status_changed', description: `Status alterado para ${statusName}` });
    toast({ title: `Tarefa movida para ${statusName}` });
  }, [tasks, user, updateTaskMutation, addActivityMutation, toast]);

  const draggedTask = activeDragId ? tasks.find(t => t.id === activeDragId) : null;

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const getAvatarColor = (name: string) => {
    const colors = ['bg-purple-600', 'bg-blue-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600', 'bg-cyan-600'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const isOverdue = (task: Task) => task.due_date && new Date(task.due_date) < new Date() && task.status !== 'concluido';

  const TaskCard = ({ task, isDragOverlay }: { task: Task; isDragOverlay?: boolean }) => {
    const assigneeName = getAssigneeName(task.assigned_to);
    return (
      <div
        onClick={() => !isDragOverlay && setSelectedTask(task)}
        className={cn(
          'glass-card border border-border rounded p-3 cursor-pointer hover:bg-card-hover space-y-2',
          isDragOverlay && 'shadow-lg ring-2 ring-primary/30'
        )}
      >
        <p className="text-sm font-medium text-foreground">{task.title}</p>
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', task.priority ? PRIORITY_CONFIG[task.priority].badge : '')}>
            {task.priority ? PRIORITY_CONFIG[task.priority].label : 'Média'}
          </Badge>
          {task.due_date && (
            <span className={cn('text-[11px] flex items-center gap-1', isOverdue(task) ? 'text-destructive' : 'text-muted-foreground')}>
              <CalendarIcon className="w-3 h-3" />
              {new Date(task.due_date).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold', getAvatarColor(assigneeName))}>
              {getInitials(assigneeName)}
            </div>
            <span className="text-[11px] text-muted-foreground">{assigneeName}</span>
          </div>
          {task.tags && task.tags.length > 0 && (
            <div className="flex gap-1">
              {task.tags.slice(0, 1).map(t => (
                <span key={t} className="text-[9px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-page-title text-foreground">
            {isFuncionario ? 'Minhas Tarefas' : 'Tarefas'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isFuncionario ? 'Tarefas atribuídas a você' : 'Gerencie e atribua tarefas para sua equipe'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => { resetForm(); setShowCreateModal(true); }} className="gap-1.5">
            <Plus className="w-4 h-4" /> Nova Tarefa
          </Button>
        )}
      </div>

      {/* Tabs (admin only) */}
      {isAdmin && (
        <div className="flex items-center gap-4 border-b border-border pb-2">
          {(['all', 'mine', 'by_person'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn('text-sm pb-1 transition-colors', tab === t ? 'text-foreground font-medium border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground')}
            >
              {t === 'all' ? 'Todas as Tarefas' : t === 'mine' ? 'Minhas Tarefas' : 'Por Responsável'}
            </button>
          ))}
          {tab === 'by_person' && (
            <Select value={filterPerson} onValueChange={setFilterPerson}>
              <SelectTrigger className="w-48 h-8 text-xs">
                <SelectValue placeholder="Selecionar..." />
              </SelectTrigger>
              <SelectContent>
                {allAssignees.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Kanban Board */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {TASK_STATUSES.map(status => {
            const statusTasks = filteredTasks.filter(t => t.status === status.id);
            const StatusIcon = status.icon;
            return (
              <DroppableColumn key={status.id} id={status.id}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <StatusIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground uppercase">{status.name}</span>
                  <span className="text-[11px] bg-muted text-muted-foreground px-1.5 rounded">{statusTasks.length}</span>
                </div>
                <div className="space-y-2 min-h-[100px]">
                  {statusTasks.map(task => (
                    <DraggableTaskCard key={task.id} id={task.id}>
                      <TaskCard task={task} />
                    </DraggableTaskCard>
                  ))}
                </div>
                {isAdmin && (
                  <button
                    onClick={() => { resetForm(); setFormStatus(status.id); setShowCreateModal(true); }}
                    className="mt-2 w-full text-xs text-muted-foreground hover:text-foreground py-2 flex items-center justify-center gap-1 border border-dashed border-border rounded hover:bg-accent transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Adicionar tarefa
                  </button>
                )}
              </DroppableColumn>
            );
          })}
        </div>
        <DragOverlay>
          {draggedTask && <div className="w-[280px]"><TaskCard task={draggedTask} isDragOverlay /></div>}
        </DragOverlay>
      </DndContext>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Tarefa</DialogTitle>
            <DialogDescription>Crie e atribua uma tarefa para sua equipe</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Ex: Criar landing page" />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Descreva a tarefa..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Prioridade *</Label>
                <Select value={formPriority} onValueChange={(v: any) => setFormPriority(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">🔴 Alta</SelectItem>
                    <SelectItem value="media">🟡 Média</SelectItem>
                    <SelectItem value="baixa">🟢 Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={formStatus} onValueChange={(v: any) => setFormStatus(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Responsável *</Label>
              <Select value={formAssignedTo} onValueChange={setFormAssignedTo}>
                <SelectTrigger><SelectValue placeholder="Selecionar responsável" /></SelectTrigger>
                <SelectContent>
                  {allAssignees.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      <span className="flex items-center gap-2">
                        <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold', getAvatarColor(a.name))}>
                          {getInitials(a.name)}
                        </span>
                        {a.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Data de Entrega</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left text-sm', !formDueDate && 'text-muted-foreground')}>
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {formDueDate ? format(formDueDate, 'dd/MM/yyyy') : 'Selecionar data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={formDueDate} onSelect={setFormDueDate} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Tags</Label>
              <Input value={formTags} onChange={e => setFormTags(e.target.value)} placeholder="marketing, vendas (separar com vírgula)" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!formTitle.trim() || !formAssignedTo || createTaskMutation.isPending}>
              {createTaskMutation.isPending ? 'Criando...' : '✓ Criar Tarefa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Detail Modal */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => { if (!open) setSelectedTask(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg">{selectedTask.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Descrição</Label>
                  {isAdmin ? (
                    <Textarea
                      value={selectedTask.description || ''}
                      onChange={e => handleUpdateTask({ ...selectedTask, description: e.target.value })}
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm text-foreground">{selectedTask.description || 'Sem descrição'}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <Select value={selectedTask.status || 'a_fazer'} onValueChange={(v: any) => {
                      handleUpdateTask({ ...selectedTask, status: v });
                      const statusName = TASK_STATUSES.find(s => s.id === v)?.name;
                      addActivityMutation.mutate({ task_id: selectedTask.id, action: 'status_changed', description: `Status alterado para ${statusName}` });
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TASK_STATUSES.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Prioridade</Label>
                    {isAdmin ? (
                      <Select value={selectedTask.priority || 'media'} onValueChange={(v: any) => handleUpdateTask({ ...selectedTask, priority: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alta">🔴 Alta</SelectItem>
                          <SelectItem value="media">🟡 Média</SelectItem>
                          <SelectItem value="baixa">🟢 Baixa</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={cn('text-xs', selectedTask.priority ? PRIORITY_CONFIG[selectedTask.priority].badge : '')}>
                        {selectedTask.priority ? PRIORITY_CONFIG[selectedTask.priority].label : 'Média'}
                      </Badge>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Responsável</Label>
                    <Select value={selectedTask.assigned_to || ''} onValueChange={v => {
                      handleUpdateTask({ ...selectedTask, assigned_to: v });
                      addActivityMutation.mutate({ task_id: selectedTask.id, action: 'reassigned', description: `Atribuída para ${getAssigneeName(v)}` });
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {allAssignees.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Data de Entrega</Label>
                  {isAdmin ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn('w-full justify-start text-left text-sm', !selectedTask.due_date && 'text-muted-foreground')}>
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString('pt-BR') : 'Sem data'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={selectedTask.due_date ? new Date(selectedTask.due_date) : undefined} onSelect={d => handleUpdateTask({ ...selectedTask, due_date: d ? format(d, 'yyyy-MM-dd') : null })} className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <p className="text-sm text-foreground">{selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString('pt-BR') : 'Sem data'}</p>
                  )}
                </div>

                {/* Activity log */}
                <div className="space-y-2 border-t border-border pt-3 mt-3">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Histórico de Atividades</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {activities.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nenhuma atividade registrada</p>
                    ) : (
                      activities.map(a => (
                        <div key={a.id} className="flex items-start gap-2 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          <div>
                            <p className="text-foreground">{a.description}</p>
                            <p className="text-muted-foreground text-[10px]">
                              {new Date(a.created_at!).toLocaleDateString('pt-BR')} às {new Date(a.created_at!).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                {isAdmin && (
                  <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)} className="gap-1 mr-auto">
                    <Trash2 className="w-3.5 h-3.5" /> Excluir
                  </Button>
                )}
                <Button onClick={() => { toast({ title: 'Tarefa atualizada' }); setSelectedTask(null); }}>💾 Salvar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TarefasPage;
