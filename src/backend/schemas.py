from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional


class WastageLogRequest(BaseModel):
    product_id: int
    quantity: int


class ExpenseRequest(BaseModel):
    description: str
    amount: float
    category: str
    date: Optional[datetime] = None
    month: Optional[str] = None


class LedgerVerificationResponse(BaseModel):
    status: str
    total_entries: int
    verified_chain: int
    breaches: List[dict]

