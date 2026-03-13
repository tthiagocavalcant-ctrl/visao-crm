export interface Account {
  id: string;
  name: string;
  logo?: string;
  whatsapp_link: string;
  n8n_webhook: string;
  followup_webhook: string;
  sale_webhook: string;
  facebook_pixel: string;
  google_ads_tag: string;
  api_key: string;
  timezone: string;
  responsible_name: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
  permissions: { dashboard: boolean; pipeline: boolean; settings: boolean; reports: boolean };
  created_at: string;
}

export type LeadTemperature = 'frio' | 'morno' | 'quente';
export type LeadCanal = 'whatsapp' | 'instagram' | 'trafego_pago' | 'google' | 'facebook' | 'indicacao' | 'outro';

export interface Lead {
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
}

export interface EmployeePermissions {
  pipeline: boolean;
  dashboard: boolean;
  export_leads: boolean;
  delete_leads: boolean;
  manage_statuses: boolean;
  conversas: boolean;
}

export interface Employee {
  id: string;
  account_id: string;
  name: string;
  email: string;
  role: string;
  cargo: string;
  permissions: EmployeePermissions;
  active: boolean;
  created_at: string;
}

export interface Unit {
  id: string;
  account_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  responsible: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Interaction {
  id: string;
  lead_id: string;
  type: string;
  description: string;
  created_at: string;
}

export interface Task {
  id: string;
  account_id: string;
  title: string;
  description: string;
  priority: 'alta' | 'media' | 'baixa';
  status: 'a_fazer' | 'em_andamento' | 'concluido';
  assigned_to: string;
  created_by: string;
  due_date?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface TaskActivity {
  id: string;
  task_id: string;
  user_id: string;
  action: 'created' | 'status_changed' | 'reassigned' | 'updated';
  description: string;
  created_at: string;
}

export interface Project {
  id: string;
  account_id: string;
  name: string;
  total_tasks: number;
  completed_tasks: number;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
}

export type UserRole = 'ADMIN_GERAL' | 'ADMIN' | 'FUNCIONARIO';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  account_id?: string;
  cargo?: string;
  permissions?: EmployeePermissions;
}

export const DEFAULT_EMPLOYEE_PERMISSIONS: EmployeePermissions = {
  pipeline: true,
  dashboard: false,
  export_leads: false,
  delete_leads: false,
  manage_statuses: false,
  conversas: false,
};

export const PIPELINE_STATUSES = [
  { id: 'lead', name: 'LEAD', color: 'purple' },
  { id: 'agendou', name: 'Agendou exame', color: 'primary' },
  { id: 'confirmado', name: 'Confirmado', color: 'success' },
  { id: 'desqualificado', name: 'Desqualificado', color: 'destructive' },
  { id: 'followup', name: 'Follow Up', color: 'warning' },
  { id: 'nao_compareceu', name: 'Não compareceu', color: 'primary' },
  { id: 'compareceu', name: 'Compareceu', color: 'warning' },
];

export const BRAZILIAN_STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
  'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

export const mockUsers: User[] = [
  { id: '1', email: 'admin@sistema.com', name: 'Admin Geral', role: 'ADMIN_GERAL' },
  { id: '2', email: 'cliente@empresa.com', name: 'João Silva', role: 'ADMIN', account_id: 'acc-1' },
  { id: '3', email: 'admin@nexstation.com.br', name: 'NexStation', role: 'ADMIN', account_id: 'acc-1' },
  {
    id: '4', email: 'func@empresa.com', name: 'Ana Vendedora', role: 'FUNCIONARIO', account_id: 'acc-1',
    cargo: 'Vendedora',
    permissions: { pipeline: true, dashboard: false, export_leads: false, delete_leads: false, manage_statuses: false, conversas: false },
  },
];

export const mockAccounts: Account[] = [
  {
    id: 'acc-1',
    name: 'Ótica Visão Clara',
    whatsapp_link: 'https://wa.me/5511999999999',
    n8n_webhook: 'https://n8n.example.com/webhook/abc123',
    followup_webhook: '',
    sale_webhook: '',
    facebook_pixel: '',
    google_ads_tag: '',
    api_key: 'sk-xxxx-xxxx-xxxx-xxxx',
    timezone: 'America/Sao_Paulo',
    responsible_name: 'João Silva',
    phone: '11999999999',
    email: 'cliente@empresa.com',
    status: 'active',
    permissions: { dashboard: true, pipeline: true, settings: true, reports: false },
    created_at: '2024-01-15T10:00:00',
  },
  {
    id: 'acc-2',
    name: 'Ótica Premium',
    whatsapp_link: 'https://wa.me/5521988888888',
    n8n_webhook: '',
    followup_webhook: '',
    sale_webhook: '',
    facebook_pixel: 'FB-12345',
    google_ads_tag: '',
    api_key: 'sk-yyyy-yyyy-yyyy-yyyy',
    timezone: 'America/Sao_Paulo',
    responsible_name: 'Maria Santos',
    phone: '21988888888',
    email: 'maria@oticapremium.com',
    status: 'active',
    permissions: { dashboard: true, pipeline: true, settings: true, reports: false },
    created_at: '2024-02-20T14:00:00',
  },
  {
    id: 'acc-3',
    name: 'Ótica do Centro',
    whatsapp_link: '',
    n8n_webhook: '',
    followup_webhook: '',
    sale_webhook: '',
    facebook_pixel: '',
    google_ads_tag: '',
    api_key: 'sk-zzzz-zzzz-zzzz-zzzz',
    timezone: 'America/Sao_Paulo',
    responsible_name: 'Carlos Oliveira',
    phone: '31977777777',
    email: 'carlos@oticacentro.com',
    status: 'inactive',
    permissions: { dashboard: true, pipeline: true, settings: true, reports: false },
    created_at: '2024-03-01T09:00:00',
  },
];

export const mockAccount: Account = mockAccounts[0];

export const mockEmployees: Employee[] = [
  {
    id: 'emp-1', account_id: 'acc-1', name: 'Ana Vendedora', email: 'func@empresa.com',
    role: 'FUNCIONARIO', cargo: 'Vendedora',
    permissions: { pipeline: true, dashboard: false, export_leads: false, delete_leads: false, manage_statuses: false, conversas: false },
    active: true, created_at: '2024-03-01T10:00:00',
  },
  {
    id: 'emp-2', account_id: 'acc-1', name: 'Pedro Atendente', email: 'pedro@empresa.com',
    role: 'FUNCIONARIO', cargo: 'Atendente',
    permissions: { pipeline: true, dashboard: true, export_leads: false, delete_leads: false, manage_statuses: false, conversas: true },
    active: true, created_at: '2024-03-05T10:00:00',
  },
  {
    id: 'emp-3', account_id: 'acc-1', name: 'Carla Gestora', email: 'carla@empresa.com',
    role: 'FUNCIONARIO', cargo: 'Gestora de Tráfego',
    permissions: { pipeline: true, dashboard: true, export_leads: true, delete_leads: false, manage_statuses: true, conversas: true },
    active: true, created_at: '2024-02-15T10:00:00',
  },
];

export const mockProjects: Project[] = [
  { id: 'proj-1', account_id: 'acc-1', name: 'Campanha Março', total_tasks: 8, completed_tasks: 3, status: 'active', created_at: '2026-03-01T10:00:00' },
  { id: 'proj-2', account_id: 'acc-1', name: 'Site Novo', total_tasks: 12, completed_tasks: 12, status: 'completed', created_at: '2026-02-01T10:00:00' },
  { id: 'proj-3', account_id: 'acc-1', name: 'Automação N8n', total_tasks: 5, completed_tasks: 1, status: 'active', created_at: '2026-03-05T10:00:00' },
];

export const mockTasks: Task[] = [
  {
    id: 'task-1', account_id: 'acc-1', title: 'Criar landing page da campanha', description: 'Desenvolver a landing page para a campanha de março com formulário de captura',
    priority: 'alta', status: 'em_andamento', assigned_to: 'emp-1', created_by: '2',
    due_date: '2026-03-15', tags: ['marketing'], created_at: '2026-03-10T10:00:00', updated_at: '2026-03-10T10:00:00',
  },
  {
    id: 'task-2', account_id: 'acc-1', title: 'Configurar pixel do Facebook', description: 'Instalar e configurar o pixel do Facebook na landing page',
    priority: 'media', status: 'a_fazer', assigned_to: 'emp-3', created_by: '2',
    due_date: '2026-03-14', tags: ['tráfego'], created_at: '2026-03-10T11:00:00', updated_at: '2026-03-10T11:00:00',
  },
  {
    id: 'task-3', account_id: 'acc-1', title: 'Gravar vídeo de depoimento', description: 'Gravar vídeo com cliente satisfeito para usar nas redes sociais',
    priority: 'baixa', status: 'a_fazer', assigned_to: 'emp-2', created_by: '2',
    due_date: '2026-03-20', tags: ['conteúdo'], created_at: '2026-03-11T09:00:00', updated_at: '2026-03-11T09:00:00',
  },
  {
    id: 'task-4', account_id: 'acc-1', title: 'Responder leads pendentes', description: 'Fazer follow-up dos leads que não responderam',
    priority: 'alta', status: 'em_andamento', assigned_to: 'emp-1', created_by: '2',
    due_date: '2026-03-12', tags: ['vendas'], created_at: '2026-03-09T14:00:00', updated_at: '2026-03-12T08:00:00',
  },
  {
    id: 'task-5', account_id: 'acc-1', title: 'Atualizar catálogo de armações', description: 'Adicionar novas armações ao catálogo online',
    priority: 'media', status: 'concluido', assigned_to: 'emp-2', created_by: '2',
    tags: ['produto'], created_at: '2026-03-05T10:00:00', updated_at: '2026-03-10T16:00:00',
  },
  {
    id: 'task-6', account_id: 'acc-1', title: 'Revisar métricas semanais', description: 'Analisar métricas de performance da semana e preparar relatório',
    priority: 'media', status: 'concluido', assigned_to: 'emp-3', created_by: '2',
    tags: ['relatório'], created_at: '2026-03-07T10:00:00', updated_at: '2026-03-11T18:00:00',
  },
];

export const mockTaskActivities: TaskActivity[] = [
  { id: 'ta-1', task_id: 'task-1', user_id: '2', action: 'created', description: 'Tarefa criada por João Silva', created_at: '2026-03-10T10:00:00' },
  { id: 'ta-2', task_id: 'task-1', user_id: '2', action: 'reassigned', description: 'Atribuída para Ana Vendedora', created_at: '2026-03-10T10:01:00' },
  { id: 'ta-3', task_id: 'task-1', user_id: 'emp-1', action: 'status_changed', description: 'Status alterado para Em Andamento', created_at: '2026-03-11T09:00:00' },
  { id: 'ta-4', task_id: 'task-4', user_id: '2', action: 'created', description: 'Tarefa criada por João Silva', created_at: '2026-03-09T14:00:00' },
];

export const mockUnits: Unit[] = [];

export const mockLeads: Lead[] = [
  {
    id: 'lead-1', account_id: 'acc-1', name: 'Maria Aparecida', phone: '5511988887777',
    scheduled_at: '2024-03-12T14:30:00', symptoms: ['Dificuldade de Longe'], interest: 'Sim, tenho interesse',
    tags: ['Longe'], notes: '', pipeline_status: 'lead', created_at: '2024-03-10T10:00:00',
  },
  {
    id: 'lead-2', account_id: 'acc-1', name: 'Carlos Eduardo', phone: '5511977776666',
    scheduled_at: '2024-03-11T10:00:00', symptoms: ['Dor de cabeça'], interest: 'Não, só quero o exame',
    tags: [], notes: '', pipeline_status: 'agendou', created_at: '2024-03-09T15:00:00',
  },
  {
    id: 'lead-3', account_id: 'acc-1', name: 'Ana Paula Santos', phone: '5511966665555',
    scheduled_at: '2024-03-10T16:00:00', symptoms: ['Vista cansada'], interest: 'Sim, tenho interesse',
    tags: ['Perto'], notes: 'Cliente retorno', pipeline_status: 'confirmado', created_at: '2024-03-08T09:00:00',
  },
];

export const mockChartData = [
  { date: '06/03', leads: 3 },
  { date: '07/03', leads: 5 },
  { date: '08/03', leads: 2 },
  { date: '09/03', leads: 7 },
  { date: '10/03', leads: 4 },
  { date: '11/03', leads: 6 },
  { date: '12/03', leads: 3 },
];

export const mockBarData = [
  { name: 'Agendamentos', value: 2 },
  { name: 'Comparecimentos', value: 1 },
  { name: 'Vendas', value: 1 },
];

export interface Conversation {
  id: string;
  account_id: string;
  contact_name: string;
  contact_phone: string;
  contact_avatar_url?: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  status: 'active' | 'archived' | 'blocked';
  is_online: boolean;
  assigned_to?: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  account_id: string;
  content: string;
  message_type: 'text' | 'image' | 'audio' | 'document' | 'system';
  media_url?: string;
  direction: 'inbound' | 'outbound';
  status: 'sent' | 'delivered' | 'read';
  whatsapp_message_id?: string;
  sent_by?: string;
  created_at: string;
}

export const mockConversations: Conversation[] = [
  {
    id: 'conv-1', account_id: 'acc-1', contact_name: 'Maria Aparecida', contact_phone: '5511988887777',
    last_message: 'Olá, gostaria de agendar um exame de vista', last_message_at: '2026-03-12T14:30:00',
    unread_count: 2, status: 'active', is_online: true, created_at: '2026-03-10T10:00:00',
  },
  {
    id: 'conv-2', account_id: 'acc-1', contact_name: 'Carlos Eduardo', contact_phone: '5511977776666',
    last_message: 'Obrigado, vou comparecer amanhã!', last_message_at: '2026-03-12T13:15:00',
    unread_count: 0, status: 'active', is_online: false, created_at: '2026-03-09T15:00:00',
  },
  {
    id: 'conv-3', account_id: 'acc-1', contact_name: 'Ana Paula Santos', contact_phone: '5511966665555',
    last_message: 'Qual o valor da consulta?', last_message_at: '2026-03-12T11:45:00',
    unread_count: 1, status: 'active', is_online: true, created_at: '2026-03-08T09:00:00',
  },
  {
    id: 'conv-4', account_id: 'acc-1', contact_name: 'Roberto Mendes', contact_phone: '5511955554444',
    last_message: 'Perfeito, até segunda!', last_message_at: '2026-03-11T18:20:00',
    unread_count: 0, status: 'active', is_online: false, created_at: '2026-03-07T14:00:00',
  },
  {
    id: 'conv-5', account_id: 'acc-1', contact_name: 'Fernanda Lima', contact_phone: '5511944443333',
    last_message: 'Recebi o lembrete, obrigada!', last_message_at: '2026-03-11T16:00:00',
    unread_count: 0, status: 'active', is_online: false, created_at: '2026-03-06T11:00:00',
  },
];

export const mockMessages: Message[] = [
  // conv-1 messages
  { id: 'msg-1', conversation_id: 'conv-1', account_id: 'acc-1', content: 'Conversa iniciada', message_type: 'system', direction: 'inbound', status: 'read', created_at: '2026-03-10T10:00:00' },
  { id: 'msg-2', conversation_id: 'conv-1', account_id: 'acc-1', content: 'Olá! Vi o anúncio de vocês sobre exame de vista gratuito. Ainda estão fazendo?', message_type: 'text', direction: 'inbound', status: 'read', created_at: '2026-03-10T10:05:00' },
  { id: 'msg-3', conversation_id: 'conv-1', account_id: 'acc-1', content: 'Olá Maria! Sim, estamos com essa promoção. Gostaria de agendar?', message_type: 'text', direction: 'outbound', status: 'read', sent_by: '2', created_at: '2026-03-10T10:08:00' },
  { id: 'msg-4', conversation_id: 'conv-1', account_id: 'acc-1', content: 'Sim! Qual horário tem disponível essa semana?', message_type: 'text', direction: 'inbound', status: 'read', created_at: '2026-03-10T10:10:00' },
  { id: 'msg-5', conversation_id: 'conv-1', account_id: 'acc-1', content: 'Temos disponível quarta às 14h ou quinta às 10h. Qual prefere?', message_type: 'text', direction: 'outbound', status: 'read', sent_by: '2', created_at: '2026-03-10T10:12:00' },
  { id: 'msg-6', conversation_id: 'conv-1', account_id: 'acc-1', content: 'Quarta às 14h está ótimo!', message_type: 'text', direction: 'inbound', status: 'read', created_at: '2026-03-10T10:15:00' },
  { id: 'msg-7', conversation_id: 'conv-1', account_id: 'acc-1', content: 'Perfeito! Agendado para quarta, dia 12/03, às 14h. Nosso endereço é Rua das Flores, 123 - Centro. Lembre-se de trazer um documento com foto. 😊', message_type: 'text', direction: 'outbound', status: 'delivered', sent_by: '2', created_at: '2026-03-10T10:18:00' },
  { id: 'msg-8', conversation_id: 'conv-1', account_id: 'acc-1', content: 'Olá, gostaria de agendar um exame de vista', message_type: 'text', direction: 'inbound', status: 'delivered', created_at: '2026-03-12T14:30:00' },
  // conv-2 messages
  { id: 'msg-20', conversation_id: 'conv-2', account_id: 'acc-1', content: 'Boa tarde Carlos! Lembrando do seu exame amanhã às 10h.', message_type: 'text', direction: 'outbound', status: 'read', sent_by: '2', created_at: '2026-03-12T13:00:00' },
  { id: 'msg-21', conversation_id: 'conv-2', account_id: 'acc-1', content: 'Obrigado, vou comparecer amanhã!', message_type: 'text', direction: 'inbound', status: 'read', created_at: '2026-03-12T13:15:00' },
  // conv-3 messages
  { id: 'msg-30', conversation_id: 'conv-3', account_id: 'acc-1', content: 'Boa tarde! O exame é gratuito?', message_type: 'text', direction: 'inbound', status: 'read', created_at: '2026-03-12T11:30:00' },
  { id: 'msg-31', conversation_id: 'conv-3', account_id: 'acc-1', content: 'Sim, o exame de vista é totalmente gratuito!', message_type: 'text', direction: 'outbound', status: 'read', sent_by: '2', created_at: '2026-03-12T11:35:00' },
  { id: 'msg-32', conversation_id: 'conv-3', account_id: 'acc-1', content: 'Qual o valor da consulta?', message_type: 'text', direction: 'inbound', status: 'delivered', created_at: '2026-03-12T11:45:00' },
];

export const BRAZILIAN_TIMEZONES = [
  'America/Sao_Paulo',
  'America/Rio_Branco',
  'America/Manaus',
  'America/Cuiaba',
  'America/Fortaleza',
  'America/Recife',
  'America/Belem',
  'America/Bahia',
  'America/Noronha',
];
