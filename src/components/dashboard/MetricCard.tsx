import { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  subtitle?: string;
  value: string;
  icon: ReactNode;
  valueColor?: string;
}

const MetricCard = ({ label, subtitle, value, icon, valueColor }: MetricCardProps) => (
  <div className="bg-card border border-border rounded-lg p-4">
    <div className="flex items-center justify-between mb-2">
      <div>
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
        {subtitle && <p className="text-xs text-muted-foreground/70">{subtitle}</p>}
      </div>
      <span className="text-muted-foreground">{icon}</span>
    </div>
    <p className={`text-xl font-bold ${valueColor || 'text-foreground'}`}>{value}</p>
  </div>
);

export default MetricCard;
