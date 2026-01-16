from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class Product(SQLModel, table=True):
    """product catalog for POS"""
    __tablename__ = "products"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: Optional[str] = None
    price: float  # price in euros
    category: str  # ex "café", "comida", "bebida"
    cost_per_unit: float  # cost to calculate profit
    stock_qty: int = Field(default=100)  # current stock quantity
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class OverheadCost(SQLModel, table=True):
    """overhead costs for financial tracking"""
    __tablename__ = "overhead_costs"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    description: str
    amount: float
    frequency: str

class Salary(SQLModel, table=True):
    """employee salary tracking"""
    __tablename__ = "salaries"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    employee_name: str
    hourly_rate: float
    hours_worked: float
    social_security_est: float

class SystemEventLog(SQLModel, table=True):
    """log for system events"""
    __tablename__ = "system_event_logs"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    event_type: str = Field(index=True)
    user_id: Optional[int] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ==================== POS ORDERS ====================

class Order(SQLModel, table=True):
    """individual orders/sales (invoices)"""
    __tablename__ = "orders"

    id: Optional[int] = Field(default=None, primary_key=True)
    order_number: str = Field(unique=True, index=True)
    total_amount: float
    items_count: int
    hash: str = Field(index=True)
    previous_hash: Optional[str] = None
    qr_code_content: str
    qr_code_image: Optional[str] = None
    qr_code_file_path: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    is_verified: bool = True
    payment_method: str = "cash"
    notes: Optional[str] = None


class OrderItem(SQLModel, table=True):
    """items within an order"""
    __tablename__ = "order_items"

    id: Optional[int] = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="orders.id")
    product_id: int = Field(foreign_key="products.id")
    quantity: float
    unit_price: float
    subtotal: float
    product_name: str


class StockMovement(SQLModel, table=True):
    """track all stock changes"""
    __tablename__ = "stock_movements"

    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="products.id")
    quantity_change: float
    movement_type: str
    wastage_reason: Optional[str] = None
    cost_impact: float = 0.0
    reference_order_id: Optional[int] = Field(default=None, foreign_key="orders.id")
    previous_stock: Optional[float] = None
    new_stock: Optional[float] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class Income(SQLModel, table=True):
    """income tracking for dashboard"""
    __tablename__ = "income"

    id: Optional[int] = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="orders.id")
    amount: float
    source: str = "sales"
    date: datetime = Field(default_factory=datetime.utcnow)


class Expense(SQLModel, table=True):
    """expense tracking for dashboard"""
    __tablename__ = "expenses"

    id: Optional[int] = Field(default=None, primary_key=True)
    description: str
    amount: float
    category: str
    date: datetime = Field(default_factory=datetime.utcnow)
    month: str = Field(index=True)


class TaxReserve(SQLModel, table=True):
    """tax obligation tracking"""
    __tablename__ = "tax_reserves"

    id: Optional[int] = Field(default=None, primary_key=True)
    month: str = Field(unique=True, index=True)
    irpf_amount: float
    iva_amount: float
    iva_deductible: float
    modelo_303_due: Optional[str] = None
    modelo_130_due: Optional[str] = None
    reserved_amount: float
    last_updated: datetime = Field(default_factory=datetime.utcnow)


class InvoiceLedger(SQLModel, table=True):
    """immutable cryptographic invoice ledger (verifactu compliance)"""
    __tablename__ = "invoice_ledger"

    id: Optional[int] = Field(default=None, primary_key=True)
    sequence_number: int = Field(unique=True, index=True)
    order_id: int = Field(foreign_key="orders.id", unique=True)
    invoice_number: str = Field(unique=True, index=True)
    hash: str = Field(index=True)
    previous_hash: str
    amount: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    is_verified: bool = True
    verification_hash_check: bool = True