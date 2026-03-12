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

export interface Lead {
  id: string;
  account_id: string;
  name: string;
  phone: string;
  scheduled_at: string;
  symptoms: string[];
  interest: string;
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
    permissions: { pipeline: true, dashboard: false, export_leads: false, delete_leads: false, manage_statuses: false },
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
    permissions: { pipeline: true, dashboard: false, export_leads: false, delete_leads: false, manage_statuses: false },
    active: true, created_at: '2024-03-01T10:00:00',
  },
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
