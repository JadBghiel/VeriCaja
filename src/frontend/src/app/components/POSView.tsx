import { Coffee, Croissant, Pizza, Plus, Minus, Trash2, CheckCircle2, QrCode } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { toast } from '@/utils/toast';

interface ProductData {
  id: number;
  name: string;
  price: number;
  quantity_available: number;
  is_in_stock: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  icon: typeof Coffee;
  color: string;
  quantity_available: number;
  is_in_stock: boolean;
}

interface OrderItem {
  product: Product;
  quantity: number;
}

export function POSView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showVerification, setShowVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [productsLoading, setProductsLoading] = useState(true);

  // Map backend product ID to icon and color
  const productConfig: Record<number, { icon: typeof Coffee; color: string }> = {
    1: { icon: Coffee, color: 'bg-[#2563EB]' },
    2: { icon: Coffee, color: 'bg-[#3B82F6]' },
    3: { icon: Coffee, color: 'bg-[#60A5FA]' },
    4: { icon: Croissant, color: 'bg-[#F59E0B]' },
    5: { icon: Pizza, color: 'bg-[#10B981]' },
    6: { icon: Pizza, color: 'bg-[#E11D48]' },
    7: { icon: Pizza, color: 'bg-[#EF4444]' },
  };

  // Fetch products with stock status on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await api.pos.getProducts();
        const enriched = data.map((p: ProductData) => ({
          ...p,
          id: String(p.id),
          ...productConfig[p.id as number],
        }));
        setProducts(enriched);
      } catch (error) {
        toast.error('Error loading products');
        console.error('Products fetch error:', error);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const addToOrder = (product: Product) => {
    if (!product.is_in_stock) return;
    
    setOrderItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setOrderItems((prev) => {
      const updated = prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      );
      return updated.filter((item) => item.quantity > 0);
    });
  };

  const removeItem = (productId: string) => {
    setOrderItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const total = orderItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleVerifyAndClose = async () => {
    if (orderItems.length === 0) return;

    setLoading(true);
    try {
      // Map order items to API format (product_id, quantity)
      const items = orderItems.map(item => ({
        product_id: parseInt(item.product.id),
        quantity: item.quantity,
      }));

      // Call POS API
      const result = await api.pos.executeSale({
        items,
        payment_method: 'cash',
        notes: 'POS sale'
      });

      // Show QR code
      setQrCodeImage(result.qr_code_image);
      
      // Show success verification
      setShowVerification(true);
      toast.success(`¡Venta registrada! Pedido #${result.order_number}`);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setShowVerification(false);
        setQrCodeImage(null);
        setOrderItems([]);
      }, 3000);
    } catch (error: any) {
      toast.error(`Error al procesar venta: ${error.message}`);
      console.error('POS sale error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] flex gap-6">
      {/* Product Grid - 2/3 */}
      <div className="flex-[2] overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-foreground mb-1">
            Punto de Venta
          </h2>
          <p className="text-muted-foreground">
            Toca los productos para añadir al pedido
          </p>
        </div>

        {productsLoading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <p className="text-muted-foreground">Cargando productos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => {
              const Icon = product.icon;
              const isDisabled = !product.is_in_stock;
              return (
                <button
                  key={product.id}
                  onClick={() => !isDisabled && addToOrder(product)}
                  disabled={isDisabled}
                  className={`bg-card border-2 border-border rounded-lg p-6 transition-all active:scale-95 ${
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:border-primary hover:shadow-lg'
                  }`}
                >
                  <div className={`${product.color} w-16 h-16 rounded-lg flex items-center justify-center mb-4 mx-auto ${isDisabled ? 'opacity-50' : ''}`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg mb-2">
                    {product.name}
                  </h3>
                  <p className="text-2xl font-bold text-primary">
                    €{product.price.toFixed(2)}
                  </p>
                  {isDisabled && (
                    <p className="text-xs font-semibold text-red-600 mt-2">
                      Sin Stock
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Order Sidebar - 1/3 */}
      <div className="flex-1 bg-card border border-border rounded-lg p-6 flex flex-col h-full sticky top-0">
        <h3 className="text-xl font-semibold text-foreground mb-4">
          Pedido Actual
        </h3>

        <div className="flex-1 overflow-y-auto mb-4 space-y-3">
          {orderItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No hay artículos en el pedido
            </p>
          ) : (
            orderItems.map((item) => (
              <div
                key={item.product.id}
                className="bg-secondary/50 rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    €{item.product.price.toFixed(2)} × {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="w-7 h-7 rounded bg-background hover:bg-border flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="w-7 h-7 rounded bg-background hover:bg-border flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="w-7 h-7 rounded bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center ml-2"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total */}
        <div className="border-t border-border pt-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">€{total.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-lg">Total</span>
            <span className="text-2xl font-bold text-primary">€{total.toFixed(2)}</span>
          </div>

          {/* Verifactu Status */}
          <div className="bg-[#10B981]/10 border border-[#10B981] rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></div>
              <span className="text-sm font-medium text-foreground">Verifactu Activo</span>
            </div>
            <div className="flex items-center gap-2">
              <QrCode className="w-8 h-8 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                QR generado automáticamente
              </span>
            </div>
          </div>

          <button
            onClick={handleVerifyAndClose}
            disabled={orderItems.length === 0 || loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            {loading ? 'Procesando...' : 'Verificar & Cerrar Venta'}
          </button>
        </div>

        {/* Verification Overlay */}
        {showVerification && (
          <div className="absolute inset-0 bg-[#10B981] rounded-lg flex flex-col items-center justify-center z-10 p-6">
            <CheckCircle2 className="w-16 h-16 text-white mb-4 animate-bounce" />
            <p className="text-white font-bold text-xl mb-2">¡Venta Verificada!</p>
            <p className="text-white/80 text-sm mb-4">Hash Verifactu generado</p>
            {qrCodeImage && (
              <div className="bg-white p-4 rounded-lg mt-2">
                <img src={qrCodeImage} alt="QR Code" className="w-32 h-32" />
                <p className="text-xs text-center text-muted-foreground mt-2">QR de factura</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
