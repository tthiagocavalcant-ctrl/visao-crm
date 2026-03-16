import { useMemo } from 'react';
import {
  Calendar,
  CheckCircle,
  User,
  DollarSign,
  TrendingUp,
  Phone,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();

  const sevenDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString();
  }, []);

  // All leads for KPIs
  const { data: leads = [] } = useQuery({
    queryKey: ['dashboard', user?.account_id, 'leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('id, name, phone, pipeline_status, scheduled_at, created_at')
        .eq('account_id', user!.account_id!);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.account_id,
  });

  // Recent leads (last 7 days) for chart
  const { data: recentLeads = [] } = useQuery({
    queryKey: ['dashboard', user?.account_id, 'recent-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('id, created_at')
        .eq('account_id', user!.account_id!)
        .gte('created_at', sevenDaysAgo);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.account_id,
  });

  // Last 5 appointments
  const { data: appointments = [] } = useQuery({
    queryKey: ['dashboard', user?.account_id, 'appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('id, name, phone, pipeline_status, scheduled_at')
        .eq('account_id', user!.account_id!)
        .not('scheduled_at', 'is', null)
        .order('scheduled_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.account_id,
  });

  // KPI calculations
  const agendamentos = leads.filter((l) => l.scheduled_at).length;
  const comparecimentos = leads.filter((l) => l.pipeline_status === 'compareceu').length;
  const vendas = leads.filter((l) => l.pipeline_status === 'venda_realizada').length;

  // Chart data: group recent leads by day
  const chartData = useMemo(() => {
    const days: { date: string; leads: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const count = recentLeads.filter((l) => l.created_at?.slice(0, 10) === key).length;
      days.push({ date: label, leads: count });
    }
    return days;
  }, [recentLeads]);

  // Bar chart: comparison metrics
  const barData = [
    { name: 'Agend.', value: agendamentos },
    { name: 'Compar.', value: comparecimentos },
    { name: 'Vendas', value: vendas },
  ];

  const formatScheduledAt = (dateStr: string | null) => {
    if (!dateStr) return { date: '-', time: '' };
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      lead: 'Lead',
      agendado: 'Agendado',
      compareceu: 'Compareceu',
      venda_realizada: 'Venda Realizada',
      nao_compareceu: 'Não compareceu',
    };
    return map[status] || status;
  };

  const statusColor = (status: string) => {
    if (status === 'venda_realizada') return 'bg-success text-success-foreground';
    if (status === 'compareceu') return 'bg-success text-success-foreground';
    if (status === 'agendado') return 'bg-primary text-primary-foreground';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-xs mt-0.5">Visão geral dos seus agendamentos e vendas</p>
        </div>
        <button className="flex items-center gap-2 glass-card border border-border rounded px-3 py-1.5 text-[13px] text-foreground hover:bg-accent">
          <Calendar className="w-4 h-4" />
          Selecionar período
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded overflow-hidden border border-border">
        {[
          { label: 'Agendamentos', value: String(agendamentos), icon: <Calendar className="w-4 h-4 text-muted-foreground" /> },
          { label: 'Comparecimentos', value: String(comparecimentos), icon: <CheckCircle className="w-4 h-4 text-muted-foreground" /> },
          { label: 'Vendas', value: String(vendas), icon: <User className="w-4 h-4 text-muted-foreground" /> },
          { label: 'Faturamento', value: 'R$ 0,00', icon: <DollarSign className="w-4 h-4 text-muted-foreground" /> },
        ].map((kpi, i) => (
          <div key={i} className="glass-card p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-label text-muted-foreground">{kpi.label}</span>
              {kpi.icon}
            </div>
            <p className="text-xl font-bold text-foreground">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-border rounded overflow-hidden border border-border">
        {[
          { label: 'Investimento', value: 'R$ 0,00', icon: <TrendingUp className="w-4 h-4" /> },
          { label: 'Custo/Agend.', value: 'R$ 0,00', icon: <Calendar className="w-4 h-4" /> },
          { label: 'Custo/Compar.', value: 'R$ 0,00', icon: <CheckCircle className="w-4 h-4" /> },
          { label: 'CAC', value: 'R$ 0,00', icon: <User className="w-4 h-4" /> },
          { label: 'ROI', value: '0.0%', icon: <TrendingUp className="w-4 h-4 text-success" />, valueColor: 'text-success' },
        ].map((m, i) => (
          <div key={i} className="glass-card p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-label text-muted-foreground">{m.label}</span>
              <span className="text-muted-foreground">{m.icon}</span>
            </div>
            <p className={`text-lg font-bold ${m.valueColor || 'text-foreground'}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 glass-card border border-border rounded p-4">
          <h3 className="text-section-title uppercase text-muted-foreground mb-3">Leads nos Últimos 7 Dias</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--chart-axis)', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: 'var(--chart-axis)', fontSize: 11 }} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: 4, color: 'var(--chart-tooltip-text)', fontSize: 12 }} />
              <Line type="monotone" dataKey="leads" stroke="var(--chart-color)" strokeWidth={2} dot={{ fill: 'var(--chart-color)', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 glass-card border border-border rounded p-4">
          <h3 className="text-section-title uppercase text-muted-foreground mb-3">Comparação de Métricas</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--chart-axis)', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: 'var(--chart-axis)', fontSize: 11 }} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: 4, color: 'var(--chart-tooltip-text)', fontSize: 12 }} />
              <Bar dataKey="value" fill="var(--chart-color)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Recent Appointments */}
      <div>
        <h3 className="text-section-title uppercase text-muted-foreground mb-3">Últimos Agendamentos</h3>
        <div className="border border-border rounded overflow-hidden">
          <div className="grid grid-cols-[1fr_140px_140px] bg-accent h-9 items-center px-4 text-label uppercase text-muted-foreground border-b border-border">
            <span>Paciente</span>
            <span>Data</span>
            <span>Status</span>
          </div>
          {appointments.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhum agendamento encontrado
            </div>
          ) : (
            appointments.map((apt, i) => {
              const { date, time } = formatScheduledAt(apt.scheduled_at);
              return (
                <div key={apt.id} className={`grid grid-cols-[1fr_140px_140px] h-10 items-center px-4 border-b border-border last:border-0 table-row-hover ${i % 2 === 0 ? 'table-row-even' : 'table-row-odd'}`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{apt.name}</p>
                      <p className="text-[11px] text-muted-foreground">{apt.phone}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-foreground">{date}</p>
                    <p className="text-[11px] text-muted-foreground">{time}</p>
                  </div>
                  <span className={`status-badge w-fit ${statusColor(apt.pipeline_status)}`}>
                    {statusLabel(apt.pipeline_status)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
