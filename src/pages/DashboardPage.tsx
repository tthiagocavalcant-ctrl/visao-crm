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
import { mockChartData, mockBarData } from '@/data/mock-data';

const recentAppointments = [
  { name: 'Maria Aparecida', phone: '(11) 98888-7777', date: '12 de mar. de 2024', time: '14:30', status: 'Agendou exame', statusColor: 'bg-primary text-primary-foreground' },
  { name: 'Carlos Eduardo', phone: '(11) 97777-6666', date: '11 de mar. de 2024', time: '10:00', status: 'Confirmado', statusColor: 'bg-success text-success-foreground' },
  { name: 'Ana Paula Santos', phone: '(11) 96666-5555', date: '10 de mar. de 2024', time: '16:00', status: 'Venda realizada', statusColor: 'bg-success text-success-foreground' },
];

const DashboardPage = () => {
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
          { label: 'Agendamentos', value: '2', icon: <Calendar className="w-4 h-4 text-muted-foreground" /> },
          { label: 'Comparecimentos', value: '1', icon: <CheckCircle className="w-4 h-4 text-muted-foreground" /> },
          { label: 'Vendas', value: '1', icon: <User className="w-4 h-4 text-muted-foreground" /> },
          { label: 'Faturamento', value: 'R$ 100,00', icon: <DollarSign className="w-4 h-4 text-muted-foreground" /> },
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
            <LineChart data={mockChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--chart-axis)', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: 'var(--chart-axis)', fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: 4, color: 'var(--chart-tooltip-text)', fontSize: 12 }} />
              <Line type="monotone" dataKey="leads" stroke="var(--chart-color)" strokeWidth={2} dot={{ fill: 'var(--chart-color)', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 glass-card border border-border rounded p-4">
          <h3 className="text-section-title uppercase text-muted-foreground mb-3">Comparação de Métricas</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mockBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--chart-axis)', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: 'var(--chart-axis)', fontSize: 11 }} axisLine={false} />
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
          {recentAppointments.map((apt, i) => (
            <div key={i} className={`grid grid-cols-[1fr_140px_140px] h-10 items-center px-4 border-b border-border last:border-0 table-row-hover ${i % 2 === 0 ? 'table-row-even' : 'table-row-odd'}`}>
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
                <p className="text-sm text-foreground">{apt.date}</p>
                <p className="text-[11px] text-muted-foreground">{apt.time}</p>
              </div>
              <span className={`status-badge w-fit ${apt.statusColor}`}>
                {apt.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
