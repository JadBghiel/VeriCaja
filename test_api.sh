#!/bin/bash

# Test API endpoints to verify backend is working

echo "=========================================="
echo "Testing VeriCaja Backend API"
echo "=========================================="

API_URL="http://localhost:8000"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test each endpoint
echo -e "\n${YELLOW}Testing /api/sales/products...${NC}"
PRODUCTS=$(curl -s "$API_URL/api/sales/products")
if echo "$PRODUCTS" | grep -q "id"; then
    echo -e "${GREEN}✓ Products endpoint working${NC}"
    echo "$PRODUCTS" | python -m json.tool | head -15
else
    echo -e "${RED}✗ Products endpoint failed${NC}"
fi

echo -e "\n${YELLOW}Testing /inventory/...${NC}"
INVENTORY=$(curl -s "$API_URL/inventory/")
if echo "$INVENTORY" | grep -q "stock_quantity"; then
    echo -e "${GREEN}✓ Inventory endpoint working${NC}"
    echo "$INVENTORY" | python -m json.tool | head -15
else
    echo -e "${RED}✗ Inventory endpoint failed${NC}"
fi

echo -e "\n${YELLOW}Testing /dashboard/metrics...${NC}"
METRICS=$(curl -s "$API_URL/dashboard/metrics?cash_balance=5000")
if echo "$METRICS" | grep -q "survival_clock"; then
    echo -e "${GREEN}✓ Dashboard metrics endpoint working${NC}"
    echo "$METRICS" | python -m json.tool | head -15
else
    echo -e "${RED}✗ Dashboard metrics endpoint failed${NC}"
fi

echo -e "\n${YELLOW}Testing /dashboard/survival-clock...${NC}"
CLOCK=$(curl -s "$API_URL/dashboard/survival-clock?cash_balance=5000")
if echo "$CLOCK" | grep -q "runway_days"; then
    echo -e "${GREEN}✓ Survival clock endpoint working${NC}"
    echo "$CLOCK" | python -m json.tool
else
    echo -e "${RED}✗ Survival clock endpoint failed${NC}"
fi

echo -e "\n=========================================="
echo "API Tests Complete"
echo "=========================================="
