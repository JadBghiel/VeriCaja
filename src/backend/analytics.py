from datetime import datetime, timedelta
from sqlmodel import Session, select, func
from models import Order, Income, Expense, StockMovement, TaxReserve
from typing import Dict, Any

def calculate_daily_burn_rate(session: Session) -> float:
    """
    calculate average daily burn rate based on manual expenses only.
    formula: total monthly expenses / 30
    """
    # get average daily expenses from last 30 days (manual expenses only)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    expense_statement = select(func.sum(Expense.amount)).where(
        Expense.date >= thirty_days_ago
    )
    monthly_expenses = session.exec(expense_statement).first() or 0
    
    daily_burn = monthly_expenses / 30 if monthly_expenses > 0 else 0
    return daily_burn

def calculate_cogs(session: Session, days: int = 30) -> float:
    """
    calculate cost of goods sold from stock movements.
    sum of cost_impact for all 'sale' movements in the period.
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    cogs_stmt = select(func.sum(StockMovement.cost_impact)).where(
        StockMovement.movement_type == "sale",
        StockMovement.timestamp >= cutoff_date
    )
    cogs = session.exec(cogs_stmt).first() or 0
    
    # cost_impact is negative for sales, so we need absolute value
    return abs(float(cogs)) if cogs else 0.0

def calculate_survival_clock(session: Session, current_cash_balance: float) -> dict:
    """
    calculate the survival clock (days of runway).
    formula: runway (days) = current cash balance / average daily burn rate
    returns: days count and estimated end date
    """
    daily_burn_rate = calculate_daily_burn_rate(session)
    
    if daily_burn_rate <= 0:
        runway_days = 999
        estimated_date = (datetime.utcnow() + timedelta(days=999)).strftime("%d %B %Y")
    else:
        runway_days = int(current_cash_balance / daily_burn_rate)
        estimated_date = (datetime.utcnow() + timedelta(days=runway_days)).strftime("%d %B %Y")
    
    # Determine health status
    if runway_days < 15:
        status = "critical"
        color = "red"
    elif runway_days < 30:
        status = "warning"
        color = "amber"
    else:
        status = "healthy"
        color = "green"
    
    return {
        "cash_balance": current_cash_balance,
        "daily_burn_rate": round(daily_burn_rate, 2),
        "runway_days": runway_days,
        "estimated_date": estimated_date,
        "status": status,
        "color": color
    }

def calculate_revenue_and_expenses(session: Session, days: int = 30) -> Dict[str, Any]:
    """
    calculate total revenue, expenses, COGS, and taxes for a given period.
    returns data suitable for chart visualization.
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # get daily revenue
    revenue_by_day = {}
    for i in range(days):
        day = (datetime.utcnow() - timedelta(days=days-1-i)).date()
        revenue_stmt = select(func.sum(Income.amount)).where(
            func.date(Income.date) == day
        )
        revenue = session.exec(revenue_stmt).first() or 0
        revenue_by_day[day.strftime("%d/%m")] = round(float(revenue), 2)
    
    # get daily expenses (manual only)
    expenses_by_day = {}
    for i in range(days):
        day = (datetime.utcnow() - timedelta(days=days-1-i)).date()
        expense_stmt = select(func.sum(Expense.amount)).where(
            func.date(Expense.date) == day
        )
        expenses = session.exec(expense_stmt).first() or 0
        expenses_by_day[day.strftime("%d/%m")] = round(float(expenses), 2)
    
    total_revenue = sum(revenue_by_day.values())
    total_expenses = sum(expenses_by_day.values())
    
    # calculate COGS from stock movements
    cogs = calculate_cogs(session, days)
    
    # get tax reserves for current month
    current_month = datetime.utcnow().strftime("%Y-%m")
    tax_stmt = select(TaxReserve).where(TaxReserve.month == current_month)
    tax_reserve = session.exec(tax_stmt).first()
    total_tax = tax_reserve.reserved_amount if tax_reserve else 0.0
    
    # Net Profit = Income - Tax - COGS - Manual Expenses
    net_profit = total_revenue - total_tax - cogs - total_expenses
    
    return {
        "dates": list(revenue_by_day.keys()),
        "revenue": list(revenue_by_day.values()),
        "expenses": list(expenses_by_day.values()),
        "total_revenue": round(total_revenue, 2),
        "total_expenses": round(total_expenses, 2),
        "total_cogs": round(cogs, 2),
        "total_tax": round(float(total_tax), 2),
        "net_profit": round(net_profit, 2)
    }

def calculate_net_profit(session: Session, days: int = 30) -> float:
    """calculate net profit for the given period"""
    data = calculate_revenue_and_expenses(session, days)
    return data["net_profit"]

def get_dashboard_metrics(session: Session, current_cash_balance: float) -> Dict[str, Any]:
    """
    get all dashboard metrics in one call.
    simplified formula: Net Profit = Income - Tax - COGS - Manual Expenses
    """
    # get 30 day period data
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    # revenue metrics
    revenue_stmt = select(func.sum(Income.amount)).where(
        Income.date >= thirty_days_ago
    )
    total_revenue = session.exec(revenue_stmt).first() or 0
    
    # expense metrics (manual only)
    expense_stmt = select(func.sum(Expense.amount)).where(
        Expense.date >= thirty_days_ago
    )
    total_expenses = session.exec(expense_stmt).first() or 0
    
    # COGS from stock movements
    cogs = calculate_cogs(session, 30)
    
    # get actual tax reserves for current month
    current_month = datetime.utcnow().strftime("%Y-%m")
    tax_stmt = select(TaxReserve).where(TaxReserve.month == current_month)
    tax_reserve = session.exec(tax_stmt).first()
    
    iva_amount = tax_reserve.iva_amount if tax_reserve else 0.0
    irpf_amount = tax_reserve.irpf_amount if tax_reserve else 0.0
    total_tax = tax_reserve.reserved_amount if tax_reserve else 0.0
    
    # Net Profit = Income - Tax - COGS - Manual Expenses
    net_profit = float(total_revenue) - total_tax - cogs - float(total_expenses)
    
    return {
        "survival_clock": calculate_survival_clock(session, current_cash_balance),
        "revenue_expenses": calculate_revenue_and_expenses(session, 30),
        "total_revenue": round(float(total_revenue), 2),
        "total_expenses": round(float(total_expenses), 2),
        "total_cogs": round(cogs, 2),
        "total_tax": round(total_tax, 2),
        "net_profit": round(net_profit, 2),
        "iva_amount": round(float(iva_amount), 2),
        "irpf_amount": round(float(irpf_amount), 2),
    }

