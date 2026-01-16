from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from pathlib import Path

from database import get_session
from models import Order, OrderItem, Product, Income, InvoiceLedger, SystemEventLog, TaxReserve, StockMovement
from compliance import generate_hash, generate_qr_code_content, log_system_event
from qr_generator import generate_verifactu_qr, save_qr_image

router = APIRouter(prefix="/api/sales", tags=["Sales"])


# ==================== REQUEST/RESPONSE MODELS ====================

class OrderItemRequest(BaseModel):
    product_id: int
    quantity: float


class CreateOrderRequest(BaseModel):
    items: List[OrderItemRequest]
    payment_method: str = "cash"
    notes: Optional[str] = None


class OrderItemResponse(BaseModel):
    product_name: str
    quantity: float
    unit_price: float
    subtotal: float


class OrderResponse(BaseModel):
    id: int
    order_number: str
    total_amount: float
    items_count: int
    hash: str
    qr_code_image: str  # Base64 encoded PNG
    timestamp: str
    items: List[OrderItemResponse]


# ==================== ENDPOINTS ====================

@router.post("/execute", response_model=OrderResponse)
async def execute_sale(request: CreateOrderRequest, session: Session = Depends(get_session)):
    """
    execute a complete pos sale with:
    1. order creation
    2. cryptographic hash generation (verifactu)
    3. qr code generation (aeat compliant)
    4. inventory updates
    5. financial tracking
    6. ledger entry
    7. event logging
    """
    
    try:
        # ========== validation ==========
        if not request.items:
            raise HTTPException(status_code=400, detail="order must contain at least one item")
        
        # ========== fetch products ==========
        products_map = {}
        for item in request.items:
            product = session.get(Product, item.product_id)
            if not product:
                raise HTTPException(status_code=404, detail=f"product {item.product_id} not found")
            if not product.is_active:
                raise HTTPException(status_code=400, detail=f"product {product.name} is inactive")
            products_map[item.product_id] = product
        
        # ========== calculate totals ==========
        order_items_data = []
        total_amount = 0.0
        items_count = 0
        
        for item in request.items:
            product = products_map[item.product_id]
            subtotal = product.price * item.quantity
            
            order_items_data.append({
                "product_id": product.id,
                "product_name": product.name,
                "quantity": item.quantity,
                "unit_price": product.price,
                "subtotal": subtotal
            })
            
            total_amount += subtotal
            items_count += item.quantity
        
        # ========== generate order number ==========
        # format: yyyy mm dddddd where dddddd is auto incrementing sequence
        today = datetime.utcnow().strftime("%Y-%m-%d")
        latest_order = session.exec(
            select(Order).where(Order.order_number.startswith(today)).order_by(Order.id.desc())
        ).first()
        
        sequence = 1 if not latest_order else int(latest_order.order_number.split("-")[-1]) + 1
        order_number = f"{today}-{sequence:06d}"
        
        # ========== verifactu: cryptographic hash ==========
        # get previous order's hash for chaining
        latest_order_all = session.exec(select(Order).order_by(Order.id.desc())).first()
        previous_hash = latest_order_all.hash if latest_order_all else None
        
        # generate hash
        current_hash = generate_hash(
            order_number=order_number,
            timestamp=datetime.utcnow(),
            total_amount=total_amount,
            previous_hash=previous_hash
        )
        
        # ========== verifactu: qr code ==========
        tax_id = "A47111985Q"  # example spanish tax id (would be configurable) // placeholder
        
        # generate qr code with image
        qr_url, qr_image_data_url = generate_verifactu_qr(
            nif=tax_id,
            invoice_number=order_number,
            date=datetime.utcnow(),
            total_amount=total_amount,
            hash_value=current_hash
        )
        
        # save qr code image to filesystem
        # use absolute path to project root qr_codes folder
        backend_dir = Path(__file__).parent.parent
        project_root = backend_dir.parent.parent
        qr_output_dir = project_root / "qr_codes"
        qr_file_path = save_qr_image(
            invoice_number=order_number,
            qr_data_url=qr_image_data_url,
            output_dir=str(qr_output_dir)
        )
        
        # ========== create order ==========
        order = Order(
            order_number=order_number,
            total_amount=total_amount,
            items_count=items_count,
            hash=current_hash,
            previous_hash=previous_hash,
            qr_code_content=qr_url,
            qr_code_image=qr_image_data_url,
            qr_code_file_path=qr_file_path,
            payment_method=request.payment_method,
            notes=request.notes,
            is_verified=True
        )
        session.add(order)
        session.flush()  # get order.id without committing
        
        # ========== create order items ==========
        for item_data in order_items_data:
            order_item = OrderItem(
                order_id=order.id,
                product_id=item_data["product_id"],
                quantity=item_data["quantity"],
                unit_price=item_data["unit_price"],
                subtotal=item_data["subtotal"],
                product_name=item_data["product_name"]
            )
            session.add(order_item)
            
            # ========== update product stock ==========
            product = products_map[item_data["product_id"]]
            if hasattr(product, 'stock_qty'):
                previous_stock = int(product.stock_qty)
                product.stock_qty -= int(item_data["quantity"])
                new_stock = int(product.stock_qty)
                session.add(product)

                # record stock movement for auditability
                session.add(StockMovement(
                    product_id=product.id,
                    quantity_change=-abs(item_data["quantity"]),
                    movement_type="sale",
                    cost_impact=-(product.cost_per_unit * item_data["quantity"]),
                    reference_order_id=order.id,
                    previous_stock=previous_stock,
                    new_stock=new_stock
                ))
        
        # ========== record income ==========
        income = Income(
            order_id=order.id,
            amount=total_amount,
            source="sales"
        )
        session.add(income)
        
        # ========== calculate and record tax obligations ==========
        # spanish tax rates for autónomos
        IVA_RATE = 0.21  # 21% vat on goods/services
        IRPF_RATE = 0.15  # 15% income tax withholding (typical for autónomos)
        
        # calculate taxes
        # note: total_amount already includes iva, so we calculate base amount
        base_amount = total_amount / (1 + IVA_RATE)  # amount without vat
        iva_amount = total_amount - base_amount  # vat to pay to hacienda
        irpf_amount = base_amount * IRPF_RATE  # income tax to reserve
        
        # get or create tax reserve for current month
        current_month = datetime.utcnow().strftime("%Y-%m")
        tax_reserve = session.exec(
            select(TaxReserve).where(TaxReserve.month == current_month)
        ).first()
        
        if not tax_reserve:
            # create new tax reserve for this month
            tax_reserve = TaxReserve(
                month=current_month,
                irpf_amount=irpf_amount,
                iva_amount=iva_amount,
                iva_deductible=0.0,  # deductible iva from purchases (to be updated)
                reserved_amount=irpf_amount + iva_amount
            )
            session.add(tax_reserve)
        else:
            # update existing tax reserve
            tax_reserve.irpf_amount += irpf_amount
            tax_reserve.iva_amount += iva_amount
            tax_reserve.reserved_amount = tax_reserve.irpf_amount + tax_reserve.iva_amount - tax_reserve.iva_deductible
            tax_reserve.last_updated = datetime.utcnow()
            session.add(tax_reserve)
        
        # ========== verifactu: immutable ledger entry ==========
        # get next sequence number
        latest_ledger = session.exec(
            select(InvoiceLedger).order_by(InvoiceLedger.sequence_number.desc())
        ).first()
        next_sequence = 1 if not latest_ledger else latest_ledger.sequence_number + 1
        
        # create ledger entry (immutable, append-only)
        ledger_entry = InvoiceLedger(
            sequence_number=next_sequence,
            order_id=order.id,
            invoice_number=order_number,
            hash=current_hash,
            previous_hash=previous_hash or "0" * 64,
            amount=total_amount,
            is_verified=True,
            verification_hash_check=True
        )
        session.add(ledger_entry)
        
        # ========== audit log ==========
        log_system_event(
            session=session,
            event_type="order_created",
            event_data={
                "order_id": order.id,
                "order_number": order_number,
                "total": total_amount,
                "items_count": items_count,
                "hash": current_hash[:16] + "...",
                "payment_method": request.payment_method
            },
            success=True
        )
        
        # ========== commit all changes ==========
        session.commit()
        session.refresh(order)
        
        # ========== build response ==========
        response_items = [
            OrderItemResponse(
                product_name=item.product_name,
                quantity=item.quantity,
                unit_price=item.unit_price,
                subtotal=item.subtotal
            )
            for item in session.exec(select(OrderItem).where(OrderItem.order_id == order.id)).all()
        ]
        
        return OrderResponse(
            id=order.id,
            order_number=order_number,
            total_amount=total_amount,
            items_count=items_count,
            hash=current_hash,
            qr_code_image=qr_image_data_url,
            timestamp=order.timestamp.isoformat(),
            items=response_items
        )
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"\n❌ ORDER CREATION ERROR:\n{error_trace}\n")
        session.rollback()
        try:
            log_system_event(
                session=session,
                event_type="order_creation_failed",
                event_data={"error": str(e), "traceback": error_trace},
                success=False
            )
        except:
            pass
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")


@router.get("/invoices", response_model=List[OrderResponse])
async def get_invoices(month: Optional[str] = None, session: Session = Depends(get_session)):
    """
    List all orders/invoices.
    Optional filter by month (YYYY-MM format)
    """
    query = select(Order).order_by(Order.timestamp.desc())
    
    if month:
        # filter by month
        query = query.where(Order.order_number.startswith(month))
    
    orders = session.exec(query).all()
    
    results = []
    for order in orders:
        items = session.exec(select(OrderItem).where(OrderItem.order_id == order.id)).all()
        response_items = [
            OrderItemResponse(
                product_name=item.product_name,
                quantity=item.quantity,
                unit_price=item.unit_price,
                subtotal=item.subtotal
            )
            for item in items
        ]
        
        results.append(OrderResponse(
            id=order.id,
            order_number=order.order_number,
            total_amount=order.total_amount,
            items_count=order.items_count,
            hash=order.hash,
            qr_code_image=order.qr_code_image or "",
            timestamp=order.timestamp.isoformat(),
            items=response_items
        ))
    
    return results

# ==================== GET PRODUCTS WITH STOCK ====================

@router.get("/products")
async def get_products_with_stock(session: Session = Depends(get_session)):
    """
    get all active products with their current stock levels
    used by POS to show out of stock status
    """
    products = session.exec(
        select(Product).where(Product.is_active == True).order_by(Product.id)
    ).all()
    
    result = []
    for product in products:
        # get stock quantity from product table
        quantity_available = getattr(product, 'stock_qty', 0)
        is_in_stock = quantity_available > 0
        
        result.append({
            "id": product.id,
            "name": product.name,
            "price": product.price,
            "category": product.category,
            "quantity_available": quantity_available,
            "is_in_stock": is_in_stock,
            "is_active": product.is_active
        })
    
    return result