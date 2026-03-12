import { ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  valueColor?: string;
}

const KpiCard = ({ label, value, icon, valueColor }: KpiCardProps) => (
  <div className="bg-card border border-border rounded-lg p-5">
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
      <span className="text-muted-foreground">{icon}</span>
    </div>
    <p className={`text-2xl font-bold ${valueColor || 'text-foreground'}`}>{value}</p>
  </div>
);

export default KpiCard;
