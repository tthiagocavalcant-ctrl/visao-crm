import { useState } from 'react';
import { mockLeads, PIPELINE_STATUSES, Lead } from '@/data/mock-data';
import { User, Phone, Calendar, MessageCircle, Download, Settings, Users } from 'lucide-react';
import LeadDetailModal from '@/components/pipeline/LeadDetailModal';

const statusDotColors: Record<string, string> = {
  purple: 'bg-purple',
  primary: 'bg-primary',
  success: 'bg-success',
  destructive: 'bg-destructive',
  warning: 'bg-warning',
};

const PipelinePage = () => {
  const [leads] = useState<Lead[]>(mockLeads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline CRM</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie seus leads e oportunidades</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select className="bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground">
            <option>Todo Período</option>
          </select>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="w-4 h-4" /> {leads.length} leads no total
          </span>
          <button className="flex items-center gap-1.5 bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
            <Download className="w-4 h-4" /> Exportar
          </button>
          <button className="flex items-center gap-1.5 bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
            <Settings className="w-4 h-4" /> Gerenciar Status
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STATUSES.map((status) => {
          const columnLeads = leads.filter((l) => l.pipeline_status === status.id);
          return (
            <div key={status.id} className="min-w-[280px] w-[280px] shrink-0">
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
                    <div
                      key={lead.id}
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

                      <a
                        href={`https://wa.me/${lead.phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center gap-2 w-full bg-success/20 hover:bg-success/30 text-success text-xs font-medium py-2 rounded-md transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Chamar no WhatsApp
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedLead && (
        <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}
    </div>
  );
};

export default PipelinePage;
