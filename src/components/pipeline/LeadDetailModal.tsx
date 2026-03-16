import { X, Trash2, Clock, Check, Plus } from 'lucide-react';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';

type LeadTemperature = 'frio' | 'morno' | 'quente';
type LeadCanal = 'whatsapp' | 'instagram' | 'trafego_pago' | 'google' | 'facebook' | 'indicacao' | 'outro';

interface Lead {
  id: string;
  account_id: string;
  name: string;
  phone: string;
  email: string;
  scheduled_at: string;
  temperature: LeadTemperature;
  canal: LeadCanal;
  tags: string[];
  notes: string;
  pipeline_status: string;
  created_at: string;
  updated_at?: string;
}

const TEMPERATURE_OPTIONS: { value: LeadTemperature; label: string; emoji: string; activeClass: string; inactiveClass: string }[] = [
  { value: 'frio', label: 'Frio', emoji: '❄️', activeClass: 'bg-blue-500 text-white', inactiveClass: 'border border-blue-400 text-blue-400 hover:bg-blue-500/10' },
  { value: 'morno', label: 'Morno', emoji: '🔥', activeClass: 'bg-orange-500 text-white', inactiveClass: 'border border-orange-400 text-orange-400 hover:bg-orange-500/10' },
  { value: 'quente', label: 'Quente', emoji: '🔴', activeClass: 'bg-red-500 text-white', inactiveClass: 'border border-red-400 text-red-400 hover:bg-red-500/10' },
];

const CANAL_OPTIONS: { value: LeadCanal; label: string; emoji: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp', emoji: '💬' },
  { value: 'instagram', label: 'Instagram', emoji: '📸' },
  { value: 'trafego_pago', label: 'Tráfego Pago', emoji: '📢' },
  { value: 'google', label: 'Google', emoji: '🔍' },
  { value: 'facebook', label: 'Facebook', emoji: '📘' },
  { value: 'indicacao', label: 'Indicação', emoji: '🔗' },
  { value: 'outro', label: 'Outro', emoji: '❓' },
];

interface Props {
  lead: Lead;
  onClose: () => void;
  onDelete?: (leadId: string) => void;
  onUpdate?: (updatedLead: Lead) => void;
}

const LeadDetailModal = ({ lead, onClose, onDelete, onUpdate }: Props) => {
  const [name, setName] = useState(lead.name);
  const [phone, setPhone] = useState(lead.phone);
  const [email, setEmail] = useState(lead.email || '');
  const [notes, setNotes] = useState(lead.notes || '');
  const [temperature, setTemperature] = useState<LeadTemperature>(lead.temperature || 'frio');
  const [canal, setCanal] = useState<LeadCanal>(lead.canal || 'outro');
  const [tags, setTags] = useState<string[]>([...(lead.tags || [])]);
  const [scheduledAt, setScheduledAt] = useState(lead.scheduled_at ? lead.scheduled_at.slice(0, 16) : '');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [addingTag, setAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setTags([...tags, trimmed]);
    }
    setNewTag('');
    setAddingTag(false);
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSave = () => {
    const updatedLead: Lead = {
      ...lead,
      name,
      phone,
      email,
      notes,
      temperature,
      canal,
      tags,
      scheduled_at: scheduledAt,
    };
    onUpdate?.(updatedLead);
  };

  const handleDelete = () => {
    onDelete?.(lead.id);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
        <div className="glass-card border border-border rounded-md w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Detalhes do Lead</h2>
              <p className="text-[11px] text-muted-foreground">Visualize e edite as informações</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1 text-xs text-destructive hover:bg-destructive/10 px-2 py-1 rounded transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Excluir
              </button>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-4 space-y-3">
            <div>
              <label className="block text-label text-muted-foreground mb-1">Nome</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-label text-muted-foreground mb-1">Telefone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-label text-muted-foreground mb-1">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="email@exemplo.com"
                className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-label text-muted-foreground mb-1">Data/Hora do Agendamento</label>
              <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>

            {/* Temperatura */}
            <div>
              <label className="block text-label text-muted-foreground mb-2">Temperatura do Lead</label>
              <div className="flex gap-2">
                {TEMPERATURE_OPTIONS.map((opt) => (
                  <button key={opt.value} onClick={() => setTemperature(opt.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${temperature === opt.value ? opt.activeClass : opt.inactiveClass}`}>
                    {opt.emoji} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Canal */}
            <div>
              <label className="block text-label text-muted-foreground mb-2">Canal</label>
              <div className="flex flex-wrap gap-1.5">
                {CANAL_OPTIONS.map((opt) => (
                  <button key={opt.value} onClick={() => setCanal(opt.value)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${canal === opt.value ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-accent'}`}>
                    {opt.emoji} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-label text-muted-foreground mb-2">Tags</label>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span key={t} className="bg-accent text-accent-foreground text-[11px] font-medium px-2.5 py-1 rounded border border-border flex items-center gap-1">
                    {t}
                    <button onClick={() => handleRemoveTag(t)} className="hover:text-destructive transition-colors">×</button>
                  </span>
                ))}
                {addingTag ? (
                  <div className="flex items-center gap-1">
                    <input value={newTag} onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(); if (e.key === 'Escape') { setAddingTag(false); setNewTag(''); } }}
                      autoFocus placeholder="Nova tag..."
                      className="bg-input border border-border rounded px-2 py-0.5 text-[11px] text-foreground w-24 focus:outline-none focus:border-primary" />
                    <button onClick={handleAddTag} className="text-primary hover:text-primary/80"><Check className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  tags.length < 10 && (
                    <button onClick={() => setAddingTag(true)} className="text-[11px] text-primary hover:text-primary/80 flex items-center gap-0.5">
                      <Plus className="w-3 h-3" /> Tag
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="block text-label text-muted-foreground mb-1">Observações</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Adicione observações..."
                className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary min-h-[70px] resize-none" />
            </div>

            <div>
              <h3 className="text-label font-semibold text-foreground flex items-center gap-1.5 mb-2">
                <Clock className="w-3.5 h-3.5" /> Histórico de Interações
              </h3>
              <div className="bg-accent border border-border rounded p-3 text-center">
                <p className="text-xs text-muted-foreground">Nenhuma interação registrada ainda.</p>
              </div>
            </div>

            <button onClick={handleSave}
              className="w-full bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
              💾 Salvar Alterações
            </button>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lead</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default LeadDetailModal;
