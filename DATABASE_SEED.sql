-- VeriCaja PostgreSQL Initial Setup & Seed Data
-- Run this after database and tables are created

-- ==================== SEED DATA ====================

-- 1. INSERT PRESET PRODUCTS (POS catalog)
INSERT INTO products (name, description, price, category, cost_per_unit, stock_qty, is_active, created_at)
VALUES
  ('Espresso', 'Café espresso 30ml', 1.20, 'café', 0.25, 120, true, NOW()),
  ('Cortado', 'Café con leche pequeño', 1.40, 'café', 0.35, 120, true, NOW()),
  ('Café con Leche', 'Café con leche grande', 1.60, 'café', 0.40, 120, true, NOW()),
  ('Pan con Tomate', 'Pan tostado con tomate', 2.50, 'comida', 0.80, 80, true, NOW()),
  ('Croissant', 'Croissant de mantequilla', 1.80, 'comida', 0.60, 80, true, NOW()),
  ('Tostada Mixta', 'Jamón y queso tostados', 3.20, 'comida', 1.20, 80, true, NOW());

-- Verify insertion
SELECT id, name, price, cost_per_unit FROM products;

-- 2. STOCK MOVEMENTS (optional: log initial restock for traceability)
INSERT INTO stock_movements (product_id, quantity_change, movement_type, cost_impact, previous_stock, new_stock, timestamp)
SELECT id, stock_qty, 'seed_restock', stock_qty * cost_per_unit, 0, stock_qty, NOW() FROM products;

-- Verify
SELECT sm.id, p.name, sm.quantity_change, sm.movement_type, sm.previous_stock, sm.new_stock FROM stock_movements sm
JOIN products p ON sm.product_id = p.id;

-- 3. INSERT PRESET EXPENSES (monthly overhead)
INSERT INTO expenses (description, amount, category, date, month)
VALUES
  ('Alquiler Local', 1200.00, 'overhead', NOW(), '2026-01'),
  ('Electricidad', 150.00, 'overhead', NOW(), '2026-01'),
  ('Agua', 50.00, 'overhead', NOW(), '2026-01'),
  ('Internet', 40.00, 'overhead', NOW(), '2026-01'),
  ('Seguros', 200.00, 'overhead', NOW(), '2026-01'),
  ('Suministros Café', 400.00, 'supplies', NOW(), '2026-01'),
  ('Suministros Comida', 300.00, 'supplies', NOW(), '2026-01');

-- Verify total expenses
SELECT month, SUM(amount) as total_expenses FROM expenses GROUP BY month;

-- 4. INSERT TAX RESERVES
INSERT INTO tax_reserves (month, irpf_amount, iva_amount, iva_deductible, modelo_303_due, modelo_130_due, reserved_amount, last_updated)
VALUES
  ('2026-01', 620.00, 1302.00, 651.00, '2026-04-20', '2026-02-20', 1922.00, NOW());

-- ==================== TEST QUERIES ====================

-- Get all products with their stock
SELECT 
  p.id,
  p.name,
  p.price,
  p.cost_per_unit,
  COALESCE(si.current_quantity, 0) as stock,
  COALESCE(si.max_quantity, 0) as max_stock,
  ROUND((COALESCE(si.current_quantity, 0)::float / COALESCE(si.max_quantity, 1)) * 100, 0) as stock_percentage
FROM products p
LEFT JOIN stock_items si ON p.id = si.product_id
WHERE p.is_active = true
ORDER BY p.category, p.name;

-- Monthly financial summary
SELECT 
  COALESCE((SELECT SUM(amount) FROM income WHERE EXTRACT(MONTH FROM date) = 1 AND EXTRACT(YEAR FROM date) = 2026), 0) as income,
  COALESCE((SELECT SUM(amount) FROM expenses WHERE month = '2026-01'), 0) as expenses,
  COALESCE((SELECT SUM(amount) FROM income WHERE EXTRACT(MONTH FROM date) = 1 AND EXTRACT(YEAR FROM date) = 2026), 0)
  - 
  COALESCE((SELECT SUM(amount) FROM expenses WHERE month = '2026-01'), 0) as net_profit;

-- ==================== MONITORING QUERIES ====================

-- Check database size
SELECT 
  schemaname,
  SUM(pg_total_relation_size(schemaname||'.'||tablename)) / 1024 / 1024 as size_mb
FROM pg_tables
WHERE schemaname = 'public'
GROUP BY schemaname;

-- View all tables and row counts
SELECT 
  tablename,
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE table_name=tablename) as rows
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check for indexes
SELECT tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- ==================== MAINTENANCE ====================

-- Backup database
-- In terminal:
-- pg_dump -U vericaja_user vericaja > vericaja_backup_$(date +%Y%m%d).sql

-- Restore database
-- psql -U vericaja_user vericaja < vericaja_backup_20260115.sql

-- View current connections
SELECT pid, usename, application_name, state 
FROM pg_stat_activity 
WHERE datname = 'vericaja';

-- Analyze query performance
EXPLAIN ANALYZE
SELECT 
  o.order_number,
  o.total_amount,
  COUNT(oi.id) as items_count,
  STRING_AGG(p.name, ', ') as product_names
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
WHERE EXTRACT(MONTH FROM o.timestamp) = 1
GROUP BY o.id, o.order_number, o.total_amount
ORDER BY o.timestamp DESC;

-- ==================== VERIFACTU VERIFICATION ====================

-- Check cryptographic chain integrity
SELECT 
  sequence_number,
  invoice_number,
  SUBSTRING(hash, 1, 10) as hash_prefix,
  SUBSTRING(previous_hash, 1, 10) as prev_hash_prefix,
  LAG(hash) OVER (ORDER BY sequence_number) as expected_previous,
  previous_hash as actual_previous,
  CASE 
    WHEN sequence_number = 1 AND previous_hash = '0000000000000000000000000000000000000000000000000000000000000000' THEN '✓ FIRST'
    WHEN LAG(hash) OVER (ORDER BY sequence_number) = previous_hash THEN '✓ VALID'
    ELSE '✗ BREACH'
  END as verification
FROM invoice_ledger
ORDER BY sequence_number;

-- Export invoices for tax report
SELECT 
  sequence_number,
  invoice_number,
  amount,
  timestamp::date as date,
  EXTRACT(MONTH FROM timestamp) as month,
  EXTRACT(QUARTER FROM timestamp) as quarter,
  is_verified,
  verification_hash_check
FROM invoice_ledger
WHERE EXTRACT(YEAR FROM timestamp) = 2026
ORDER BY sequence_number;

-- ==================== SAMPLE MANUAL TEST ====================
/*
1. Test POS Order Creation (manual insert for testing):

INSERT INTO orders (order_number, total_amount, items_count, hash, qr_code_content, is_verified, payment_method, timestamp)
VALUES (
  '2026-01-15-000001',
  4.20,
  3,
  'a3f2c8d9e1b5c7f0a2d4e6f8b0c2d4e6',
  'https://www.aeat.es/wlcl/A47111985Q/2026-01-15-000001/20260115/420/a3f2c8d9',
  true,
  'cash',
  NOW()
);

2. Add Order Items:

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal, product_name)
VALUES
  (1, 1, 2, 1.20, 2.40, 'Espresso'),
  (1, 2, 1, 1.80, 1.80, 'Pan con Tomate');

3. Record Income:

INSERT INTO income (order_id, amount, source, date)
VALUES (1, 4.20, 'sales', NOW());

4. Create Invoice Ledger Entry:

INSERT INTO invoice_ledger (sequence_number, order_id, invoice_number, hash, previous_hash, amount, is_verified, verification_hash_check, timestamp)
VALUES (
  1,
  1,
  '2026-01-15-000001',
  'a3f2c8d9e1b5c7f0a2d4e6f8b0c2d4e6',
  '0000000000000000000000000000000000000000000000000000000000000000',
  4.20,
  true,
  true,
  NOW()
);

5. Verify:

SELECT * FROM orders WHERE id = 1;
SELECT * FROM order_items WHERE order_id = 1;
SELECT * FROM income WHERE order_id = 1;
SELECT * FROM invoice_ledger WHERE order_id = 1;
*/

-- ==================== CLEANUP (if needed) ====================

-- DELETE FROM income;
-- DELETE FROM expense;
-- DELETE FROM orders;
-- DELETE FROM invoice_ledger;
-- DELETE FROM system_event_logs;
-- DELETE FROM stock_items;
-- DELETE FROM products;

-- Reset sequences (if you delete all data):
-- ALTER SEQUENCE products_id_seq RESTART WITH 1;
-- ALTER SEQUENCE orders_id_seq RESTART WITH 1;
-- ALTER SEQUENCE order_items_id_seq RESTART WITH 1;
-- ALTER SEQUENCE invoice_ledger_id_seq RESTART WITH 1;
