export function TransactionsList() {
  // Empty for now - will be populated with real transaction data from backend

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Movimientos Recientes</h3>
          <p className="text-sm text-muted-foreground">Últimas transacciones</p>
        </div>
      </div>
      
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground text-center py-8">
          No hay movimientos registrados
        </p>
      </div>
    </div>
  );
}
