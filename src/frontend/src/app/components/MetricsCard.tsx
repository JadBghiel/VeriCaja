import { LucideIcon } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconBgColor: string;
}

export function MetricsCard({ title, value, change, changeType, icon: Icon, iconBgColor }: MetricsCardProps) {
  const changeColor = 
    changeType === 'positive' ? 'text-green-700' :
    changeType === 'negative' ? 'text-destructive' :
    'text-muted-foreground';
  
  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <h3 className="text-2xl font-semibold text-foreground mb-2">{value}</h3>
          <p className={`text-sm ${changeColor}`}>
            {change}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-lg ${iconBgColor} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
