from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models import Product, StockMovement, Expense
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/inventory", tags=["inventory"])

class UpdateStockRequest(BaseModel):
    """Request model for updating stock quantity"""
    quantity: int

class InventoryResponse(BaseModel):
    """Response model for inventory items"""
    id: int
    name: str
    category: str
    price: float
    cost_per_unit: float
    stock_quantity: int
    max_capacity: int
    is_active: bool

@router.get("/", response_model=list[InventoryResponse])
def get_inventory(session: Session = Depends(get_session)):
    """
    Get all products with their current stock levels.
    Returns a list of products from the database.
    """
    try:
        products = session.exec(select(Product)).all()
        
        # Transform products to inventory response format
        inventory = []
        for product in products:
            # Calculate max capacity based on category (example values)
            max_capacity_map = {
                "café": 100,
                "comida": 50,
                "bebida": 80,
            }
            max_capacity = max_capacity_map.get(product.category, 100)
            
            inventory.append(InventoryResponse(
                id=product.id,
                name=product.name,
                category=product.category,
                price=product.price,
                cost_per_unit=product.cost_per_unit,
                stock_quantity=getattr(product, 'stock_qty', 0),  # Default to 0 if not present
                max_capacity=max_capacity,
                is_active=product.is_active
            ))
        
        return inventory
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching inventory: {str(e)}")

@router.patch("/{product_id}")
def update_stock(
    product_id: int,
    request: UpdateStockRequest,
    session: Session = Depends(get_session)
):
    """
    Update stock quantity for a product when Maria receives a shipment.
    This adds to the existing stock (restock operation).
    """
    try:
        # Get the product
        product = session.get(Product, product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
        
        # Update stock - add new quantity to existing
        current_stock = getattr(product, 'stock_qty', 0)
        new_stock = current_stock + request.quantity
        
        # Calculate restock cost
        restock_cost = product.cost_per_unit * request.quantity
        
        # Set the new stock value
        setattr(product, 'stock_qty', new_stock)
        session.add(product)

        # audit stock movement
        session.add(StockMovement(
            product_id=product.id,
            quantity_change=request.quantity,
            movement_type="restock",
            cost_impact=restock_cost,
            previous_stock=current_stock,
            new_stock=new_stock
        ))
        
        # create expense entry for restock cost (impacts balance)
        restock_expense = Expense(
            description=f"Restock: {product.name} (+{request.quantity} units)",
            amount=restock_cost,
            category="inventory_restock",
            date=datetime.utcnow(),
            month=datetime.utcnow().strftime("%Y-%m")
        )
        session.add(restock_expense)

        session.commit()
        session.refresh(product)
        
        return {
            "success": True,
            "message": f"Stock updated for {product.name}. Balance reduced by €{restock_cost:.2f}",
            "data": {
                "product_id": product.id,
                "product_name": product.name,
                "previous_stock": current_stock,
                "added_quantity": request.quantity,
                "new_stock": new_stock,
                "restock_cost": round(restock_cost, 2),
                "expense_id": restock_expense.id,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating stock: {str(e)}")
