# VeriCaja Database Schema - Complete Explanation

This document provides a detailed explanation of every table in the VeriCaja database, what it does, why it's needed, and how everything connects.

---

## Overview Architecture

VeriCaja's database is structured around three core workflows:
1. **Sales & Inventory** - Track what's sold and adjust stock
2. **Financial Management** - Track income, expenses, overhead, salaries
3. **Tax Compliance** - Calculate and reserve tax obligations for Spanish regulations
4. **Cryptographic Audit Trail** - Immutable invoice ledger for fraud prevention

---

## Core Catalog Tables

### 🏷️ `products`
**Purpose:** Master product catalog for the POS system.

**Columns:**
- `id` (int PK) - Unique identifier
- `name` (str) - Product name (e.g., "Espresso", "Croissant")
- `description` (str) - Customer-facing description
- `price` (float) - Selling price in euros
- `category` (str) - Category for organization ("café", "comida", "bebida")
- `cost_per_unit` (float) - Cost to purchase/produce (used for profit calculation)
- `stock_qty` (int) - **Current stock quantity** (real-time inventory)
- `is_active` (bool) - Enable/disable without deleting
- `created_at` (datetime) - Record creation timestamp

**Why It's Here:**
- **Single source of truth for inventory** - `stock_qty` is decremented on each sale and incremented on restock
- **Profit tracking** - Knowing both `price` and `cost_per_unit` allows real-time profit calculation
- **POS backbone** - Every sale must reference a product; without it, the system can't function

**Real-World Usage:**
When Maria makes a sale of 2 Espressos, the POS looks up the Espresso product (price: €2.50), sells it, then decrements `stock_qty` from 45 to 43. When stock runs low, Maria restocks via the Inventario view (PATCH /inventory), which increments `stock_qty` and logs the movement.

---

## Financial Overview Tables

### 💰 `overhead_costs`
**Purpose:** Track recurring operational costs (rent, utilities, insurance).

**Columns:**
- `id` (int PK) - Unique identifier
- `description` (str) - What the cost is for (e.g., "Alquiler mensual", "Electricidad")
- `amount` (float) - Cost in euros
- `frequency` (str) - Recurrence ("monthly", "weekly", etc.)

**Why It's Here:**
- **Burn rate calculation** - Used by the Survival Clock to determine how many days of cash runway the business has
- **Financial dashboard** - Shows fixed costs that must be paid regardless of sales
- **Cash flow planning** - Helps Maria predict when money will run out

**Real-World Usage:**
- Monthly rent: €1500
- Internet & phone: €80
- Electricity: €200
- Water: €50
- **Total daily burn = (€1830 / 30 days) ≈ €61/day**

If Maria has €3000 cash and daily burn is €61, she has ≈ 49 days of runway (Survival Clock shows this).

---

### 👔 `salaries`
**Purpose:** Employee compensation and labor costs.

**Columns:**
- `id` (int PK) - Unique identifier
- `employee_name` (str) - Employee name (e.g., "Juan López (Part-time)")
- `hourly_rate` (float) - Hourly wage in euros
- `hours_worked` (float) - Hours worked in the current period
- `social_security_est` (float) - Estimated social security contributions

**Why It's Here:**
- **Payroll tracking** - Know exact labor costs to calculate profitability
- **Burn rate calculation** - Salary + social security is a major fixed cost
- **Compliance** - Spain requires tracking of employee compensation

**Real-World Usage:**
- Owner (María García): hourly_rate=€0, but social_security_est=€2000 (owner's self-employed contribution)
- Part-time barista (Juan López): €12/hour × 150 hours/month = €1800 + €300 social security = €2100/month
- **Total monthly labor cost ≈ €4400** (included in burn rate)

---

## Sales & Orders Tables

### 📦 `orders`
**Purpose:** Every sale/transaction creates an order record (like a receipt or invoice).

**Columns:**
- `id` (int PK) - Internal order ID
- `order_number` (str UNIQUE) - Human-readable order number (e.g., "2026-01-15-000001")
- `total_amount` (float) - Total sale amount in euros
- `items_count` (int) - Number of items sold
- `hash` (str) - Cryptographic SHA-256 hash (Verifactu compliance)
- `previous_hash` (str) - Hash of previous order (creates chain for fraud detection)
- `qr_code_content` (str) - QR code data pointing to AEAT verification
- `qr_code_image` (str) - Base64 encoded QR image
- `qr_code_file_path` (str) - Path to QR file on disk
- `timestamp` (datetime) - When the sale happened
- `is_verified` (bool) - Verified by tax authority (Verifactu)
- `payment_method` (str) - "cash" or "card"
- `notes` (str) - Optional notes (e.g., "customer complaint noted")

**Why It's Here:**
- **Legal requirement** - Spain's Verifactu law mandates cryptographic invoice records
- **Fraud prevention** - Hash chaining creates tamper-evident audit trail
- **Income tracking** - Every sale is recorded for financial reports
- **Customer receipt** - QR code allows verification via AEAT website

**Real-World Usage:**
When Maria makes a €12.50 sale (2 cappuccinos, 1 croissant):
1. Order created: order_number = "2026-01-16-000001", total = €12.50
2. Hash generated: "a3f2c8d9e1b5..." using order_number + timestamp + total + previous_hash
3. QR generated: Points to AEAT for public verification
4. Items recorded in `order_items`
5. Income recorded in `income` table
6. Stock decremented in `products`
7. Ledger entry created in `invoice_ledger` (immutable)

---

### 🛒 `order_items`
**Purpose:** Line items within each order (what was actually sold).

**Columns:**
- `id` (int PK) - Unique identifier
- `order_id` (int FK) - Links to parent `orders` table
- `product_id` (int FK) - Links to `products` table
- `quantity` (float) - How many of this product
- `unit_price` (float) - Price at time of sale (snapshot for history)
- `subtotal` (float) - quantity × unit_price
- `product_name` (str) - Name snapshot (if product is deleted later, name is preserved)

**Why It's Here:**
- **Order details** - An order has multiple items; this table breaks down each line
- **Historical accuracy** - Stores price at time of sale (even if product price changes later)
- **Inventory decrement** - POS uses this to update product `stock_qty`
- **Audit trail** - Shows exactly what was sold when

**Real-World Usage:**
Order #2026-01-16-000001 contains:
| product_id | product_name | quantity | unit_price | subtotal |
|--|--|--|--|--|
| 1 | Cappuccino | 2 | 3.50 | 7.00 |
| 4 | Croissant | 1 | 2.80 | 2.80 |
| 6 | Agua | 1 | 1.50 | 1.50 |
**Total: €11.30**

---

### 📊 `income`
**Purpose:** Track all income sources for financial dashboard.

**Columns:**
- `id` (int PK) - Unique identifier
- `order_id` (int FK) - Links to `orders` table
- `amount` (float) - Sale amount
- `source` (str) - Source type ("sales", "refund", "other")
- `date` (datetime) - When income was received

**Why It's Here:**
- **Revenue calculation** - Daily/monthly revenue is summed from this table
- **Dashboard metrics** - Shows total income vs. expenses for profit calculation
- **Tax calculation** - Income × 21% = IVA owed; income - expenses × 15% = IRPF owed
- **Financial reports** - Banks/accountants ask "how much revenue?" → query this table

**Real-World Usage:**
After a sale of €11.30, an income record is created:
- order_id = 1
- amount = 11.30
- source = "sales"
- date = 2026-01-16 14:35:22

By end of month, if 500 sales totaling €6200 were made, income table shows €6200 total revenue.

---

## Inventory Tracking Table

### 📦 `stock_movements`
**Purpose:** Audit log of every stock change (who took from inventory, when, and why).

**Columns:**
- `id` (int PK) - Unique identifier
- `product_id` (int FK) - Links to `products` table
- `quantity_change` (float) - Change amount (+100 for restock, -2 for sale)
- `movement_type` (str) - Type of movement ("sale", "restock", "wastage", "seed_restock")
- `wastage_reason` (str) - Why product was removed (e.g., "expired", "broken")
- `cost_impact` (float) - Financial impact (e.g., -€2.40 for 2 sold cappuccinos)
- `reference_order_id` (int FK) - Links to order if movement was from a sale
- `previous_stock` (float) - Stock quantity before movement
- `new_stock` (float) - Stock quantity after movement
- `timestamp` (datetime) - When the movement happened

**Why It's Here:**
- **Inventory auditability** - Track WHERE every single unit went
- **Loss detection** - Can identify if stock is disappearing (theft/spoilage)
- **Financial impact** - Each movement has cost_impact for accounting
- **Reconciliation** - If database stock ≠ physical count, movements show what happened
- **Legal compliance** - Spain may audit: "Prove you actually sold those units"

**Real-World Usage:**
**Scenario 1: Sale**
- Previous cappuccino stock: 45 units
- Customer buys 2 cappuccinos
- Movement logged: quantity_change = -2, movement_type = "sale", previous_stock = 45, new_stock = 43, cost_impact = -€1.60 (2 × €0.80 cost)
- reference_order_id = 1 (links to the order that caused it)

**Scenario 2: Restock**
- Supplier delivers 30 cappuccinos
- Maria adds them via Inventario view
- Movement logged: quantity_change = +30, movement_type = "restock", previous_stock = 43, new_stock = 73, cost_impact = +€24 (30 × €0.80)

**Scenario 3: Wastage**
- Croissant is expired, must be thrown away
- Movement logged: quantity_change = -1, movement_type = "wastage", wastage_reason = "expired", cost_impact = -€1.20

By querying movements, Maria can answer: "How much did I lose to spoilage last month?" (SUM where wastage_reason IS NOT NULL)

---

## Expense & Cost Tables

### 💸 `expenses`
**Purpose:** Track ad-hoc and variable costs (supplies, maintenance, marketing).

**Columns:**
- `id` (int PK) - Unique identifier
- `description` (str) - What was purchased (e.g., "Coffee beans shipment")
- `amount` (float) - Cost in euros
- `category` (str) - Type ("supplies", "maintenance", "marketing", "equipment")
- `date` (datetime) - When purchased
- `month` (str) - Month in YYYY-MM format (indexed for fast queries)

**Why It's Here:**
- **Variable cost tracking** - Unlike fixed overhead, expenses vary monthly
- **Burn rate calculation** - Expenses are added to overhead when calculating runway
- **Profit calculation** - Revenue - expenses = profit
- **Dashboard insights** - Shows where money is being spent
- **Tax deduction** - Many expenses are tax-deductible

**Real-World Usage:**
- €150 coffee beans shipment (category: supplies, date: 2026-01-10)
- €80 equipment repair (category: maintenance, date: 2026-01-12)
- €200 local advertising (category: marketing, date: 2026-01-15)

By end of month, query SUM(amount) WHERE month = '2026-01' to get total variable costs, then:
**Net profit = Total income - Total expenses - Total overhead - Total salaries**

---

## Tax & Compliance Tables

### 🧾 `tax_reserves`
**Purpose:** Track Spanish tax obligations (what Maria owes the government).

**Columns:**
- `id` (int PK) - Unique identifier
- `month` (str UNIQUE) - Month in YYYY-MM format (one record per month)
- `irpf_amount` (float) - Personal income tax to withhold (15% in Spain)
- `iva_amount` (float) - VAT owed to government (21% on sales)
- `iva_deductible` (float) - VAT paid on purchases (can subtract from iva_amount)
- `modelo_303_due` (str) - Due date for VAT quarterly return
- `modelo_130_due` (str) - Due date for estimated quarterly tax return (autónomos)
- `reserved_amount` (float) - Total cash set aside for taxes
- `last_updated` (datetime) - When this record was last updated

**Why It's Here:**
- **Legal requirement** - Spain requires quarterly tax filings (Modelo 130, Modelo 303)
- **Cash flow management** - Maria needs to RESERVE cash for taxes (can't spend it)
- **Compliance dashboard** - Shows how much tax is owed and when due
- **Automatic calculation** - Each POS sale auto-updates this based on income

**Real-World Usage:**
After €6200 in January revenue and €1500 in expenses:
- **Base income** = €6200 / 1.21 = €5124 (remove VAT to get base)
- **IVA owed** = €6200 - €5124 = €1076 (21% of base)
- **IRPF owed** = €5124 × 15% = €769 (15% personal income tax)
- **Reserved amount** = €1076 + €769 = €1845 (set aside this much cash)

Tax record for January 2026:
- irpf_amount = €769
- iva_amount = €1076
- iva_deductible = €50 (if Maria bought supplies with VAT)
- reserved_amount = €1076 + €769 - €50 = €1795
- modelo_303_due = "2026-04-20" (quarterly)
- modelo_130_due = "2026-02-20" (quarterly)

By April, Maria files Modelo 303 with €1076 IVA; if she paid €50 VAT on purchases, she nets €1026 to pay.

---

### 📜 `invoice_ledger`
**Purpose:** Immutable, append-only cryptographic ledger (Verifactu compliance).

**Columns:**
- `id` (int PK) - Unique identifier
- `sequence_number` (int UNIQUE) - Sequential number (1, 2, 3, ... never reused)
- `order_id` (int FK UNIQUE) - Links to `orders` table (1:1 relationship)
- `invoice_number` (str UNIQUE) - Human-readable invoice number (e.g., "2026-01-16-000001")
- `hash` (str) - SHA-256 hash of this invoice
- `previous_hash` (str) - SHA-256 hash of prior invoice (creates tamper-proof chain)
- `amount` (float) - Invoice total in euros
- `timestamp` (datetime) - When invoice was created
- `is_verified` (bool) - Verified by AEAT (tax authority)
- `verification_hash_check` (bool) - Hash chain validates correctly

**Why It's Here:**
- **Spanish law (Verifactu)** - Mandatory digital invoice registry for tax authority compliance
- **Tamper-proof** - If someone tries to change an old invoice, the hash chain breaks
- **Fraud detection** - Hash chain allows AEAT to verify no invoices were deleted or modified
- **Immutable** - Never updated (only inserted); provides audit trail
- **Public verification** - AEAT can verify invoice via QR code on receipt

**Real-World Usage:**
Invoice sequence (immutable chain):
```
Invoice #1 (€12.50)
  hash = "a3f2c8d9..."
  previous_hash = "000000..." (first invoice, no prior)

Invoice #2 (€8.75)
  hash = "b5d4e6f8..."
  previous_hash = "a3f2c8d9..." ← links to Invoice #1's hash

Invoice #3 (€15.00)
  hash = "c7f0a2d4..."
  previous_hash = "b5d4e6f8..." ← links to Invoice #2's hash
```

If someone tries to change Invoice #1 to €20.00:
- New hash would be different
- Invoice #2's previous_hash wouldn't match
- Chain is broken → fraud detected!

AEAT can verify: "Show me invoices 1-100" → checks hashes → validates chain is unbroken.

---

## System Tables

### 📋 `system_event_logs`
**Purpose:** Audit log of system events for security and compliance.

**Columns:**
- `id` (int PK) - Unique identifier
- `event_type` (str) - Type of event ("order_created", "stock_updated", "user_login", "compliance_check")
- `user_id` (int) - Which user performed the action (optional)
- `timestamp` (datetime) - When the event occurred

**Why It's Here:**
- **Security audit** - Who did what and when?
- **Compliance** - Spain requires audit trails for tax purposes
- **Debugging** - If something goes wrong, check logs
- **Fraud prevention** - Can detect unusual patterns (e.g., 1000 orders in 1 minute)
- **User accountability** - If multiple staff members use system, track who did what

**Real-World Usage:**
Events logged:
- event_type = "order_created", timestamp = 2026-01-16 14:35:22 (sale made)
- event_type = "stock_updated", timestamp = 2026-01-16 15:00:00 (Maria restocked)
- event_type = "compliance_check", timestamp = 2026-01-20 10:00:00 (system verified hashes)

If AEAT audits: "Prove stock levels are accurate" → show stock_movements + system_event_logs proving every change.

---

## Data Flow & Connections

### When Maria Makes a Sale:
1. **POS creates Order** → `orders` table gets 1 new row
2. **Order items created** → `order_items` table gets line items
3. **Stock decremented** → `products.stock_qty` reduced
4. **Stock movement logged** → `stock_movements` gets 1 row (movement_type = "sale")
5. **Income recorded** → `income` table gets 1 row
6. **Tax reserve updated** → `tax_reserves` gets updated (or created if new month)
7. **Ledger entry created** → `invoice_ledger` gets 1 row (immutable)
8. **Event logged** → `system_event_logs` gets 1 row
9. **QR code generated** → `orders.qr_code_image` populated

### When Maria Restocks:
1. **PATCH /inventory/{product_id}** with quantity
2. **Product stock updated** → `products.stock_qty` increased
3. **Stock movement logged** → `stock_movements` gets 1 row (movement_type = "restock")

### When Dashboard Loads:
1. **Revenue calc** → SUM(`income.amount`) for date range
2. **Expenses calc** → SUM(`expenses.amount`) for date range
3. **Burn rate calc** → (SUM(`overhead_costs.amount`) + SUM(`salaries.amount`) + SUM(`expenses.amount`)) / 30
4. **Survival clock** → `cash_balance / burn_rate`
5. **Tax reserved** → SUM(`tax_reserves.reserved_amount`)
6. **Inventory check** → COUNT from `products` WHERE stock_qty < threshold

---

## Summary: Why Each Table Exists

| Table | Why | Critical? |
|--|--|--|
| **products** | Catalog of items to sell + real-time stock | ✅ YES |
| **orders** | Every sale (legal requirement) | ✅ YES |
| **order_items** | What was in each order | ✅ YES |
| **income** | Revenue tracking for profits/taxes | ✅ YES |
| **stock_movements** | Audit trail of inventory changes | ⚠️ IMPORTANT |
| **tax_reserves** | Calculate & reserve tax obligations | ✅ YES |
| **invoice_ledger** | Immutable ledger (Verifactu law) | ✅ YES |
| **expenses** | Variable costs | ⚠️ IMPORTANT |
| **overhead_costs** | Fixed recurring costs | ⚠️ IMPORTANT |
| **salaries** | Employee compensation | ⚠️ IMPORTANT |
| **system_event_logs** | Audit trail of events | ⚠️ COMPLIANCE |

---

## Data Integrity Rules

✅ **Enforced by database:**
- Every `order_item` must reference valid `order_id` and `product_id`
- Every `income` must reference valid `order_id`
- Every `stock_movement` must reference valid `product_id`
- Every `tax_reserve` has unique month (only 1 per month)
- Every `invoice_ledger` sequence_number is unique and immutable

✅ **Enforced by application logic:**
- `stock_qty` is never negative (clamped to 0)
- Each sale creates order + order_items + income + stock_movement + ledger entry (transaction)
- Tax calculations happen automatically on each sale
- Hash chain is verified on system startup

---

## Querying Examples

**"How much revenue did we make in January?"**
```sql
SELECT SUM(amount) FROM income WHERE strftime('%Y-%m', date) = '2026-01'
```

**"Which products are below stock threshold?"**
```sql
SELECT name, stock_qty FROM products WHERE stock_qty < 10 ORDER BY stock_qty ASC
```

**"What's our profit this month?"**
```sql
SELECT 
  (SELECT SUM(amount) FROM income WHERE strftime('%Y-%m', date) = '2026-01') as revenue,
  (SELECT SUM(amount) FROM expenses WHERE month = '2026-01') as expenses,
  (SELECT SUM(amount * frequency) FROM overhead_costs) as overhead
```

**"How much tax do we owe?"**
```sql
SELECT irpf_amount, iva_amount, reserved_amount FROM tax_reserves WHERE month = '2026-01'
```

**"Which products had the most wastage?"**
```sql
SELECT p.name, SUM(sm.quantity_change) as lost_units
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
WHERE sm.movement_type = 'wastage'
GROUP BY p.id
ORDER BY lost_units DESC
```

**"Verify invoice ledger integrity:**
```sql
SELECT 
  il.sequence_number,
  il.hash,
  LAG(il.hash) OVER (ORDER BY sequence_number) as expected_previous,
  il.previous_hash as actual_previous,
  CASE WHEN LAG(il.hash) OVER (ORDER BY sequence_number) = il.previous_hash THEN 'VALID' ELSE 'BREACH' END as status
FROM invoice_ledger
ORDER BY sequence_number
```

---

## Conclusion

VeriCaja's database is **production-grade** because it:
1. **Tracks sales legally** - Every transaction is immutable and hash-verified
2. **Manages inventory accurately** - Stock movements audit every change
3. **Calculates taxes automatically** - Complies with Spanish regulations
4. **Provides financial visibility** - Dashboard can show real-time cash runway
5. **Prevents fraud** - Cryptographic ledger + hash chaining
6. **Maintains compliance** - Event logs prove system integrity to tax authority

Every table serves a purpose; nothing is redundant or unused.
