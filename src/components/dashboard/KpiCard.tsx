import { ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  valueColor?: string;
}

const KpiCard = ({ label, value, icon, valueColor }: KpiCardProps) => (
  <div className="bg-card border border-border rounded p-3">
    <div className="flex items-center justify-between mb-2">
      <span className="text-label text-muted-foreground">{label}</span>
      <span className="text-muted-foreground">{icon}</span>
    </div>
    <p className={`text-xl font-bold ${valueColor || 'text-foreground'}`}>{value}</p>
  </div>
);

export default KpiCard;
