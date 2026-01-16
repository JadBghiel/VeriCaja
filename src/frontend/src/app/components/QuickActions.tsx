import { FileText, Upload, Download, Plus } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/services/api';
import { toast } from '@/utils/toast';

interface QuickActionsProps {
  onRegisterExpense?: () => void;
  onExportReport?: () => void;
}

export function QuickActions({ onRegisterExpense, onExportReport }: QuickActionsProps) {
  const [loading, setLoading] = useState(false);

  const handleNewInvoice = async () => {
    setLoading(true);
    try {
      toast.info('Funcionalidad de nueva factura - próximamente disponible');
      // TODO: Implement new invoice modal
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterExpense = async () => {
    if (onRegisterExpense) {
      onRegisterExpense();
    } else {
      toast.info('Funcionalidad de registro de gasto - próximamente disponible');
    }
  };

  const handleImportData = async () => {
    setLoading(true);
    try {
      toast.info('Funcionalidad de importar datos - próximamente disponible');
      // TODO: Implement file upload
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    if (onExportReport) {
      onExportReport();
    } else {
      setLoading(true);
      try {
        const data = await api.compliance.exportTaxData();
        toast.success('Informe exportado exitosamente');
        console.log('Export data:', data);
      } catch (error) {
        toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const actions = [
    {
      id: '1',
      label: 'Nueva Factura',
      icon: FileText,
      color: 'bg-primary',
      onClick: handleNewInvoice,
    },
    {
      id: '2',
      label: 'Registrar Gasto',
      icon: Plus,
      color: 'bg-accent',
      onClick: handleRegisterExpense,
    },
    {
      id: '3',
      label: 'Importar Datos',
      icon: Upload,
      color: 'bg-[#8B5CF6]',
      onClick: handleImportData,
    },
    {
      id: '4',
      label: 'Exportar Informe',
      icon: Download,
      color: 'bg-[#10B981]',
      onClick: handleExportReport,
    },
  ];
  
  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-4">Acciones Rápidas</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={loading}
              className="flex flex-col items-center justify-center p-4 rounded-lg border border-border hover:border-primary hover:shadow-md transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-foreground text-center">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}