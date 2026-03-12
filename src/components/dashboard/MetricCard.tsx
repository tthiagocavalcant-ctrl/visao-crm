import { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  subtitle?: string;
  value: string;
  icon: ReactNode;
  valueColor?: string;
}

const MetricCard = ({ label, subtitle, value, icon, valueColor }: MetricCardProps) => (
  <div className="bg-card border border-border rounded p-3">
    <div className="flex items-center justify-between mb-1.5">
      <div>
        <span className="text-label text-muted-foreground">{label}</span>
        {subtitle && <p className="text-[11px] text-muted-foreground/70">{subtitle}</p>}
      </div>
      <span className="text-muted-foreground">{icon}</span>
    </div>
    <p className={`text-lg font-bold ${valueColor || 'text-foreground'}`}>{value}</p>
  </div>
);

export default MetricCard;
