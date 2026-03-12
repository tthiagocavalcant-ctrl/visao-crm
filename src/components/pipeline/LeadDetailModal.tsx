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
    <div className="fixed inset-0 z-50 bg-background/80 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-lg w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">Detalhes do Lead</h2>
            <p className="text-sm text-muted-foreground">Visualize e edite as informações do lead</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 text-xs text-destructive hover:bg-destructive/10 px-2.5 py-1.5 rounded-md transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Excluir
            </button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Telefone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Data/Hora do Agendamento</label>
            <input
              type="datetime-local"
              defaultValue={lead.scheduled_at.slice(0, 16)}
              className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Symptoms */}
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Sintomas</label>
            <div className="flex flex-wrap gap-2">
              {lead.symptoms.map((s) => (
                <span key={s} className="bg-primary/15 text-primary text-xs font-medium px-3 py-1 rounded-full">{s}</span>
              ))}
            </div>
          </div>

          {/* Interest */}
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Interesse em Adquirir Óculos</label>
            <span className="bg-success/15 text-success text-xs font-medium px-3 py-1 rounded-full">{lead.interest}</span>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {lead.tags.map((t) => (
                <span key={t} className="bg-muted text-muted-foreground text-xs font-medium px-3 py-1 rounded-full border border-border">
                  {t} ×
                </span>
              ))}
              <button className="text-xs text-primary hover:text-primary/80">+ Tag</button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Observações</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações sobre este lead..."
              className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px] resize-none"
            />
          </div>

          {/* Interaction History */}
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-3">
              <Clock className="w-4 h-4" /> Histórico de Interações
            </h3>
            <div className="bg-muted border border-border rounded-md p-4 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma interação registrada ainda.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailModal;
