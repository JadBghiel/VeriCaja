/**
 * API service layer for VeriCaja Frontend
 * handles all communication with the FastAPI backend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// helper function to handle API responses
async function handleResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

// ============================================================================
// SALES ENDPOINTS
// ============================================================================
// ============================================================================
// POS / SALES ENDPOINTS
// ============================================================================

export const posAPI = {
  /**
   * exe a POS sale with full Verifactu compliance
   * POST /api/sales/execute
   */
  executeSale: async (orderData: {
    items: Array<{ product_id: number; quantity: number }>;
    payment_method?: string;
    notes?: string;
  }) => {
    const response = await fetch(`${API_URL}/api/sales/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    return handleResponse(response);
  },

  /**
   * get all products with stock status
   * GET /api/sales/products
   */
  getProducts: async () => {
    const response = await fetch(`${API_URL}/api/sales/products`);
    return handleResponse(response);
  },
};

export const salesAPI = {
  /**
   * exe a sale order with Verifactu compliance
   * POST /sales/execute
   */
  executeSale: async (orderData: {
    nif: string;
    items: Array<{ product_id: number; quantity: number; unit_price: number }>;
  }) => {
    const response = await fetch(`${API_URL}/sales/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    return handleResponse(response);
  },
};


// ============================================================================
// DASHBOARD ENDPOINTS
// ============================================================================

export const dashboardAPI = {
  /**
   * get survival clock metrics
   * GET /dashboard/survival-clock
   */
  getSurvivalClock: async (cashBalance: number) => {
    const response = await fetch(
      `${API_URL}/dashboard/survival-clock?cash_balance=${cashBalance}`
    );
    return handleResponse(response);
  },

  /**
   * get all dashboard metrics
   * GET /dashboard/metrics
   */
  getMetrics: async (cashBalance: number) => {
    const response = await fetch(
      `${API_URL}/dashboard/metrics?cash_balance=${cashBalance}`
    );
    return handleResponse(response);
  },

  /**
   * get revenue vs expenses chart data
   * GET /dashboard/revenue-expenses
   */
  getRevenueExpenses: async (days: number = 30) => {
    const response = await fetch(
      `${API_URL}/dashboard/revenue-expenses?days=${days}`
    );
    return handleResponse(response);
  },

  /**
   * list expenses
   * GET /dashboard/expenses
   */
  getExpenses: async (limit: number = 50) => {
    const response = await fetch(
      `${API_URL}/dashboard/expenses?limit=${limit}`
    );
    return handleResponse(response);
  },

  /**
   * create a new expense
   * POST /dashboard/expenses
   */
  createExpense: async (expenseData: {
    description: string;
    amount: number;
    category: string;
    date?: string;
    month?: string;
  }) => {
    const response = await fetch(`${API_URL}/dashboard/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expenseData),
    });
    return handleResponse(response);
  },

  /**
   * export database file
   * GET /dashboard/export-database
   */
  exportDatabase: async () => {
    const response = await fetch(`${API_URL}/dashboard/export-database`);
    if (!response.ok) throw new Error('Failed to export database');
    return response.blob();
  },
};

// ============================================================================
// INVENTORY ENDPOINTS
// ============================================================================

export const inventoryAPI = {
  /**
   * Get all products with stock levels
   * GET /inventory/
   */
  getInventory: async () => {
    const response = await fetch(`${API_URL}/inventory/`);
    return handleResponse(response);
  },

  /**
   * Update stock quantity for a product (restock operation)
   * PATCH /inventory/{product_id}
   */
  updateStock: async (productId: number, quantity: number) => {
    const response = await fetch(`${API_URL}/inventory/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    return handleResponse(response);
  },
};

// ============================================================================
// COMPLIANCE ENDPOINTS
// ============================================================================

export const complianceAPI = {
  /**
   * verify ledger integrity (cryptographic chain)
   * GET /compliance/verify-ledger
   */
  verifyLedger: async () => {
    const response = await fetch(`${API_URL}/compliance/verify-ledger`);
    return handleResponse(response);
  },

  /**
   * export tax data for Modelo 303 and Modelo 130
   * GET /compliance/export-tax-data
   */
  exportTaxData: async () => {
    const response = await fetch(`${API_URL}/compliance/export-tax-data`);
    return handleResponse(response);
  },
};

// ============================================================================
// UNIFIED API CLIENT
// ============================================================================

export const api = {
  pos: posAPI,
  sales: salesAPI,
  dashboard: dashboardAPI,
  inventory: inventoryAPI,
  compliance: complianceAPI,

  /**
   * check if backend is available
   */
  isBackendAvailable: async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${API_URL}/`, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * get API status info
   */
  getStatus: async () => {
    try {
      const response = await fetch(`${API_URL}/`);
      return handleResponse(response);
    } catch (error) {
      return {
        message: 'Backend unavailable',
        error: String(error),
      };
    }
  },
};

export default api;
