export function InvoicesWidget() {
  // Empty for now - will be populated with real invoice data from backend

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Facturas Recientes</h3>
          <p className="text-sm text-muted-foreground">Estado de facturación</p>
        </div>
      </div>
      
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground text-center py-8">
          No hay facturas registradas
        </p>
      </div>
    </div>
  );
}
