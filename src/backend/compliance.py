import hashlib
from typing import Optional
from datetime import datetime
from sqlmodel import Session, select
import json
from models import Order, InvoiceLedger, SystemEventLog


def generate_hash(order_number: str, timestamp: datetime, total_amount: float, previous_hash: Optional[str] = None) -> str:
    """
    generate sha-256 hash for order with cryptographic chaining.
    formula: h_n = sha-256(order_number + timestamp + total_amount + h_{n-1})
    
    royal decree 1007/2023 compliance:
    each invoice must contain a digital fingerprint that includes the previous invoice's hash.
    """
    hash_input = f"{order_number}{timestamp.isoformat()}{total_amount:.2f}"
    if previous_hash:
        hash_input += previous_hash
    
    return hashlib.sha256(hash_input.encode()).hexdigest()


def generate_qr_code_content(tax_id: str, invoice_number: str, timestamp: datetime, total_amount: float, hash_value: str) -> str:
    """
    generate aeat compliant qr code content.
    
    format: https://www.aeat.es/wlcl/[nif]/[invoice]/[date]/[amount]/[hash_prefix]
    
    where:
    - nif: tax identification number
    - invoice: invoice number
    - date: yyyymmdd format
    - amount: total amount * 100 (integer centimos)
    - hash_prefix: first 10 characters of sha-256 hash
    """
    date_str = timestamp.strftime("%Y%m%d")
    amount_int = int(total_amount * 100)
    hash_prefix = hash_value[:10]
    
    qr_url = f"https://www.aeat.es/wlcl/{tax_id}/{invoice_number}/{date_str}/{amount_int}/{hash_prefix}"
    return qr_url


def verify_ledger_integrity(session: Session) -> dict:
    """
    verify the cryptographic chain integrity of all invoices in the ledger.
    ensures compliance with royal decree 1007/2023 requirements.
    """
    statement = select(InvoiceLedger).order_by(InvoiceLedger.sequence_number)
    ledger_entries = session.exec(statement).all()
    
    breaches = []
    
    for i, entry in enumerate(ledger_entries):
        if i == 0:
            # first entry should have empty or none previous_hash
            if entry.previous_hash and entry.previous_hash != "0" * 64:
                breaches.append({
                    "sequence": entry.sequence_number,
                    "issue": "first ledger entry has non zero previous_hash",
                    "actual": entry.previous_hash[:16] + "..."
                })
        else:
            prev_entry = ledger_entries[i - 1]
            if entry.previous_hash != prev_entry.hash:
                breaches.append({
                    "sequence": entry.sequence_number,
                    "expected_previous": prev_entry.hash[:16] + "...",
                    "actual_previous": entry.previous_hash[:16] + "...",
                    "issue": "hash chain broken tampering detected!"
                })
    
    return {
        "status": "secure" if not breaches else "breach_detected",
        "total_entries": len(ledger_entries),
        "verified_chain": len(ledger_entries) - len(breaches),
        "breaches": breaches,
        "compliance": "royal decree 1007/2023"
    }


def log_system_event(session: Session, event_type: str, event_data: dict, user_id: Optional[str] = None, success: bool = True):
    """
    log system events for audit trail and compliance.
    
    event types:
    - app_open: application started
    - order_created: new order/invoice created
    - expense_logged: expense recorded
    - inventory_adjustment: stock modified
    - invoice_modification_attempted: attempted to modify invoice (blocked)
    - export_initiated: tax export started
    """
    # ensure success flag is included in the serialized event data
    payload = dict(event_data) if event_data is not None else {}
    payload.setdefault("success", success)

    event_log = SystemEventLog(
        event_type=event_type,
        event_data=json.dumps(payload),
        user_id=user_id,
        timestamp=datetime.now()
    )
    session.add(event_log)
    session.commit()
    return event_log


def prevent_invoice_modification(invoice_id: int):
    """
    prevent modifications to existing orders/invoices (append only constraint).
    raises permissionerror to block any update/delete attempts.
    
    per royal decree 1007/2023, invoices must be immutable once created.
    """
    raise PermissionError(
        f"invoice {invoice_id} is immutable per royal decree 1007/2023. "
        "no modifications or deletions are allowed. "
        "if an error occurred, create a corrective invoice instead."
    )
