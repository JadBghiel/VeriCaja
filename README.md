<div align="center">
  <img src="documentation (day 1,2)/VeriCaja Full Logo Name.png" alt="VeriCaja Logo" width="600">
</div>

# VeriCaja - Audit Proof Financial Engine for Spanish Autónomos

**Immutable Ledger for Spanish SMBs**

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [Getting Started](#getting-started)
3. [Market Fit & Use Cases](#market-fit--use-cases)
4. [Key Features](#key-features)
5. [Technical Explanation](#technical-explanation)
6. [Project Structure](#project-structure)

---

## Product Overview

**VeriCaja** is a real time financial management platform designed specifically for Spanish self-employed professionals (autónomos). It automates financial tracking while implementing Spain's strict tax compliance standard **Royal Decree 1007/2023 (Verifactu)**  removing the burden of manual compliance from entrepreneurs.

### The Problem VeriCaja Solves

Spanish autónomos face a daily struggle:

- 📋 **Manual bookkeeping**: Hours spent recording transactions in spreadsheets
- 🚨 **Tax compliance complexity**: Understanding Verifactu requirements without specialist help
- 😰 **Cash flow anxiety**: No visibility into "how long until we run out of money?"
- 📊 **No real-time insights**: Historical data gathering instead of actionable intelligence
- 🔒 **Audit vulnerability**: Paper trails that don't withstand tax authority scrutiny

### The VeriCaja Solution

One integrated platform that:
- ✅ **Automatically records sales** with cryptographic proof (QR codes)
- ✅ **Generates audit-proof invoices** compliant with AEAT (Spanish tax authority)
- ✅ **Calculates cash runway** in real-time (days until cash depletes)
- ✅ **Logs expenses** with categorization
- ✅ **Provides one-click data export** for accountants
- ✅ **Creates immutable ledger** that resists fraud and audits

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 16+
- npm or yarn

### Quick Start

**1. Launch the entire project**:
```bash
cd /home/jadbghiel/EPITECH/YEAR\ 2/TEK_2_POOL/PROJECT_WEEK
bash run.sh
```

This script will:
- Install backend dependencies
- Install frontend dependencies
- Start the backend (FastAPI on port 8000)
- Start the frontend (Vite on port 5173)

**2. Access the application**:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs (Swagger UI)

### Manual Start (if run.sh doesn't work)

**Backend**:
```bash
cd src/backend
pip install -r requirements.txt
python seed_db.py              # Populate mock data
uvicorn main:app --reload     # Start server
```

**Frontend** (in another terminal):
```bash
cd src/frontend
npm install
npm run dev
```

### Test the POS Flow

1. Navigate to **"Punto de Venta"** tab
2. Click on products (Espresso, Cappuccino, etc.)
3. Click **"Verificar & Cerrar Venta"**
4. Observe:
   - Success overlay appears
   - QR code displays
   - File saved to `qr_codes/QR_2026-01-16-XXXXXX.png`
5. Check **Dashboard** → metrics update with new income
6. Download database: Click **"Exportar Informe"** button

---

## Managing the Database

### Insert, View & Delete Data Manually

You can add, view, or remove financial data directly from the database. Here's how:

#### Example 1: INSERT Income (Ingresos)

**Method 1: Direct Terminal Command**
```bash
cd /home/jadbghiel/EPITECH/my projects/veriCaja/src/backend
sqlite3 vericaja.db "INSERT INTO income (order_id, amount, source, date) VALUES (1, 150.50, 'sales', '2026-03-05 14:30:00');"
```

**Method 2: Interactive SQLite Shell**
```bash
cd /home/jadbghiel/EPITECH/my projects/veriCaja/src/backend
sqlite3 vericaja.db
```
Then type:
```sql
INSERT INTO income (order_id, amount, source, date) 
VALUES (1, 150.50, 'sales', '2026-03-05 14:30:00');
```
Press Enter, then type `.quit` to exit.

---

#### Example 2: INSERT Expense (Gastos)

**Method 1: Direct Terminal Command**
```bash
sqlite3 vericaja.db "INSERT INTO expenses (description, amount, category, date, month) VALUES ('Monthly Rent', 1200.00, 'Rent', '2026-03-01', '2026-03');"
```

**Method 2: Interactive SQLite Shell**
```bash
sqlite3 vericaja.db
```
Then type:
```sql
INSERT INTO expenses (description, amount, category, date, month) 
VALUES ('Monthly Rent', 1200.00, 'Rent', '2026-03-01', '2026-03');
```

---

#### Example 3: VIEW Income Data

**Method 1: Direct Terminal Command**
```bash
# View all income
sqlite3 vericaja.db "SELECT id, amount, source, date FROM income;"

# View income from March 2026 only
sqlite3 vericaja.db "SELECT amount, source, date FROM income WHERE date LIKE '2026-03%';"

# View total income sum
sqlite3 vericaja.db "SELECT SUM(amount) as total_income FROM income WHERE date LIKE '2026-03%';"
```

**Method 2: Interactive SQLite Shell**
```bash
sqlite3 vericaja.db
```
Then type:
```sql
-- View all income records
SELECT id, amount, source, date FROM income;

-- View income from March 2026
SELECT amount, source, date FROM income WHERE date LIKE '2026-03%';

-- View total income with formatting
SELECT SUM(amount) as total_income FROM income WHERE date LIKE '2026-03%';
```

---

#### Example 4: VIEW Expense Data

**Method 1: Direct Terminal Command**
```bash
# View all expenses
sqlite3 vericaja.db "SELECT id, description, amount, category, date FROM expenses;"

# View expenses from March 2026 only
sqlite3 vericaja.db "SELECT description, amount, category, date FROM expenses WHERE month = '2026-03';"

# View total expenses sum
sqlite3 vericaja.db "SELECT SUM(amount) as total_expenses FROM expenses WHERE month = '2026-03';"
```

**Method 2: Interactive SQLite Shell**
```bash
sqlite3 vericaja.db
```
Then type:
```sql
-- View all expense records
SELECT id, description, amount, category, date FROM expenses;

-- View expenses from March 2026
SELECT description, amount, category, date FROM expenses WHERE month = '2026-03';

-- View total expenses with formatting
SELECT SUM(amount) as total_expenses FROM expenses WHERE month = '2026-03';
```

---

#### Example 5: DELETE Income Record

**Method 1: Direct Terminal Command**
```bash
# Delete specific income record (ID = 5)
sqlite3 vericaja.db "DELETE FROM income WHERE id = 5;"

# Delete all income from a specific date
sqlite3 vericaja.db "DELETE FROM income WHERE date LIKE '2026-03-05%';"
```

**Method 2: Interactive SQLite Shell**
```bash
sqlite3 vericaja.db
```
Then type:
```sql
-- Delete specific income record by ID
DELETE FROM income WHERE id = 5;

-- Delete all income from a specific date
DELETE FROM income WHERE date LIKE '2026-03-05%';
```

---

#### Example 6: DELETE Expense Record

**Method 1: Direct Terminal Command**
```bash
# Delete specific expense record (ID = 3)
sqlite3 vericaja.db "DELETE FROM expenses WHERE id = 3;"

# Delete all expenses from March 2026
sqlite3 vericaja.db "DELETE FROM expenses WHERE month = '2026-03';"
```

**Method 2: Interactive SQLite Shell**
```bash
sqlite3 vericaja.db
```
Then type:
```sql
-- Delete specific expense record by ID
DELETE FROM expenses WHERE id = 3;

-- Delete all expenses from March 2026
DELETE FROM expenses WHERE month = '2026-03';
```

---

### Common Database Operations

**Find a valid order_id for income:**
```bash
sqlite3 vericaja.db "SELECT id, order_number FROM orders LIMIT 5;"
```

**Check what's in your database:**
```bash
sqlite3 vericaja.db "SELECT COUNT(*) as products FROM products; SELECT COUNT(*) as orders FROM orders; SELECT COUNT(*) as incomes FROM income; SELECT COUNT(*) as expenses FROM expenses;"
```

**Backup your database:**
```bash
cp /home/jadbghiel/EPITECH/my projects/veriCaja/src/backend/vericaja.db /home/jadbghiel/EPITECH/my projects/veriCaja/src/backend/vericaja.db.backup
```

**Reset database with fresh seed data:**
```bash
cd /home/jadbghiel/EPITECH/my projects/veriCaja/src/backend
rm -f vericaja.db
python -c "from seed_db import seed_database; seed_database()"
```

---

## Market Fit & Use Cases

### Who Is VeriCaja For?

**Primary Target: Spanish Autónomos (Self-Employed)**

1. **Café/Bar Owners** (Primary Use Case)
   - Dozens of small sales per day
   - Inventory management (coffee, pastries, drinks)
   - Need to track cash flow for payroll
   - Must comply with AEAT QR code requirements
   - **VeriCaja Benefit**: Every POS sale instantly logged with tax-compliant QR code; no end-of-day reconciliation

2. **Freelancers & Consultants**
   - Multiple invoices per month
   - Expense tracking (office, software, equipment)
   - Variable income streams
   - **VeriCaja Benefit**: Automated invoice generation; survival clock shows if income covers lifestyle

3. **Retail Shop Owners**
   - Inventory needs tracking
   - Staff to pay
   - Recurring expenses (rent, utilities)
   - **VeriCaja Benefit**: Stock wastage tracking; overhead cost visibility; cash runway forecasting

4. **Service Providers** (Electricians, Plumbers, Consultants)
   - Irregular income patterns
   - Mixed payment methods (cash, transfers, cards)
   - Need to track jobs & expenses
   - **VeriCaja Benefit**: Per-project expense logging; financial health dashboard

### Use Case: Morning at María's Café (VeriCaja in Action)

**9:00 AM**: María arrives at her café in Barcelona.
- Dashboard shows: **"68 days of runway at current burn rate" 🟢 Healthy**
- Yesterday: €450 in sales, €120 in expenses
- This month's rent due in 2 weeks: €1,200

**10:30 AM**: First customer orders Espresso (€2.50) + Croissant (€2.80) = €5.30
- María taps products on POS
- Clicks "Verificar & Cerrar Venta"
- **✅ VeriCaja generates**:
  - Order number: `2026-01-16-000001`
  - Cryptographic hash: `a3c4d8e2f7b1...` (immutable proof)
  - AEAT-compliant QR code
  - Displays on screen: "¡Venta Verificada!"
- **Result**: Customer gets receipt with QR code; María's bank has been updated; tax authority has proof

**12:30 PM**: 25 more sales, all recorded automatically with QR codes

**6:00 PM**: End of day
- Dashboard updated: **€380 revenue today** (43 transactions)
- Expenses logged: €45 (supplies)
- Running survival clock: **69 days** (slightly better due to good sales)
- **0 minutes of bookkeeping needed**

**Monthly**: Accountant needs documentation
- María exports database: Click "Exportar Informe"
- Entire month's transactions (with AEAT-compliant data)
- Delivered to accountant in 5 seconds
- Accountant submits tax return with zero questions

### Market Opportunity

**Spain's Autónomo Market**:
- ~3.3 million self-employed professionals
- 89% report "tax compliance stress" (2024 survey)
- Average 4-5 hours/week on financial admin
- Most use outdated tools (Excel, paper, expensive accounting software)
- **TAM (Total Addressable Market)**: €1.2B/year if even 5% of autónomos adopt at €200/year

**VeriCaja Competitive Advantages**:
1. **Purpose-built** for Spanish regulations (Verifactu/AEAT)
2. **No subscription lock-in** - data export always available
3. **Real-time analytics** - not historical reporting
4. **Zero-configuration** - works out of the box
5. **Regulatory-first** - compliance is the feature, not an afterthought

---

## Key Features

### 🔒 Cryptographic Hash Chaining (Verifactu Compliant)
Every transaction creates an immutable record:
- SHA-256 cryptographic hash for each invoice
- Previous invoice hash stored (creates chain)
- Impossible to alter past records without breaking chain
- Audit trail with timestamp and witness

### 📊 Real-Time Survival Clock
Never wonder "how long until I can't pay rent?":
- Automatic calculation of daily burn rate
- Cash runway forecast (days of operations remaining)
- Color-coded status: 🟢 Healthy | 🟡 Warning | 🔴 Critical
- Estimated date when cash depletes

### 📱 Integrated POS System
Sales made simple:
- Multi-product ordering interface
- Real-time total calculation
- AEAT-compliant QR codes generated instantly
- Works offline (syncs when reconnected)

### 📈 Live Dashboard
Business health at a glance:
- Revenue vs Expenses (time-series chart)
- Net profit calculation
- Total income/expenses cards
- Expense logging with modal dialog

### 💾 One-Click Export
Perfect for accountants:
- Download entire database as SQLite file
- Compatible with accounting software
- Complete transaction history
- AEAT-compliant format

### 📦 Inventory Management
Track stock & waste:
- Product catalog with pricing
- Stock quantity tracking
- Cost per unit (profit margin calculation)
- Automatic updates when POS sales occur
- Wastage tracking

---

## Technical Explanation

### Architecture Overview

VeriCaja uses a modern full-stack architecture:

```
┌─────────────────────────────────────┐
│   Frontend (React + TypeScript)     │
│   http://localhost:5173              │
│   • Vite bundler                    │
│   • Tailwind CSS + shadcn/ui         │
│   • Recharts for visualizations      │
└────────────┬────────────────────────┘
             │ REST API / JSON
             ▼
┌─────────────────────────────────────┐
│   Backend (FastAPI)                 │
│   http://localhost:8000              │
│   • Python 3.10+                    │
│   • SQLModel ORM                    │
│   • Uvicorn ASGI server             │
└────────────┬────────────────────────┘
             │ SQL Queries
             ▼
┌─────────────────────────────────────┐
│   SQLite Database                   │
│   vericaja.db (file-based)          │
│   • 10+ tables                      │
│   • ACID-compliant transactions     │
│   • No server setup needed          │
└─────────────────────────────────────┘
```

### Data Flow: POS Sale Example

When a customer purchases items:

```
1. User adds products in POS interface
   └─ Frontend state: [{ product_id: 1, quantity: 2 }, ...]

2. User clicks "Verificar & Cerrar Venta"
   └─ POST /api/sales/execute with items array

3. Backend validates products exist and are in stock

4. Calculate total amount
   └─ €2.50 (Espresso) × 2 + €3.50 (Cappuccino) × 1 = €8.50

5. Generate order number
   └─ Format: YYYY-MM-DD-XXXXXX
   └─ Example: 2026-01-16-000001

6. Fetch previous order's hash (for chain of custody)

7. Generate cryptographic hash
   └─ SHA256(order_number + timestamp + amount + previous_hash)
   └─ Result: e3b0c44298fc1c14... (immutable fingerprint)

8. Generate AEAT-compliant QR code
   └─ URL format: https://www2.agenciatributaria.gob.es/...?nif=...
   └─ Encode into QR image (PNG)
   └─ Save to disk: qr_codes/QR_2026-01-16-000001.png

9. Create records in database (ATOMIC TRANSACTION)
   ├─ INSERT INTO orders (order_number, hash, qr_code_image, ...)
   ├─ INSERT INTO order_items (order_id, product_id, quantity, ...)
   └─ INSERT INTO income (order_id, amount, source='POS')

10. Update inventory
    └─ UPDATE products SET stock_qty = stock_qty - quantity

11. Return response with QR code to frontend
    └─ { order_number: "2026-01-16-000001", qr_code_image: "data:image/png;base64,..." }

12. Frontend displays QR code in success overlay
    └─ Shows "¡Venta Verificada! Hash Verifactu generado"
```

### Core Features Implementation

#### 1. Database Integration

**Why SQLite?**
- Zero setup (file-based database)
- Perfect for development and small-to-medium businesses
- ACID-compliant (transaction safety guaranteed)
- Single `vericaja.db` file (easy backup)
- No server required (unlike PostgreSQL)

**Key Tables**:
- `orders` - POS sales with hash & QR codes
- `order_items` - Items within each order
- `income` - Revenue tracking
- `expenses` - Cost tracking by category
- `overhead_costs` - Fixed monthly costs (rent, insurance)
- `salaries` - Payroll
- `products` - POS catalog

#### 2. Cryptographic Hash Chaining

Each invoice creates an unbreakable chain:

```
Order 1: hash = SHA256("2026-01-16-000001" + €50 + "")
         Result: a3c4d8e2f...

Order 2: hash = SHA256("2026-01-16-000002" + €75 + "a3c4d8e2f...")
         Result: b5e7f1a9c...
         (includes previous hash)

Order 3: hash = SHA256("2026-01-16-000003" + €30 + "b5e7f1a9c...")
         Result: c9f2b4d1e...
         (chain continues)

Result: Unbroken chain = Audit trail = Fraud detection
```

**Benefits**:
- ✅ Immutable: Once hash generated, order cannot be modified
- ✅ Auditable: Previous hash creates chain of custody
- ✅ Compliant: Meets AEAT Verifactu requirements
- ✅ Forensic: Any tampering breaks the chain visibly

#### 3. Survival Clock Analytics

Calculates days of cash runway  how long until cash depletes:

```
Formula:
  Daily Burn Rate = (Total Monthly Expenses) / 30 days
  Runway Days = Current Cash Balance / Daily Burn Rate

Example:
  Monthly Expenses: €2,000
    ├─ Rent: €1,200
    ├─ Insurance: €300
    └─ Misc: €500
  Daily Burn: €2,000 / 30 = €66.67/day
  Current Cash: €5,000
  Runway: €5,000 / €66.67 = 75 days

Status Logic:
  🟢 Healthy: > 30 days runway
  🟡 Warning: 14-30 days runway
  🔴 Critical: < 14 days runway
```

#### 4. QR Code Generation (AEAT Verifactu)

Spanish tax authority compliance:

```
AEAT-Required QR Format:
  https://www2.agenciatributaria.gob.es/wlpl/...?
    nif=A47111985Q          (Business tax ID)
    &numSerie=2026-01-16-000001  (Invoice number)
    &fecha=16-01-2026       (Date)
    &importe=8.50           (Total amount)

Process:
  1. Build compliant URL
  2. Encode as QR code image (PNG)
  3. Convert to Base64
  4. Save to filesystem for archival
  5. Send to frontend for display
```

#### 5. Real-Time Dashboard

Displays business metrics from live database:

- **Survival Clock**: Days of runway + estimated depletion date
- **Revenue Chart**: Income vs expenses over time (Recharts AreaChart)
- **Key Metrics**: Total income, expenses, net profit
- **Expense Logger**: Modal dialog to record costs with categories
- **Database Export**: Download entire vericaja.db file

#### 6. Mock Data Seeding

`seed_db.py` populates realistic test data:

- **50 sample orders** (sales with hash chains)
- **20 expenses** (categorized: utilities, rent, supplies, marketing)
- **4 overhead costs** (monthly rent, software, insurance)
- **2 salary entries** (owner + employee)
- **7 POS products** (Espresso, Cappuccino, Latte, etc.)

### Technology Stack

**Backend**:
- FastAPI 0.104.1 - Modern async Python framework
- SQLModel 0.0.14 - SQL + Python dataclasses
- SQLite 3 - File-based ACID database
- Uvicorn - ASGI application server
- qrcode + Pillow - QR code generation
- hashlib - SHA-256 cryptography

**Frontend**:
- React 18 + TypeScript - UI framework
- Vite - Lightning-fast bundler
- Tailwind CSS - Utility-first styling
- shadcn/ui - Headless component library
- Recharts - React charting library
- Lucide React - Icon library

**DevOps**:
- pip (Python package manager)
- npm (Node package manager)
- Git version control

### API Endpoints

**POS / Sales**:
- `POST /api/sales/execute` - Create sale with QR code & hash

**Dashboard**:
- `GET /dashboard/metrics` - All metrics (survival clock, totals)
- `GET /dashboard/revenue-expenses` - Time-series data for chart
- `POST /dashboard/expenses` - Create expense record
- `GET /dashboard/expenses` - List all expenses
- `GET /dashboard/export-database` - Download vericaja.db

**Compliance**:
- `GET /compliance/nif/{nif}` - Validate Spanish tax ID

**Inventory**:
- `GET /inventory/wastage` - Track stock waste

### Database Schema (Key Tables)

```sql
-- POS Sales
CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    order_number VARCHAR UNIQUE,    -- 2026-01-16-000001
    total_amount FLOAT,             -- €8.50
    hash VARCHAR,                   -- SHA256 fingerprint
    previous_hash VARCHAR,          -- For chaining
    qr_code_content VARCHAR,        -- AEAT URL
    qr_code_image VARCHAR,          -- Base64 PNG
    qr_code_file_path VARCHAR,      -- Saved file path
    timestamp DATETIME,
    is_verified BOOLEAN
);

-- Revenue Tracking
CREATE TABLE income (
    id INTEGER PRIMARY KEY,
    order_id INT FOREIGN KEY,
    amount FLOAT,
    source VARCHAR,                 -- "POS", "invoice", etc
    description VARCHAR,
    created_at DATETIME
);

-- Expense Tracking
CREATE TABLE expenses (
    id INTEGER PRIMARY KEY,
    description VARCHAR,
    amount FLOAT,
    category VARCHAR,               -- "rent", "utilities", etc
    created_at DATETIME
);

-- POS Products
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name VARCHAR,                   -- "Espresso"
    price FLOAT,                    -- €2.50
    cost_per_unit FLOAT,            -- €0.30
    stock_qty INT,
    is_active BOOLEAN,
    created_at DATETIME
);
```

---

## Project Structure

```
PROJECT_WEEK/
├── src/
│   ├── backend/
│   │   ├── main.py                    # FastAPI app entry point
│   │   ├── models.py                  # SQLModel ORM definitions
│   │   ├── database.py                # SQLite connection & setup
│   │   ├── schemas.py                 # API request/response schemas
│   │   ├── analytics.py               # Survival clock calculations
│   │   ├── compliance.py              # AEAT/QR code logic
│   │   ├── qr_generator.py            # QR code generation
│   │   ├── seed_db.py                 # Mock data population
│   │   ├── requirements.txt           # Python dependencies
│   │   ├── README.md                  # Backend documentation
│   │   ├── vericaja.db                # SQLite database (auto-created)
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── pos.py                 # POST /api/sales/execute
│   │   │   ├── dashboard.py           # GET /dashboard/metrics
│   │   │   ├── inventory.py           # GET /inventory/wastage
│   │   │   └── compliance.py          # GET /compliance/nif/{nif}
│   │   ├── tests/
│   │   │   ├── conftest.py
│   │   │   ├── test_analytics.py
│   │   │   ├── test_compliance.py
│   │   │   ├── test_expenses.py
│   │   │   ├── test_inventory.py
│   │   │   └── test_qr_generator.py
│   │   └── qr_codes/                  # Generated QR PNG files (not tracked)
│   │
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── main.tsx               # React entry point
│   │   │   ├── vite-env.d.ts          # Vite environment types
│   │   │   ├── app/
│   │   │   │   ├── App.tsx            # Main app container
│   │   │   │   └── components/
│   │   │   │       ├── Header.tsx
│   │   │   │       ├── POSView.tsx
│   │   │   │       ├── DashboardView.tsx
│   │   │   │       ├── SurvivalClockView.tsx
│   │   │   │       ├── RevenueChart.tsx
│   │   │   │       ├── StockWastageView.tsx
│   │   │   │       ├── AuditDefenseView.tsx
│   │   │   │       ├── MetricsCard.tsx
│   │   │   │       ├── QuickActions.tsx
│   │   │   │       ├── InvoicesWidget.tsx
│   │   │   │       ├── TaxWidget.tsx
│   │   │   │       ├── TransactionsList.tsx
│   │   │   │       └── ui/            # shadcn/ui components
│   │   │   ├── services/
│   │   │   │   └── api.ts             # Backend API client
│   │   │   ├── hooks/
│   │   │   │   └── useApi.ts          # API hook utilities
│   │   │   ├── utils/
│   │   │   │   └── toast.ts           # Toast notifications
│   │   │   └── styles/
│   │   │       ├── index.css
│   │   │       ├── tailwind.css
│   │   │       ├── theme.css
│   │   │       └── fonts.css
│   │   ├── index.html                 # HTML entry point
│   │   ├── package.json               # npm dependencies
│   │   ├── vite.config.ts             # Vite bundler config
│   │   ├── tsconfig.json              # TypeScript config
│   │   ├── tsconfig.node.json         # TypeScript config for Vite
│   │   └── postcss.config.mjs         # PostCSS (Tailwind) config
│   │
│   └── README.md                      # Source docs
│
├── run.sh                             # Quick start script
├── TECHNICAL_IMPLEMENTATION.md        # Detailed technical docs
└── README.md                          # This file
```

### Key Directories Explained

| Directory | Purpose |
|-----------|---------|
| **src/backend/** | FastAPI server with SQLModel ORM, database, and all API endpoints |
| **routers/** | Modular API endpoints (POS, Dashboard, Compliance, Inventory) |
| **tests/** | Backend unit and integration tests |
| **qr_codes/** | Generated AEAT-compliant QR code PNG files (not version controlled) |
| **src/frontend/** | React + TypeScript UI application with Vite bundler |
| **components/** | Reusable React components (POS, Dashboard, Charts, etc.) |
| **services/** | API client for communicating with backend |
| **styles/** | Global CSS and Tailwind configuration |
| **vericaja.db** | SQLite database file (auto-created on first run, not tracked) |

---
## Future Roadmap

- 🔐 User authentication & multi-tenant support
- 🌍 Real AEAT integration (direct tax submission)
- 📱 Mobile app (React Native for POS on-the-go)
- 📊 Advanced analytics & forecasting
- 💬 Email receipts & customer notifications
- 🔄 Integration with accounting software
- 📈 Tax return document generation
- 🛠️ Multi-user team collaboration

---