import { TrendingUp, TrendingDown, Wallet, CreditCard, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { MetricsCard } from '@/app/components/MetricsCard';
import { RevenueChart } from '@/app/components/RevenueChart';
import { TransactionsList } from '@/app/components/TransactionsList';
import { TaxWidget } from '@/app/components/TaxWidget';
import { QuickActions } from '@/app/components/QuickActions';
import { InvoicesWidget } from '@/app/components/InvoicesWidget';
import { api } from '@/services/api';
import { toast } from '@/utils/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';

interface DashboardMetrics {
  survival_clock: {
    runway_days: number;
    estimated_date: string;
    status: string;
  };
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  iva_estimate: number;
  irpf_estimate: number;
  revenue_expenses: {
    dates: string[];
    revenue: number[];
    expenses: number[];
  };
}

export function DashboardView() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: 'Supplies',
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await api.dashboard.getMetrics(5000); // Assuming €5000 current cash
      setMetrics(data);
    } catch (error) {
      toast.error('Error al cargar los datos del dashboard');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      await api.dashboard.createExpense({
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
      });
      toast.success('Gasto registrado exitosamente');
      setShowExpenseModal(false);
      setExpenseForm({ description: '', amount: '', category: 'Supplies' });
      fetchDashboardData(); // Refresh data
    } catch (error) {
      toast.error('Error al registrar el gasto');
    }
  };

  const handleExportDatabase = async () => {
    try {
      const blob = await api.dashboard.exportDatabase();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vericaja-${new Date().toISOString().split('T')[0]}.db`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Base de datos descargada');
    } catch (error) {
      toast.error('Error al descargar la base de datos');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Cargando datos...</p>
      </div>
    );
  }

  const totalRevenue = metrics?.total_revenue || 0;
  const totalExpenses = metrics?.total_expenses || 0;
  const netProfit = metrics?.net_profit || 0;
  const runwayDays = metrics?.survival_clock?.runway_days || 0;
  const estimatedDate = metrics?.survival_clock?.estimated_date || 'N/A';

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Bienvenida de nuevo, María
          </h2>
          <p className="text-muted-foreground">
            Aquí está el resumen de tu actividad financiera
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricsCard
          title="Ingresos del Mes"
          value={`€${totalRevenue.toFixed(2)}`}
          change={totalRevenue > 0 ? '+12.5% vs mes anterior' : 'Sin datos'}
          changeType={totalRevenue > 0 ? 'positive' : 'neutral'}
          icon={TrendingUp}
          iconBgColor="bg-green-500"
        />
        <MetricsCard
          title="Gastos del Mes"
          value={`€${totalExpenses.toFixed(2)}`}
          change={totalExpenses > 0 ? '+5.2% vs mes anterior' : 'Sin datos'}
          changeType={totalExpenses > 0 ? 'negative' : 'neutral'}
          icon={TrendingDown}
          iconBgColor="bg-amber-500"
        />
        <MetricsCard
          title="Beneficio Neto"
          value={`€${netProfit.toFixed(2)}`}
          change={netProfit > 0 ? '+21.8% vs mes anterior' : 'Sin datos'}
          changeType={netProfit > 0 ? 'positive' : 'negative'}
          icon={Wallet}
          iconBgColor="bg-primary"
        />
        <MetricsCard
          title="Días de Liquidez"
          value={`${runwayDays} días`}
          change={`Hasta ${estimatedDate}`}
          changeType={runwayDays > 30 ? 'positive' : runwayDays > 15 ? 'warning' : 'negative'}
          icon={CreditCard}
          iconBgColor="bg-blue-500"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <RevenueChart data={metrics?.revenue_expenses || { dates: [], revenue: [], expenses: [] }} />
        </div>
        <div>
          <QuickActions 
            onRegisterExpense={() => setShowExpenseModal(true)}
            onExportReport={handleExportDatabase}
          />
        </div>
      </div>

      {/* Secondary Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TransactionsList />
          <InvoicesWidget />
        </div>
        <div>
          <TaxWidget />
        </div>
      </div>

      {/* Expense Modal */}
      <Dialog open={showExpenseModal} onOpenChange={setShowExpenseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Gasto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Descripción
              </label>
              <Input
                placeholder="Ej: Café y suministros"
                value={expenseForm.description}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, description: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Monto (€)
              </label>
              <Input
                type="number"
                placeholder="0.00"
                step="0.01"
                value={expenseForm.amount}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, amount: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Categoría
              </label>
              <Select
                value={expenseForm.category}
                onValueChange={(value) =>
                  setExpenseForm({ ...expenseForm, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Supplies">Suministros</SelectItem>
                  <SelectItem value="Maintenance">Mantenimiento</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Equipment">Equipo</SelectItem>
                  <SelectItem value="Other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowExpenseModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateExpense}
                className="flex-1"
              >
                Guardar Gasto
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
