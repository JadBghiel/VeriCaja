import { Calculator } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/services/api';
import { toast } from '@/utils/toast';

export function TaxWidget() {
  const [loading, setLoading] = useState(false);

  const handleViewDetails = async () => {
    setLoading(true);
    try {
      // Get current cash balance from the dashboard or use a default
      const cashBalance = 0; // TODO: Replace with actual cash balance from state
      const data = await api.dashboard.getSurvivalClock(cashBalance);
      toast.success('Detalles fiscales cargados');
      console.log('Tax details:', data);
      // TODO: Open modal with tax details
    } catch (error) {
      toast.error('Error al cargar detalles fiscales');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
          <Calculator className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Resumen Fiscal</h3>
          <p className="text-sm text-muted-foreground">Estimación trimestral</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Tax summary will be loaded from API */}
      </div>

      <button
        onClick={handleViewDetails}
        disabled={loading}
        className="w-full mt-4 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Cargando...' : 'Ver detalles fiscales'}
      </button>
    </div>
  );
}
