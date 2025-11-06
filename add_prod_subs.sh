#!/bin/bash

# PayPal Credentials
CLIENT_ID="AZr-Bx10da1dDvaGzIEU9-Gw6oA2pHo0vYzV0h2rIiooqtcQ816_5L21SMSr7erEDagHyH7s32F782-v"
CLIENT_SC="EKndywQiLkAfiMdhBDyFCKIm6hbAD3vK14NUfiVedloq_4Re16K7exujMr46xO8aRpxDuPlNvYiLVEVH"

# Sandbox or Production
MODE="live"
BASE_URL="https://api-m.paypal.com"

if [ "$MODE" = "sandbox" ]; then
  BASE_URL="https://api-m.sandbox.paypal.com"
fi

echo "=========================================="
echo "PayPal Subscription Plan Creator"
echo "Mode: $MODE"
echo "Base URL: $BASE_URL"
echo "=========================================="
echo ""

# Step 1: Get Access Token
echo "Step 1: Getting Access Token..."
TOKEN=$(curl -s -X POST ${BASE_URL}/v1/oauth2/token \
  -H "Accept: application/json" \
  -H "Accept-Language: en_US" \
  -u "$CLIENT_ID:$CLIENT_SC" \
  -d "grant_type=client_credentials" | jq -r '.access_token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "ERROR: Failed to get access token"
  exit 1
fi

echo "✓ Access Token obtained"
echo ""

# Step 2: Create Product
echo "Step 2: Creating Product..."
PRODUCT_ID=$(curl -s -X POST ${BASE_URL}/v1/catalogs/products \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gnosis Subscription",
    "description": "AI-powered startup idea validation service",
    "type": "SERVICE"
  }' | jq -r '.id')

if [ -z "$PRODUCT_ID" ] || [ "$PRODUCT_ID" = "null" ]; then
  echo "ERROR: Failed to create product"
  exit 1
fi

echo "✓ Product ID: $PRODUCT_ID"
echo ""

# Step 3: Create Subscription Plans
echo "Step 3: Creating Subscription Plans..."
echo ""

# BASIC Monthly Plan ($19/month)
echo "Creating BASIC Monthly Plan ($19/month)..."
BASIC_MONTHLY_PLAN=$(curl -s -X POST ${BASE_URL}/v1/billing/plans \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"product_id\": \"$PRODUCT_ID\",
    \"name\": \"Basic Monthly Plan\",
    \"description\": \"Recurring monthly subscription\",
    \"billing_cycles\": [{
      \"frequency\": {\"interval_unit\": \"MONTH\", \"interval_count\": 1},
      \"tenure_type\": \"REGULAR\",
      \"sequence\": 1,
      \"total_cycles\": 0,
      \"pricing_scheme\": {
        \"fixed_price\": {\"value\": \"19.00\", \"currency_code\": \"USD\"}
      }
    }],
    \"payment_preferences\": {
      \"auto_bill_outstanding\": true,
      \"setup_fee_failure_action\": \"CONTINUE\",
      \"payment_failure_threshold\": 3
    },
    \"taxes\": {\"percentage\": \"0\", \"inclusive\": false}
  }")

BASIC_MONTHLY_PLAN_ID=$(echo "$BASIC_MONTHLY_PLAN" | jq -r '.id')
if [ -n "$BASIC_MONTHLY_PLAN_ID" ] && [ "$BASIC_MONTHLY_PLAN_ID" != "null" ]; then
  echo "✓ BASIC Monthly Plan ID: $BASIC_MONTHLY_PLAN_ID"
else
  echo "✗ Failed to create BASIC Monthly Plan"
  echo "$BASIC_MONTHLY_PLAN" | jq '.'
fi
echo ""

# BASIC Yearly Plan ($190/year)
echo "Creating BASIC Yearly Plan ($190/year)..."
BASIC_YEARLY_PLAN=$(curl -s -X POST ${BASE_URL}/v1/billing/plans \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"product_id\": \"$PRODUCT_ID\",
    \"name\": \"Basic Yearly Plan\",
    \"description\": \"Recurring yearly subscription\",
    \"billing_cycles\": [{
      \"frequency\": {\"interval_unit\": \"YEAR\", \"interval_count\": 1},
      \"tenure_type\": \"REGULAR\",
      \"sequence\": 1,
      \"total_cycles\": 0,
      \"pricing_scheme\": {
        \"fixed_price\": {\"value\": \"190.00\", \"currency_code\": \"USD\"}
      }
    }],
    \"payment_preferences\": {
      \"auto_bill_outstanding\": true,
      \"setup_fee_failure_action\": \"CONTINUE\",
      \"payment_failure_threshold\": 3
    },
    \"taxes\": {\"percentage\": \"0\", \"inclusive\": false}
  }")

BASIC_YEARLY_PLAN_ID=$(echo "$BASIC_YEARLY_PLAN" | jq -r '.id')
if [ -n "$BASIC_YEARLY_PLAN_ID" ] && [ "$BASIC_YEARLY_PLAN_ID" != "null" ]; then
  echo "✓ BASIC Yearly Plan ID: $BASIC_YEARLY_PLAN_ID"
else
  echo "✗ Failed to create BASIC Yearly Plan"
  echo "$BASIC_YEARLY_PLAN" | jq '.'
fi
echo ""

# PRO Monthly Plan ($49/month)
echo "Creating PRO Monthly Plan ($49/month)..."
PRO_MONTHLY_PLAN=$(curl -s -X POST ${BASE_URL}/v1/billing/plans \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"product_id\": \"$PRODUCT_ID\",
    \"name\": \"Pro Monthly Plan\",
    \"description\": \"Recurring monthly subscription\",
    \"billing_cycles\": [{
      \"frequency\": {\"interval_unit\": \"MONTH\", \"interval_count\": 1},
      \"tenure_type\": \"REGULAR\",
      \"sequence\": 1,
      \"total_cycles\": 0,
      \"pricing_scheme\": {
        \"fixed_price\": {\"value\": \"49.00\", \"currency_code\": \"USD\"}
      }
    }],
    \"payment_preferences\": {
      \"auto_bill_outstanding\": true,
      \"setup_fee_failure_action\": \"CONTINUE\",
      \"payment_failure_threshold\": 3
    },
    \"taxes\": {\"percentage\": \"0\", \"inclusive\": false}
  }")

PRO_MONTHLY_PLAN_ID=$(echo "$PRO_MONTHLY_PLAN" | jq -r '.id')
if [ -n "$PRO_MONTHLY_PLAN_ID" ] && [ "$PRO_MONTHLY_PLAN_ID" != "null" ]; then
  echo "✓ PRO Monthly Plan ID: $PRO_MONTHLY_PLAN_ID"
else
  echo "✗ Failed to create PRO Monthly Plan"
  echo "$PRO_MONTHLY_PLAN" | jq '.'
fi
echo ""

# PRO Yearly Plan ($490/year)
echo "Creating PRO Yearly Plan ($490/year)..."
PRO_YEARLY_PLAN=$(curl -s -X POST ${BASE_URL}/v1/billing/plans \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"product_id\": \"$PRODUCT_ID\",
    \"name\": \"Pro Yearly Plan\",
    \"description\": \"Recurring yearly subscription\",
    \"billing_cycles\": [{
      \"frequency\": {\"interval_unit\": \"YEAR\", \"interval_count\": 1},
      \"tenure_type\": \"REGULAR\",
      \"sequence\": 1,
      \"total_cycles\": 0,
      \"pricing_scheme\": {
        \"fixed_price\": {\"value\": \"490.00\", \"currency_code\": \"USD\"}
      }
    }],
    \"payment_preferences\": {
      \"auto_bill_outstanding\": true,
      \"setup_fee_failure_action\": \"CONTINUE\",
      \"payment_failure_threshold\": 3
    },
    \"taxes\": {\"percentage\": \"0\", \"inclusive\": false}
  }")

PRO_YEARLY_PLAN_ID=$(echo "$PRO_YEARLY_PLAN" | jq -r '.id')
if [ -n "$PRO_YEARLY_PLAN_ID" ] && [ "$PRO_YEARLY_PLAN_ID" != "null" ]; then
  echo "✓ PRO Yearly Plan ID: $PRO_YEARLY_PLAN_ID"
else
  echo "✗ Failed to create PRO Yearly Plan"
  echo "$PRO_YEARLY_PLAN" | jq '.'
fi
echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="
echo "Product ID: $PRODUCT_ID"
echo ""
echo "Plan IDs:"
[ -n "$BASIC_MONTHLY_PLAN_ID" ] && [ "$BASIC_MONTHLY_PLAN_ID" != "null" ] && echo "  BASIC Monthly:  $BASIC_MONTHLY_PLAN_ID"
[ -n "$BASIC_YEARLY_PLAN_ID" ] && [ "$BASIC_YEARLY_PLAN_ID" != "null" ] && echo "  BASIC Yearly:   $BASIC_YEARLY_PLAN_ID"
[ -n "$PRO_MONTHLY_PLAN_ID" ] && [ "$PRO_MONTHLY_PLAN_ID" != "null" ] && echo "  PRO Monthly:    $PRO_MONTHLY_PLAN_ID"
[ -n "$PRO_YEARLY_PLAN_ID" ] && [ "$PRO_YEARLY_PLAN_ID" != "null" ] && echo "  PRO Yearly:     $PRO_YEARLY_PLAN_ID"
echo ""
echo "=========================================="

