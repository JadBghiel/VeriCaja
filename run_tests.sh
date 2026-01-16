#!/bin/bash
# Test execution script for VeriCaja backend

cd "$(dirname "$0")/src/backend"

echo "═══════════════════════════════════════════════════════════"
echo "VeriCaja Backend Unit Tests"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Activate venv
source venv/bin/activate

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running Test Suite...${NC}"
echo ""

# Run all tests with coverage
python -m pytest tests/ \
  --tb=short \
  -v \
  --color=yes \
  -W ignore::DeprecationWarning \
  2>&1 | tee test_results.log

echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# Parse results
if grep -q "failed" test_results.log; then
  echo -e "${RED}❌ SOME TESTS FAILED${NC}"
  exit 1
else
  echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
  exit 0
fi
