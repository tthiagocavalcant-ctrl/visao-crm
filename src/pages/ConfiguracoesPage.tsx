import { useState } from 'react';
import { mockAccount } from '@/data/mock-data';
import {
  Copy, RefreshCw, Bell, Building2, Users, Link2, Upload,
  CheckCircle, AlertTriangle, Plus,
} from 'lucide-react';

const tabs = ['Empresa', 'Unidades', 'Equipe', 'Integrações'];

const ConfiguracoesPage = () => {
  const [activeTab, setActiveTab] = useState('Empresa');
  const [account] = useState(mockAccount);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie as configurações da sua conta</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Empresa' && <EmpresaTab account={account} />}
      {activeTab === 'Unidades' && <UnidadesTab />}
      {activeTab === 'Equipe' && <EquipeTab />}
      {activeTab === 'Integrações' && <IntegracoesTab account={account} />}
    </div>
  );
};

const InputField = ({ label, helper, value, placeholder, copyable }: {
  label: string; helper?: string; value?: string; placeholder?: string; copyable?: boolean;
}) => (
  <div>
    <label className="block text-sm text-muted-foreground mb-1">{label}</label>
    <div className="relative">
      <input
        defaultValue={value}
        placeholder={placeholder}
        className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 pr-10"
      />
      {copyable && (
        <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          <Copy className="w-4 h-4" />
        </button>
      )}
    </div>
    {helper && <p className="text-xs text-muted-foreground mt-1">{helper}</p>}
  </div>
);

const EmpresaTab = ({ account }: { account: typeof mockAccount }) => (
  <div className="space-y-6">
    {/* Company Info */}
    <div className="bg-card border border-border rounded-lg p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">ℹ Informações da Empresa</h3>
        <p className="text-xs text-muted-foreground">Dados que aparecem nos formulários públicos</p>
      </div>
      <InputField label="Nome da Empresa" value={account.name} />
      <div>
        <label className="block text-sm text-muted-foreground mb-1">Logo da Empresa</label>
        <div className="border-2 border-dashed border-border rounded-md p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
          <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Clique ou arraste para enviar</p>
          <p className="text-xs text-muted-foreground/70">JPG, PNG, WEBP ou GIF (máx. 5MB)</p>
        </div>
      </div>
      <InputField label="Link do WhatsApp" value={account.whatsapp_link} placeholder="https://wa.me/5511900000000" helper="Será redirecionado https://wa.me/numero" />
    </div>

    {/* Integrations */}
    <div className="bg-card border border-border rounded-lg p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">🔗 Integrações</h3>
        <p className="text-xs text-muted-foreground">Conecte com ferramentas externas</p>
      </div>
      <InputField label="Webhook n8n" value={account.n8n_webhook} copyable helper="URL do webhook que recebe os dados dos agendamentos automaticamente" />
      <InputField label="Webhook Follow-Up (Não Compareceu)" value={account.followup_webhook} helper="URL do webhook que é acionado quando lead vai para status 'Não compareceu'" />
      <InputField label="Fuso Horário" value={account.timezone} placeholder="America/Sao_Paulo" />
      <InputField label="Pixel do Facebook" value={account.facebook_pixel} helper="ID do pixel do Facebook para rastreamento de conversões" />
      <InputField label="Tag de Conversão Google Ads" value={account.google_ads_tag} placeholder="AW-XXXXXXXXX/XXXXXXXXX" helper="Tag de conversão do Google Ads. Formato: AW-XXXXXXXXXX" />
    </div>

    {/* API Key */}
    <div className="bg-card border border-border rounded-lg p-5 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">🔑 API Key de Integração</h3>
        <p className="text-xs text-muted-foreground">Use esta chave para integrar outros sistemas com os dados da ferramenta</p>
      </div>
      <div className="flex items-center gap-2">
        <input
          value="••••••••••••••••"
          readOnly
          className="flex-1 bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground"
        />
        <button className="flex items-center gap-1 bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Regenerar
        </button>
        <button className="flex items-center gap-1 bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
          <Copy className="w-3.5 h-3.5" /> Copiar
        </button>
      </div>
    </div>

    {/* Pixel Validation */}
    <div className="bg-card border border-border rounded-lg p-5 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">✔ Validação de Pixels</h3>
        <p className="text-xs text-muted-foreground">Verifique se seus pixels estão configurados corretamente</p>
      </div>
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-foreground">Pixel do Facebook</span>
        <span className="bg-warning/15 text-warning text-xs font-medium px-2.5 py-1 rounded-full">Não configurado</span>
      </div>
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-foreground">Google Ads Tag</span>
        <span className="bg-warning/15 text-warning text-xs font-medium px-2.5 py-1 rounded-full">Não configurado</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <AlertTriangle className="w-4 h-4 text-warning" />
        <span className="text-warning">Sem pixel configurado</span>
        <button className="text-primary hover:underline text-sm">Verificar</button>
        <button className="bg-card border border-border rounded-md px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors ml-auto">
          Testar Eventos
        </button>
      </div>
    </div>

    <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 rounded-md transition-colors">
      💾 Salvar Configurações
    </button>

    {/* Push Notifications */}
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">🔔 Notificações Push</h3>
          <p className="text-xs text-muted-foreground">Envie notificações mesmo quando não estiver na página</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-warning/15 text-warning text-xs font-medium px-2.5 py-1 rounded-full">Não configurado</span>
          <button className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-4 py-1.5 rounded-md transition-colors">
            Ativar
          </button>
        </div>
      </div>
    </div>
  </div>
);

const UnidadesTab = () => (
  <div className="space-y-6">
    <div className="bg-card border border-border rounded-lg p-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Building2 className="w-5 h-5 text-primary" />
        <div>
          <h3 className="text-sm font-semibold text-foreground">Unidades</h3>
          <p className="text-xs text-muted-foreground">Configure as filiais e pontos de atendimento do seu negócio</p>
        </div>
      </div>
      <button className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-4 py-2 rounded-md transition-colors">
        <Plus className="w-4 h-4" /> Nova Unidade
      </button>
    </div>

    <div className="bg-card border border-border rounded-lg p-5">
      <h4 className="text-sm font-semibold text-foreground mb-1">📍 Localizações — 0 unidades ativas</h4>
      <div className="py-10 text-center">
        <Building2 className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Nenhuma unidade cadastrada</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Crie unidades para organizar sua equipe e formulários por localização</p>
        <button className="mt-4 flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-4 py-2 rounded-md transition-colors mx-auto">
          <Plus className="w-4 h-4" /> Criar Primeira Unidade
        </button>
      </div>
    </div>
  </div>
);

const EquipeTab = () => (
  <div className="space-y-6">
    <div className="bg-card border border-border rounded-lg p-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Users className="w-5 h-5 text-primary" />
        <div>
          <h3 className="text-sm font-semibold text-foreground">Gestão de Equipe</h3>
          <p className="text-xs text-muted-foreground">Adicione funcionários e configure permissões de acesso personalizadas</p>
        </div>
      </div>
      <button className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-4 py-2 rounded-md transition-colors">
        👤 Novo Funcionário
      </button>
    </div>

    <div className="bg-card border border-border rounded-lg p-5">
      <h4 className="text-sm font-semibold text-foreground mb-4">👥 Funcionários — 0 membros na equipe</h4>
      <div className="py-10 text-center">
        <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Carregando equipe...</p>
      </div>
    </div>
  </div>
);

const IntegracoesTab = ({ account }: { account: typeof mockAccount }) => (
  <div className="space-y-6">
    {/* API Endpoint */}
    <div className="bg-card border border-border rounded-lg p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">🔗 Endpoint da API</h3>
        <p className="text-xs text-muted-foreground">Use este endpoint no seu workflow do N8n</p>
      </div>
      <InputField label="URL do Endpoint" value="https://api.crm-saas.com/webhook/pipeline" copyable />
      <InputField label="Seu Account ID" value={account.id} copyable />
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground">📋 Método HTTP:</span>
        <span className="bg-primary/15 text-primary text-xs font-medium px-2 py-0.5 rounded">POST</span>
        <span className="text-muted-foreground">Content-Type: application/json</span>
      </div>
    </div>

    {/* Two cards */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Pipeline Card */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Pipeline (CRM)</h3>
          <span className="bg-primary/15 text-primary text-xs font-medium px-2.5 py-1 rounded">PIPELINE</span>
        </div>
        <p className="text-xs text-muted-foreground">Atualiza o status do lead no pipeline de vendas</p>
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Exemplos de Status:</p>
          <div className="flex flex-wrap gap-1.5">
            {['LEAD', 'Agendou exame', 'Confirmado', 'Venda realizada'].map((s) => (
              <span key={s} className="bg-muted text-muted-foreground text-[10px] font-medium px-2 py-0.5 rounded-full border border-border">{s}</span>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground">Exemplo de Payload JSON</p>
            <button className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"><Copy className="w-3 h-3" /> Copiar</button>
          </div>
          <pre className="bg-background border border-border rounded-md p-3 text-xs text-foreground overflow-x-auto">
{`{
  "panel_code": "PIPELINE",
  "lead_id": "uuid-do-lead",
  "account_id": "uuid-da-conta",
  "status_name": "LEAD"
}`}
          </pre>
        </div>
      </div>

      {/* Follow Up Card */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Follow Up</h3>
          <span className="bg-primary/15 text-primary text-xs font-medium px-2.5 py-1 rounded">FOLLOW_UP</span>
        </div>
        <p className="text-xs text-muted-foreground">Atualiza o status de follow-up do lead</p>
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Exemplos de Status:</p>
          <div className="flex flex-wrap gap-1.5">
            {['Follow up 1', 'Follow up 2', 'Follow up 3'].map((s) => (
              <span key={s} className="bg-muted text-muted-foreground text-[10px] font-medium px-2 py-0.5 rounded-full border border-border">{s}</span>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground">Exemplo de Payload JSON</p>
            <button className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"><Copy className="w-3 h-3" /> Copiar</button>
          </div>
          <pre className="bg-background border border-border rounded-md p-3 text-xs text-foreground overflow-x-auto">
{`{
  "panel_code": "FOLLOW_UP",
  "lead_id": "uuid-do-lead",
  "account_id": "uuid-da-conta",
  "status_name": "Follow up 1"
}`}
          </pre>
        </div>
      </div>
    </div>
  </div>
);

export default ConfiguracoesPage;
