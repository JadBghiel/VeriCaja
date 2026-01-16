#!/usr/bin/env python3
"""
mock data generator for vericaja database.
generates realistic test data for development and testing
"""

from datetime import datetime, timedelta
from sqlmodel import Session, create_engine
from models import (
    Product, Order, OrderItem, StockMovement, Income,
    Expense, TaxReserve, InvoiceLedger, SystemEventLog
)
import hashlib
import random

# configure database
DATABASE_URL = "sqlite:///./vericaja.db"
engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False}
)

def generate_hash(order_number: str, timestamp: datetime, total_amount: float, previous_hash: str = None) -> str:
    """generate sha-256 hash for order"""
    hash_input = f"{order_number}{timestamp.isoformat()}{total_amount:.2f}"
    if previous_hash:
        hash_input += previous_hash
    return hashlib.sha256(hash_input.encode()).hexdigest()

def seed_database():
    """populate database with mock data"""
    from models import Product, Order, Income, Expense, StockMovement, InvoiceLedger
    
    # create tables
    from sqlmodel import SQLModel, select
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        # check if data already exists
        existing_products = session.exec(select(Product)).all()
        if len(existing_products) > 0:
            print("database already contains data. skipping seed.")
            return
        
        print("Seeding database with mock data...")
        
        # 1. create products
        products = [
            Product(name="Espresso", description="Single shot espresso", price=2.50, category="café", cost_per_unit=0.30, stock_qty=120, is_active=True),
            Product(name="Cappuccino", description="Espresso with steamed milk", price=3.50, category="café", cost_per_unit=0.80, stock_qty=120, is_active=True),
            Product(name="Latte", description="Espresso with more milk", price=4.00, category="café", cost_per_unit=1.00, stock_qty=120, is_active=True),
            Product(name="Croissant", description="Butter croissant", price=2.80, category="comida", cost_per_unit=1.20, stock_qty=80, is_active=True),
            Product(name="Pan con Tomate", description="Bread with tomato", price=1.50, category="comida", cost_per_unit=0.40, stock_qty=80, is_active=True),
            Product(name="Agua", description="Bottle of water", price=1.50, category="bebida", cost_per_unit=0.30, stock_qty=150, is_active=True),
            Product(name="Jugo Natural", description="Fresh orange juice", price=3.00, category="bebida", cost_per_unit=0.80, stock_qty=150, is_active=True),
        ]
        for product in products:
            session.add(product)
        session.commit()
        print(f"✓ Created {len(products)} products")

        # record initial stock load as movements
        for product in products:
            session.add(StockMovement(
                product_id=product.id,
                quantity_change=product.stock_qty,
                movement_type="seed_restock",
                cost_impact=product.cost_per_unit * product.stock_qty,
                previous_stock=0,
                new_stock=product.stock_qty
            ))
        session.commit()
        print(f"✓ Logged initial stock movements")
        
        # NOTE: Overhead costs and salaries removed - use manual expenses instead
        
        # 4. create orders (sales) for the last 30 days
        orders = []
        previous_hash = None
        ledger_sequence = 1
        for i in range(1, 51):  # 50 sales
            days_ago = random.randint(0, 29)
            order_date = datetime.utcnow() - timedelta(days=days_ago)
            order_number = f"2026-{str(i).zfill(5)}"
            
            # random items per order (1-4 items)
            num_items = random.randint(1, 4)
            total_amount = 0
            items_list = []
            
            for _ in range(num_items):
                product = random.choice(products)
                quantity = random.randint(1, 3)
                item_total = product.price * quantity
                total_amount += item_total
                items_list.append((product, quantity, item_total))
            
            # calculate hash
            prev_hash = previous_hash
            hash_fingerprint = generate_hash(order_number, order_date, total_amount, prev_hash)
            previous_hash = hash_fingerprint
            
            order = Order(
                order_number=order_number,
                total_amount=total_amount,
                items_count=len(items_list),
                hash=hash_fingerprint,
                previous_hash=prev_hash if prev_hash else None,
                qr_code_content=f"https://www2.agenciatributaria.gob.es/wlpl/AVAC-HPRIM/Verifactu?nif=12345678X&numSerie={order_number}&fecha={order_date.strftime('%d-%m-%Y')}&importe={total_amount:.2f}",
                timestamp=order_date,
                is_verified=True,
                payment_method=random.choice(["cash", "card"]),
            )
            session.add(order)
            session.flush()  # get order.id
            orders.append(order)
            
            # create income record
            income = Income(
                order_id=order.id,
                amount=total_amount,
                source="sales",
                date=order_date
            )
            session.add(income)

            # create order items and adjust stock with movements
            for product, quantity, item_total in items_list:
                session.add(OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    quantity=quantity,
                    unit_price=product.price,
                    subtotal=item_total,
                    product_name=product.name
                ))

                previous_stock = product.stock_qty
                product.stock_qty = max(0, previous_stock - quantity)
                session.add(product)

                session.add(StockMovement(
                    product_id=product.id,
                    quantity_change=-quantity,
                    movement_type="sale",
                    cost_impact=-(product.cost_per_unit * quantity),
                    reference_order_id=order.id,
                    previous_stock=previous_stock,
                    new_stock=product.stock_qty
                ))

            # create invoice ledger entry
            session.add(InvoiceLedger(
                sequence_number=ledger_sequence,
                order_id=order.id,
                invoice_number=order_number,
                hash=hash_fingerprint,
                previous_hash=prev_hash if prev_hash else "0" * 64,
                amount=total_amount,
                is_verified=True,
                verification_hash_check=True,
                timestamp=order_date
            ))
            ledger_sequence += 1
        
        session.commit()
        print(f"✓ Created {len(orders)} orders with invoices")
        
        # 5. create expenses for the last 30 days
        expenses = []
        expense_categories = ["Supplies", "Maintenance", "Marketing", "Equipment", "Other"]
        for i in range(1, 21):  # 20 expenses
            days_ago = random.randint(0, 29)
            expense_date = datetime.utcnow() - timedelta(days=days_ago)
            expense = Expense(
                description=f"Gasto de {random.choice(['café', 'leche', 'azúcar', 'servilletas', 'mantenimiento'])}",
                amount=random.uniform(20, 300),
                category=random.choice(expense_categories),
                date=expense_date,
                month=expense_date.strftime("%Y-%m")
            )
            session.add(expense)
            expenses.append(expense)
        
        session.commit()
        print(f"✓ Created {len(expenses)} expenses")
        print(f"✓ created {len(expenses)} expenses")
        
        # 6. create tax reserves for current and previous months
        current_month = datetime.utcnow().strftime("%Y-%m")
        tax_reserve = TaxReserve(
            month=current_month,
            irpf_amount=2500.00,
            iva_amount=3500.00,
            iva_deductible=800.00,
            modelo_303_due="2026-04-20",
            modelo_130_due="2026-01-20",
            reserved_amount=6000.00,
        )
        session.add(tax_reserve)
        session.commit()
        print("✓ Created tax reserve records")
        print("✓ created tax reserve records")
        
        print("\n✅ database seeded successfully!")
        print(f"   - {len(products)} Products")
        print(f"   - {len(orders)} Orders")
        print(f"   - {len(expenses)} Expenses")
        print(f"   - Note: Overhead costs and salaries now tracked as manual expenses")

if __name__ == "__main__":
    seed_database()
