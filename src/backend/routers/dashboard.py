from fastapi import APIRouter, Depends, HTTPException
from starlette.responses import FileResponse
from sqlmodel import Session, select
from database import get_session
from analytics import calculate_survival_clock, get_dashboard_metrics
from schemas import ExpenseRequest
from models import Expense, Income
from datetime import datetime
import os

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/survival-clock")
def get_survival_clock(
    cash_balance: float = 5000.0,
    session: Session = Depends(get_session)
):
    """
    get the survival clock calculation with comprehensive financial metrics.
    returns days of runway, estimated date, and financial status.
    """
    survival_data = calculate_survival_clock(session, cash_balance)
    return survival_data

@router.get("/metrics")
def get_all_metrics(
    cash_balance: float = 5000.0,
    session: Session = Depends(get_session)
):
    """
    get all dashboard metrics including revenue, expenses, and projections.
    """
    metrics = get_dashboard_metrics(session, cash_balance)
    return metrics

@router.post("/expenses")
def create_expense(
    expense: ExpenseRequest,
    session: Session = Depends(get_session)
):
    """
    log a new expense in the system.
    """
    try:
        new_expense = Expense(
            description=expense.description,
            amount=expense.amount,
            category=expense.category,
            date=expense.date or datetime.utcnow(),
            month=expense.month or datetime.utcnow().strftime("%Y-%m")
        )
        session.add(new_expense)
        session.commit()
        session.refresh(new_expense)
        
        return {
            "success": True,
            "message": "Gasto registrado exitosamente",
            "expense_id": new_expense.id,
            "data": {
                "id": new_expense.id,
                "description": new_expense.description,
                "amount": new_expense.amount,
                "category": new_expense.category,
                "date": new_expense.date.isoformat(),
                "month": new_expense.month
            }
        }
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/expenses")
def list_expenses(
    session: Session = Depends(get_session),
    limit: int = 50
):
    """
    get list of recent expenses.
    """
    expenses_stmt = select(Expense).order_by(Expense.date.desc()).limit(limit)
    expenses = session.exec(expenses_stmt).all()
    
    return {
        "expenses": [
            {
                "id": e.id,
                "description": e.description,
                "amount": e.amount,
                "category": e.category,
                "date": e.date.isoformat(),
                "month": e.month
            }
            for e in expenses
        ],
        "total": len(expenses)
    }

@router.get("/export-database")
def export_database():
    """
    download the database file for backup.
    """
    db_path = "./vericaja.db"
    
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail="Database file not found")
    
    return FileResponse(
        path=db_path,
        filename="vericaja.db",
        media_type="application/octet-stream"
    )

@router.get("/revenue-expenses")
def get_revenue_expenses_chart(
    days: int = 30,
    session: Session = Depends(get_session)
):
    """
    get revenue and expenses data for chart visualization.
    """
    from analytics import calculate_revenue_and_expenses
    
    data = calculate_revenue_and_expenses(session, days)
    return data

