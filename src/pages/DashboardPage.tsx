import {
  Calendar,
  CheckCircle,
  User,
  DollarSign,
  TrendingUp,
  Clock,
  Phone,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import KpiCard from '@/components/dashboard/KpiCard';
import MetricCard from '@/components/dashboard/MetricCard';
import { mockChartData, mockBarData } from '@/data/mock-data';

const recentAppointments = [
  { name: 'Maria Aparecida', phone: '(11) 98888-7777', date: '12 de mar. de 2024', time: '14:30', status: 'Agendou exame', statusColor: 'bg-primary/20 text-primary' },
  { name: 'Carlos Eduardo', phone: '(11) 97777-6666', date: '11 de mar. de 2024', time: '10:00', status: 'Confirmado', statusColor: 'bg-success/20 text-success' },
  { name: 'Ana Paula Santos', phone: '(11) 96666-5555', date: '10 de mar. de 2024', time: '16:00', status: 'Venda realizada', statusColor: 'bg-success/20 text-success' },
];

const DashboardPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Visão geral dos seus agendamentos e vendas</p>
        </div>
        <button className="flex items-center gap-2 bg-card border border-border rounded-md px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
          <Calendar className="w-4 h-4" />
          Selecionar período
        </button>
      </div>

      {/* Row 1 - KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Agendamentos" value="2" icon={<Calendar className="w-5 h-5" />} />
        <KpiCard label="Comparecimentos" value="1" icon={<CheckCircle className="w-5 h-5" />} />
        <KpiCard label="Vendas" value="1" icon={<User className="w-5 h-5" />} />
        <KpiCard label="Faturamento" value="R$ 100,00" icon={<DollarSign className="w-5 h-5" />} />
      </div>

      {/* Row 2 - Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard label="Investimento" value="R$ 0,00" icon={<TrendingUp className="w-4 h-4" />} />
        <MetricCard label="Custo/Agendamento" subtitle="Por Lead Gerado" value="R$ 0,00" icon={<Calendar className="w-4 h-4" />} />
        <MetricCard label="Custo/Comparecimento" subtitle="Por Exame Realizado" value="R$ 0,00" icon={<CheckCircle className="w-4 h-4" />} />
        <MetricCard label="CAC" subtitle="Custo de Aquisição" value="R$ 0,00" icon={<User className="w-4 h-4" />} />
        <MetricCard label="ROI" subtitle="Retorno do Investimento" value="0.0%" icon={<TrendingUp className="w-4 h-4 text-success" />} valueColor="text-success" />
      </div>

      {/* Row 3 - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">📈 Leads nos Últimos 7 Dias</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={mockChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 40%, 19%)" />
              <XAxis dataKey="date" tick={{ fill: 'hsl(220, 20%, 63%)', fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: 'hsl(220, 20%, 63%)', fontSize: 12 }} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(220, 35%, 13%)', border: '1px solid hsl(217, 40%, 19%)', borderRadius: 8, color: '#fff' }}
              />
              <Line type="monotone" dataKey="leads" stroke="hsl(222, 100%, 64%)" strokeWidth={2} dot={{ fill: 'hsl(222, 100%, 64%)', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-2">→ Leads</p>
        </div>

        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">📅 Comparação de Métricas</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={mockBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 40%, 19%)" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(220, 20%, 63%)', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: 'hsl(220, 20%, 63%)', fontSize: 12 }} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(220, 35%, 13%)', border: '1px solid hsl(217, 40%, 19%)', borderRadius: 8, color: '#fff' }}
              />
              <Bar dataKey="value" fill="hsl(222, 100%, 64%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 4 - Recent Appointments */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">🕐 Últimos Agendamentos</h3>
        <div className="space-y-3">
          {recentAppointments.map((apt, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{apt.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {apt.phone}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-foreground">{apt.date}</p>
                  <p className="text-xs text-muted-foreground">{apt.time}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${apt.statusColor}`}>
                  {apt.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
