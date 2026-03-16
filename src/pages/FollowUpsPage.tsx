import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Pencil, Trash2, Plus, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const DELAY_OPTIONS = [
  { label: 'Imediato', value: 0 },
  { label: '15 minutos', value: 15 },
  { label: '30 minutos', value: 30 },
  { label: '1 hora', value: 60 },
  { label: '2 horas', value: 120 },
  { label: '3 horas', value: 180 },
  { label: '6 horas', value: 360 },
  { label: '12 horas', value: 720 },
  { label: '1 dia', value: 1440 },
  { label: '2 dias', value: 2880 },
  { label: '3 dias', value: 4320 },
];

const VARIABLE_CHIPS = [
  { label: '{{nome}}', value: '{{nome}}' },
  { label: '{{telefone}}', value: '{{telefone}}' },
  { label: '{{data_agendamento}}', value: '{{data_agendamento}}' },
];

function getDelayLabel(minutes: number) {
  return DELAY_OPTIONS.find(o => o.value === minutes)?.label ?? `${minutes} min`;
}

function getMediaTypeLabel(type: string | null) {
  if (type === 'image') return 'Imagem';
  if (type === 'video') return 'Vídeo';
  return 'Texto';
}

interface FollowupMessage {
  id: string;
  followup_config_id: string;
  account_id: string;
  delay_minutes: number;
  message: string;
  media_url: string | null;
  media_type: string | null;
  position: number;
}

interface FollowupConfig {
  id: string;
  account_id: string;
  pipeline_status: string;
  active: boolean;
  followup_messages: FollowupMessage[];
}

interface PipelineStatus {
  id: string;
  slug: string;
  name: string;
  color: string;
  position: number;
}

const FollowUpsPage = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const accountId = user?.account_id;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMsg, setEditingMsg] = useState<FollowupMessage | null>(null);
  const [targetStatus, setTargetStatus] = useState<PipelineStatus | null>(null);

  // form state
  const [delay, setDelay] = useState(0);
  const [mediaType, setMediaType] = useState<string>('text');
  const [message, setMessage] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: statuses = [] } = useQuery({
    queryKey: ['pipeline_statuses', accountId],
    queryFn: async () => {
      const { data } = await supabase
        .from('pipeline_statuses')
        .select('*')
        .eq('account_id', accountId!)
        .order('position');
      return (data ?? []) as PipelineStatus[];
    },
    enabled: !!accountId,
  });

  const { data: configs = [] } = useQuery({
    queryKey: ['followup_configs', accountId],
    queryFn: async () => {
      const { data } = await supabase
        .from('followup_configs')
        .select('*, followup_messages(*)')
        .eq('account_id', accountId!);
      return (data ?? []) as FollowupConfig[];
    },
    enabled: !!accountId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['followup_configs', accountId] });

  const toggleMutation = useMutation({
    mutationFn: async ({ slug, active }: { slug: string; active: boolean }) => {
      const { error } = await supabase
        .from('followup_configs')
        .upsert(
          { account_id: accountId!, pipeline_status: slug, active },
          { onConflict: 'account_id,pipeline_status' }
        );
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteMsgMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('followup_messages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Mensagem removida' });
    },
  });

  const saveMsgMutation = useMutation({
    mutationFn: async () => {
      if (!targetStatus || !accountId) return;

      // ensure config exists
      const { data: config, error: cfgErr } = await supabase
        .from('followup_configs')
        .upsert(
          { account_id: accountId, pipeline_status: targetStatus.slug, active: true },
          { onConflict: 'account_id,pipeline_status' }
        )
        .select()
        .single();
      if (cfgErr) throw cfgErr;

      const payload = {
        message,
        media_url: mediaType !== 'text' ? mediaUrl || null : null,
        media_type: mediaType !== 'text' ? mediaType : null,
        delay_minutes: delay,
      };

      if (editingMsg) {
        const { error } = await supabase
          .from('followup_messages')
          .update(payload)
          .eq('id', editingMsg.id);
        if (error) throw error;
      } else {
        const existingConfig = configs.find(c => c.pipeline_status === targetStatus.slug);
        const pos = existingConfig?.followup_messages?.length ?? 0;
        const { error } = await supabase.from('followup_messages').insert({
          followup_config_id: config.id,
          account_id: accountId,
          position: pos,
          ...payload,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
      toast({ title: editingMsg ? 'Mensagem atualizada' : 'Mensagem criada' });
    },
  });

  const openCreate = (status: PipelineStatus) => {
    setTargetStatus(status);
    setEditingMsg(null);
    setDelay(0);
    setMediaType('text');
    setMessage('');
    setMediaUrl('');
    setModalOpen(true);
  };

  const openEdit = (status: PipelineStatus, msg: FollowupMessage) => {
    setTargetStatus(status);
    setEditingMsg(msg);
    setDelay(msg.delay_minutes);
    setMediaType(msg.media_type || 'text');
    setMessage(msg.message);
    setMediaUrl(msg.media_url || '');
    setModalOpen(true);
  };

  const insertVariable = (variable: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setMessage(prev => prev + variable);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newVal = message.slice(0, start) + variable + message.slice(end);
    setMessage(newVal);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  const getConfigForSlug = (slug: string) => configs.find(c => c.pipeline_status === slug);

  if (!statuses.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-3">
            <Zap className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhum status no pipeline configurado.<br />
              Acesse <strong>Pipeline CRM</strong> para criar seus status primeiro.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Follow-ups Automáticos</h1>
        <p className="text-sm text-muted-foreground">Configure mensagens automáticas por etapa do pipeline</p>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {statuses.map(status => {
          const config = getConfigForSlug(status.slug);
          const isActive = config?.active ?? false;
          const messages = (config?.followup_messages ?? []).sort((a, b) => a.position - b.position);

          return (
            <Card key={status.id}>
              <CardHeader className="flex-row items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: status.color }} />
                  <span className="text-sm font-semibold text-foreground">{status.name}</span>
                  <Badge variant="secondary" className="text-[10px]">{messages.length} msg</Badge>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={(checked) => toggleMutation.mutate({ slug: status.slug, active: checked })}
                />
              </CardHeader>

              <CardContent className="space-y-2 pt-0">
                {messages.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">Nenhuma mensagem configurada</p>
                )}

                {messages.map((msg, idx) => (
                  <div key={msg.id} className="flex items-start justify-between gap-3 p-2.5 rounded-md bg-muted/50 border border-border">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-foreground">Mensagem {idx + 1}</span>
                        <Badge variant="outline" className="text-[10px]">{getDelayLabel(msg.delay_minutes)}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{getMediaTypeLabel(msg.media_type)}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{msg.message}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(status, msg)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Deletar mensagem?</AlertDialogTitle>
                            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMsgMutation.mutate(msg.id)}>Deletar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  disabled={!isActive}
                  onClick={() => openCreate(status)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Mensagem
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingMsg ? 'Editar Mensagem' : 'Nova Mensagem'}</DialogTitle>
            <DialogDescription>
              {targetStatus?.name ? `Status: ${targetStatus.name}` : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-4">
            {/* Delay */}
            <div className="space-y-1.5">
              <Label className="text-xs">Delay</Label>
              <Select value={String(delay)} onValueChange={v => setDelay(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DELAY_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo</Label>
              <RadioGroup value={mediaType} onValueChange={setMediaType} className="flex gap-4">
                {[
                  { value: 'text', label: 'Texto' },
                  { value: 'image', label: 'Imagem' },
                  { value: 'video', label: 'Vídeo' },
                ].map(t => (
                  <div key={t.value} className="flex items-center gap-1.5">
                    <RadioGroupItem value={t.value} id={`type-${t.value}`} />
                    <Label htmlFor={`type-${t.value}`} className="text-xs cursor-pointer">{t.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <Label className="text-xs">Mensagem</Label>
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                placeholder="Digite a mensagem..."
              />
              <div className="flex gap-1.5 flex-wrap">
                {VARIABLE_CHIPS.map(v => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => insertVariable(v.value)}
                    className="text-[10px] px-2 py-0.5 rounded bg-accent text-accent-foreground hover:bg-accent/80 transition-colors"
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Media URL */}
            {mediaType !== 'text' && (
              <div className="space-y-1.5">
                <Label className="text-xs">URL da mídia</Label>
                <Input
                  value={mediaUrl}
                  onChange={e => setMediaUrl(e.target.value)}
                  placeholder={mediaType === 'image' ? 'https://exemplo.com/imagem.jpg' : 'https://exemplo.com/video.mp4'}
                />
                {mediaUrl && mediaType === 'image' && (
                  <img src={mediaUrl} alt="Preview" className="rounded-md max-h-40 object-contain border border-border" />
                )}
                {mediaUrl && mediaType === 'video' && (
                  <video controls src={mediaUrl} className="rounded-md max-h-40 border border-border" />
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveMsgMutation.mutate()} disabled={!message.trim() || saveMsgMutation.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FollowUpsPage;
