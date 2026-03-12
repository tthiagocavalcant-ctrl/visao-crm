import { Lead } from '@/data/mock-data';
import { X, Trash2, Clock } from 'lucide-react';
import { useState } from 'react';

interface Props {
  lead: Lead;
  onClose: () => void;
}

const LeadDetailModal = ({ lead, onClose }: Props) => {
  const [name, setName] = useState(lead.name);
  const [phone, setPhone] = useState(lead.phone);
  const [notes, setNotes] = useState(lead.notes);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="glass-card border border-border rounded-md w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Detalhes do Lead</h2>
            <p className="text-[11px] text-muted-foreground">Visualize e edite as informações</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 text-xs text-destructive hover:bg-destructive/10 px-2 py-1 rounded">
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
            <label className="block text-label text-muted-foreground mb-1">Data/Hora do Agendamento</label>
            <input type="datetime-local" defaultValue={lead.scheduled_at.slice(0, 16)}
              className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>

          <div>
            <label className="block text-label text-muted-foreground mb-2">Sintomas</label>
            <div className="flex flex-wrap gap-1.5">
              {lead.symptoms.map((s) => (
                <span key={s} className="bg-primary/15 text-primary text-[11px] font-medium px-2.5 py-1 rounded">{s}</span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-label text-muted-foreground mb-2">Interesse</label>
            <span className="bg-success/15 text-success text-[11px] font-medium px-2.5 py-1 rounded">{lead.interest}</span>
          </div>

          <div>
            <label className="block text-label text-muted-foreground mb-2">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {lead.tags.map((t) => (
                <span key={t} className="bg-accent text-accent-foreground text-[11px] font-medium px-2.5 py-1 rounded border border-border">
                  {t} ×
                </span>
              ))}
              <button className="text-[11px] text-primary hover:text-primary/80">+ Tag</button>
            </div>
          </div>

          <div>
            <label className="block text-label text-muted-foreground mb-1">Observações</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações..."
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
        </div>
      </div>
    </div>
  );
};

export default LeadDetailModal;
