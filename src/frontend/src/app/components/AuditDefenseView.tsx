import { Shield, FileCheck, Download, Search, CheckCircle2, Lock, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/services/api';
import { toast } from '@/utils/toast';

export function AuditDefenseView() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [loadingModelo303, setLoadingModelo303] = useState(false);
  const [loadingModelo130, setLoadingModelo130] = useState(false);
  const [ledgerData, setLedgerData] = useState<any>(null);

  const handleVerifyIntegrity = async () => {
    setIsVerifying(true);
    try {
      const data = await api.compliance.verifyLedger();
      setLedgerData(data);
      setVerificationComplete(true);
      if (data.status === 'SECURE') {
        toast.success('Integridad verificada correctamente');
      } else {
        toast.error('Se detectaron problemas en la cadena');
      }
      setTimeout(() => setVerificationComplete(false), 5000);
    } catch (error) {
      toast.error('Error al verificar la integridad');
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePrepareModelo303 = async () => {
    setLoadingModelo303(true);
    try {
      const data = await api.compliance.exportTaxData();
      toast.success('Datos de Modelo 303 (IVA) preparados');
      console.log('Modelo 303 data:', data);
    } catch (error) {
      toast.error('Error al preparar datos de Modelo 303');
    } finally {
      setLoadingModelo303(false);
    }
  };

  const handlePrepareModelo130 = async () => {
    setLoadingModelo130(true);
    try {
      const data = await api.compliance.exportTaxData();
      toast.success('Datos de Modelo 130 (IRPF) preparados');
      console.log('Modelo 130 data:', data);
    } catch (error) {
      toast.error('Error al preparar datos de Modelo 130');
    } finally {
      setLoadingModelo130(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const data = await api.compliance.exportTaxData();
      toast.success('Informe trimestral generado');
      console.log('Report data:', data);
    } catch (error) {
      toast.error('Error al generar informe');
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-1">
          Registro de Auditoría
        </h2>
        <p className="text-muted-foreground">
          Historial verificado y conforme con Verifactu
        </p>
      </div>

      {/* Action Bar */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
              <Shield className="w-7 h-7 text-[#10B981]" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-lg mb-1">
                Cadena Criptográfica Activa
              </h3>
              <p className="text-sm text-muted-foreground">
                {ledgerData ? `${ledgerData.total_entries} facturas verificadas` : 'Verificar cadena criptográfica'}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleVerifyIntegrity}
              disabled={isVerifying}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isVerifying ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verificando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Verificar Integridad
                </>
              )}
            </button>

            <button
              onClick={handleGenerateReport}
              className="bg-secondary hover:bg-border text-foreground px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Informe Trimestral
            </button>
          </div>
        </div>

        {/* Verification Success */}
        {verificationComplete && (
          <div className="mt-4 bg-[#10B981]/10 border border-[#10B981] rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
            <div>
              <p className="font-semibold text-foreground">Integridad Verificada</p>
              <p className="text-sm text-muted-foreground">
                Todas las facturas mantienen la cadena criptográfica intacta
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tax Reports Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <FileCheck className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-foreground">Modelo 303 (IVA)</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Declaración trimestral del Impuesto sobre el Valor Añadido
          </p>
          <button
            onClick={handlePrepareModelo303}
            disabled={loadingModelo303}
            className="text-sm text-primary hover:underline flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingModelo303 ? 'Preparando...' : 'Preparar datos'}
            <Download className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <FileCheck className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-foreground">Modelo 130 (IRPF)</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Pago fraccionado del Impuesto sobre la Renta
          </p>
          <button
            onClick={handlePrepareModelo130}
            disabled={loadingModelo130}
            className="text-sm text-primary hover:underline flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingModelo130 ? 'Preparando...' : 'Preparar datos'}
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-card border border-border rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por número de factura, cliente o hash..."
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Chained Invoices List */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-border bg-secondary/30 px-6 py-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Facturas Encadenadas (Verifactu)
          </h3>
        </div>

        <div className="p-6">
          {ledgerData ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {ledgerData.status === 'SECURE' ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                )}
                <div>
                  <p className="font-semibold text-foreground">
                    {ledgerData.status === 'SECURE' ? 'Cadena Segura' : 'Problemas Detectados'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {ledgerData.verified_chain} de {ledgerData.total_entries} entradas verificadas
                  </p>
                </div>
              </div>
              {ledgerData.breaches && ledgerData.breaches.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm font-semibold text-red-900 mb-2">Brechas detectadas:</p>
                  {ledgerData.breaches.map((breach: any, idx: number) => (
                    <p key={idx} className="text-xs text-red-700">{breach.issue}</p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Presiona "Verificar Integridad" para revisar la cadena criptográfica
            </p>
          )}
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-6 bg-primary/5 border border-primary/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <h4 className="font-semibold text-foreground mb-1">Garantía de Incorruptibilidad</h4>
            <p className="text-sm text-muted-foreground">
              Cada factura está criptográficamente vinculada a la anterior, creando una cadena inmutable que cumple con los requisitos de Verifactu de la Agencia Tributaria Española. Cualquier alteración rompe la cadena y es inmediatamente detectable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
