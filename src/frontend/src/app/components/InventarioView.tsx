import { Coffee, Milk, Wheat, Package, Plus, RefreshCw, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from '@/utils/toast';
import { api } from '@/services/api';

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  price: number;
  cost_per_unit: number;
  stock_quantity: number;
  max_capacity: number;
  is_active: boolean;
}

export function InventarioView() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [restockQuantity, setRestockQuantity] = useState<number>(10);

  // Fetch inventory on mount
  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const data = await api.inventory.getInventory();
      setInventoryItems(data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Error al cargar el inventario');
    } finally {
      setLoading(false);
    }
  };

  const handleRestockClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setRestockQuantity(10);
    setShowRestockModal(true);
  };

  const handleRestockConfirm = async () => {
    if (!selectedItem || restockQuantity <= 0) return;

    try {
      await api.inventory.updateStock(selectedItem.id, restockQuantity);
      toast.success(`✅ Stock actualizado: ${selectedItem.name} (+${restockQuantity})`);
      
      // Refresh inventory
      await fetchInventory();
      
      // Close modal
      setShowRestockModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Error al actualizar el stock');
    }
  };

  const getStockPercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };

  const getStockStatus = (percentage: number) => {
    if (percentage > 50) return { color: 'bg-[#10B981]', label: 'Óptimo', textColor: 'text-[#10B981]' };
    if (percentage > 20) return { color: 'bg-[#F59E0B]', label: 'Medio', textColor: 'text-[#F59E0B]' };
    return { color: 'bg-[#EF4444]', label: 'Crítico', textColor: 'text-[#EF4444]' };
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'café':
        return <Coffee className="w-6 h-6" />;
      case 'bebida':
        return <Milk className="w-6 h-6" />;
      case 'comida':
        return <Wheat className="w-6 h-6" />;
      default:
        return <Package className="w-6 h-6" />;
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl font-semibold text-foreground">
            Inventario
          </h2>
          <button
            onClick={fetchInventory}
            disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
        <p className="text-muted-foreground">
          Control visual de stock para tu negocio
        </p>
      </div>

      {/* Inventory Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl p-6 border border-border animate-pulse">
                <div className="h-24 bg-secondary rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : inventoryItems.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">No hay productos en el inventario</p>
          <p className="text-sm text-muted-foreground mt-2">
            Los productos se gestionan desde el sistema
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventoryItems.map((item) => {
            const percentage = getStockPercentage(item.stock_quantity, item.max_capacity);
            const status = getStockStatus(percentage);
            
            return (
              <div
                key={item.id}
                 className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-all duration-300"
              >
                {/* Header with icon */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground text-lg">
                        {item.name}
                      </h3>
                        <span className="text-sm text-muted-foreground capitalize">
                        {item.category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stock quantity display */}
                <div className="mb-4">
                  <div className="flex items-baseline justify-between mb-2">
                      <span className="text-3xl font-bold text-foreground">
                      {item.stock_quantity}
                    </span>
                      <span className="text-sm text-muted-foreground">
                      / {item.max_capacity} unidades
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative">
                      <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${status.color} transition-all duration-500 ease-out rounded-full`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs font-semibold ${status.textColor}`}>
                        {status.label}
                      </span>
                        <span className="text-xs text-muted-foreground">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                 <div className="bg-secondary rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Precio unitario</span>
                    <span className="font-semibold text-foreground">€{item.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Costo</span>
                    <span className="font-semibold text-foreground">€{item.cost_per_unit.toFixed(2)}</span>
                  </div>
                </div>

                {/* Restock Button */}
                <button
                  onClick={() => handleRestockClick(item)}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                  Reabastecer
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && selectedItem && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-300 border border-border">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                  <h3 className="text-xl font-semibold text-foreground">
                  Reabastecer Stock
                </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                  {selectedItem.name}
                </p>
              </div>
              <button
                onClick={() => setShowRestockModal(false)}
                  className="w-10 h-10 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors"
              >
                  <XCircle className="w-6 h-6 text-muted-foreground" />
              </button>
            </div>

            {/* Current Stock Info */}
              <div className="bg-secondary rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Stock actual</span>
                  <span className="text-2xl font-bold text-foreground">
                  {selectedItem.stock_quantity}
                </span>
              </div>
              <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Después de reabastecer</span>
                  <span className="text-2xl font-bold text-primary">
                  {selectedItem.stock_quantity + restockQuantity}
                </span>
              </div>
            </div>

            {/* Quantity Input */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                Cantidad a agregar
              </label>
              <input
                type="number"
                min="1"
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-lg font-semibold text-foreground bg-background"
                placeholder="10"
              />
              
              {/* Quick Add Buttons */}
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[10, 20, 50, 100].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setRestockQuantity(amount)}
                      className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium transition-colors"
                  >
                    +{amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowRestockModal(false)}
                  className="flex-1 px-4 py-3 rounded-lg border border-border text-muted-foreground font-semibold hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRestockConfirm}
                disabled={restockQuantity <= 0}
                  className="flex-1 px-4 py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
