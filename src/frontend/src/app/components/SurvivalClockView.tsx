import { Wallet, AlertCircle, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { toast } from '@/utils/toast';

export function SurvivalClockView() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.dashboard.getMetrics(5000); // Assuming €5000 current cash
      setMetrics(data);
    } catch (error) {
      toast.error('Error al cargar los datos');
      console.error('Survival Clock error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Cargando datos...</p>
      </div>
    );
  }

  const daysOfRunway = metrics?.survival_clock?.runway_days || 0;
  const estimatedDate = metrics?.survival_clock?.estimated_date || 'N/A';
  const status = metrics?.survival_clock?.status || 'healthy';
  const netProfit = metrics?.net_profit || 0;
  const totalRevenue = metrics?.total_income || 0;
  const totalExpenses = metrics?.total_expenses || 0;
  
  const maxDays = 90;
  const percentage = Math.min((daysOfRunway / maxDays) * 100, 100);

  // Color based on status
  const getColor = () => {
    if (status === 'critical') return '#EF4444'; // red
    if (status === 'warning') return '#F59E0B'; // amber
    return '#10B981'; // green
  };

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-1">
          Estado de Salud del Negocio
        </h2>
        <p className="text-muted-foreground">
          Tu panorama financiero de un vistazo
        </p>
      </div>

      {/* Survival Clock */}
      <div className="bg-card border border-border rounded-lg p-8 mb-6 shadow-sm">
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-semibold text-foreground mb-6">
            Reserva de Efectivo
          </h3>
          
          {/* Circular Gauge */}
          <div className="relative w-64 h-64 mb-6">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="128"
                cy="128"
                r="100"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="20"
              />
              {/* Progress circle */}
              <circle
                cx="128"
                cy="128"
                r="100"
                fill="none"
                stroke={getColor()}
                strokeWidth="20"
                strokeDasharray={`${(percentage / 100) * 628} 628`}
                strokeLinecap="round"
              />
            </svg>
            
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-5xl font-bold" style={{ color: getColor() }}>
                {daysOfRunway}
              </div>
              <div className="text-sm text-muted-foreground mt-1">días</div>
            </div>
          </div>
          
          {/* Estimated date */}
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground mb-1">Estimado hasta el</p>
            <p className="text-xl font-semibold text-foreground">{estimatedDate}</p>
          </div>
          
          {/* Warning if critical */}
          {status === 'critical' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-900 font-medium">
                ¡Atención! Reserva de efectivo crítica
              </p>
            </div>
          )}
          {status === 'warning' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <p className="text-sm text-amber-900 font-medium">
                Reserva de efectivo en advertencia
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Data Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-[#10B981]" />
            </div>
          </div>
          <h4 className="text-sm text-muted-foreground mb-2">Beneficio Neto</h4>
          <p className="text-3xl font-bold text-foreground mb-1">
            €{netProfit.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground">
            Ingresos - Gastos
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-[#F59E0B]" />
            </div>
          </div>
          <h4 className="text-sm text-muted-foreground mb-2">Gastos Totales</h4>
          <p className="text-3xl font-bold text-foreground mb-1">
            €{totalExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground">
            Costes operativos totales
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h4 className="text-sm text-muted-foreground mb-2">Ingresos Totales</h4>
          <p className="text-3xl font-bold text-foreground mb-1">
            €{totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground">
            Ventas totales realizadas
          </p>
        </div>
      </div>
    </div>
  );
}
