from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from datetime import datetime, timedelta
from database import get_session
from compliance import verify_ledger_integrity
from schemas import LedgerVerificationResponse
from models import Order

router = APIRouter(prefix="/compliance", tags=["compliance"])

@router.get("/verify-ledger", response_model=LedgerVerificationResponse)
def verify_ledger(session: Session = Depends(get_session)):
    """
    verify the integrity of the cryptographic chain.
    checks that each order's previous_hash matches the prior order's hash.
    """
    result = verify_ledger_integrity(session)
    return LedgerVerificationResponse(**result)

@router.get("/export-tax-data")
def export_tax_data(session: Session = Depends(get_session)):
    """
    export tax data for:
    - modelo 303 (vat return)
    - modelo 130 (income tax self assessment)
    """
    # get last 30 days of data
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    # calculate total sales (vat is approximately 21% in spain)
    sales_statement = select(func.sum(Order.total_amount)).where(
        Order.timestamp >= thirty_days_ago
    )
    total_sales = session.exec(sales_statement).first() or 0
    
    # calculate estimated vat (21%)
    estimated_vat = float(total_sales) * 0.21
    
    return {
        "periodo": "Last 30 days",
        "modelo_303": {
            "total_sales": float(total_sales),
            "vat_rate": 0.21,
            "estimated_vat": estimated_vat
        },
        "modelo_130": {
            "total_income": float(total_sales)
        },
        "export_date": datetime.utcnow().isoformat()
    }

