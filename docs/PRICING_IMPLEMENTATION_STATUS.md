  # Grubsy Pricing API - Implementation Status Report

  ## Overview

  This document compares the client's pricing requirements for the User App against the current backend implementation.

  ---

  ## Client Requirements Summary

  The client needs a `POST /api/pricing/preview` endpoint that:
  - **Accepts:** `{ distance: number (in miles), subtotal: number }`
  - **Returns:** `{ subtotal: number, fees: { service: number, delivery: number }, grandTotal: number }`

  ### Client's Pricing Rules:
  1. **Service Charge:** Fixed £1.50 for all orders
  2. **Delivery Fee:** Distance-based tiers
  3. **Small Order Surcharge:** Additional fee for orders ≤ £14.99 (added ON TOP of normal delivery fee)

  ---

  ## Implementation Status

  ### 1. Endpoint Configuration

  | Requirement | Client Needs | Current Implementation | Status |
  |-------------|--------------|------------------------|--------|
  | HTTP Method | `POST` | `GET` | ❌ **Not Implemented** |
  | Path | `/api/pricing/preview` | `/api/pricing/preview` | ✅ Implemented |
  | Route Registered | Yes | Yes (in `src/api.js` line 1810) | ✅ Implemented |

  **Issue:** The frontend expects to send a POST request with JSON body, but the backend only accepts GET requests with query parameters.

  ---

  ### 2. Service Charge

  | Requirement | Client Needs | Current Implementation | Status |
  |-------------|--------------|------------------------|--------|
  | Service Charge | **Fixed £1.50** for ALL orders | Variable percentage (6-8%) based on distance, with £1.50 minimum | ❌ **Not Implemented** |

  **Current Logic (WRONG):**
  ```
  0-2 miles: 6% of subtotal
  2-3 miles: 7% of subtotal
  3-4 miles: 7% of subtotal
  4-5 miles: 8% of subtotal
  Minimum: £1.50
  ```

  **Client's Logic (NEEDED):**
  ```
  All orders: Fixed £1.50
  ```

  **Example of Difference:**
  - £50 order, 3 miles distance
  - Current: £50 × 7% = £3.50 service charge
  - Client wants: £1.50 service charge

  ---

  ### 3. Delivery Fee Tiers (Normal Orders > £14.99)

  | Distance | Client Needs | Current Implementation | Status |
  |----------|--------------|------------------------|--------|
  | 0-1 mile | £3.45 | £3.45 | ✅ Implemented |
  | 1-2 miles | £4.40 | £4.40 | ✅ Implemented |
  | 2-3 miles | £5.35 | £5.35 | ✅ Implemented |
  | 3-4 miles | £6.15 | £6.15 | ✅ Implemented |
  | 4-5 miles | £7.10 | £7.10 | ✅ Implemented |

  **Note:** Current implementation also has half-mile increments (1.5, 2.5, 3.5, 4.5 miles) which is fine - provides more granularity.

  ---

  ### 4. Small Order Surcharge (Orders ≤ £14.99)

  | Distance | Client Needs | Current Implementation | Status |
  |----------|--------------|------------------------|--------|
  | 0-1 mile | +£2.45 | +£2.77 | ❌ **Wrong Value** |
  | 1-2 miles | +£3.25 | +£3.77 | ❌ **Wrong Value** |
  | 2-3 miles | +£3.99 | +£4.99 | ❌ **Wrong Value** |
  | 3-4 miles | +£4.80 | +£5.50 | ❌ **Wrong Value** |
  | 4-5 miles | +£4.99 | +£5.99 | ❌ **Wrong Value** |

  **All small order surcharge values need to be updated.**

  ---

  ### 5. Small Order Threshold

  | Requirement | Client Needs | Current Implementation | Status |
  |-------------|--------------|------------------------|--------|
  | Threshold | Orders ≤ £14.99 | Orders < £15 | ✅ Effectively Same |

  The difference between `< 15` and `≤ 14.99` is negligible (only affects orders of exactly £15.00).

  ---

  ### 6. Response Format

  **Client Expects:**
  ```json
  {
    "subtotal": 20,
    "fees": {
      "service": 1.50,
      "delivery": 4.40
    },
    "grandTotal": 25.90
  }
  ```

  **Current Implementation Returns:**
  ```json
  {
    "success": true,
    "data": {
      "distance": 2,
      "subtotal": 20,
      "isSmallOrder": false,
      "fees": {
        "delivery": 4.40,
        "service": 1.50,
        "smallOrder": 0
      },
      "totalFees": 5.90,
      "grandTotal": 25.90,
      "breakdown": {
        "subtotal": "20.00",
        "deliveryFee": "4.40",
        "serviceCharge": "1.50",
        "smallOrderFee": "0.00",
        "totalFees": "5.90",
        "grandTotal": "25.90"
      }
    }
  }
  ```

  | Aspect | Client Needs | Current Implementation | Status |
  |--------|--------------|------------------------|--------|
  | Wrapper object | None (flat) | Wrapped in `{ success, data }` | ⚠️ **Different** |
  | Fee structure | `{ service, delivery }` | `{ delivery, service, smallOrder }` | ⚠️ **Different** |
  | Extra fields | None | `distance`, `isSmallOrder`, `breakdown`, etc. | ⚠️ **Extra data** |

  **Note:** The current format includes MORE data than needed, which may be acceptable if the frontend can handle it. However, the nested `data` wrapper may cause issues.

  ---

  ## Example Calculations Comparison

  ### Example 1: Normal Order (2-mile delivery, £20 subtotal)

  | Component | Client Expects | Current Backend Would Return |
  |-----------|---------------|------------------------------|
  | Subtotal | £20.00 | £20.00 |
  | Service Charge | £1.50 (fixed) | £1.50 (6% = £1.20, but min £1.50) |
  | Delivery Fee | £4.40 | £4.40 |
  | **Total Fees** | **£5.90** | **£5.90** |
  | **Grand Total** | **£25.90** | **£25.90** |

  ✅ This example would match (by coincidence - the minimum kicks in)

  ---

  ### Example 2: Normal Order (2-mile delivery, £50 subtotal)

  | Component | Client Expects | Current Backend Would Return |
  |-----------|---------------|------------------------------|
  | Subtotal | £50.00 | £50.00 |
  | Service Charge | £1.50 (fixed) | **£3.00** (6% of £50) |
  | Delivery Fee | £4.40 | £4.40 |
  | **Total Fees** | **£5.90** | **£7.40** |
  | **Grand Total** | **£55.90** | **£57.40** |

  ❌ **£1.50 OVERCHARGE** - Customer would pay more than expected

  ---

  ### Example 3: Small Order (2-mile delivery, £12 subtotal)

  | Component | Client Expects | Current Backend Would Return |
  |-----------|---------------|------------------------------|
  | Subtotal | £12.00 | £12.00 |
  | Service Charge | £1.50 (fixed) | £1.50 (min applies) |
  | Delivery Fee | £4.40 | £4.40 |
  | Small Order Surcharge | £3.25 | **£3.77** |
  | **Total Fees** | **£9.15** | **£9.67** |
  | **Grand Total** | **£21.15** | **£21.67** |

  ❌ **£0.52 OVERCHARGE** - Wrong small order surcharge

  ---

  ## Summary Table

  | Requirement | Status | Priority |
  |-------------|--------|----------|
  | POST method for `/api/pricing/preview` | ❌ Not Implemented | **High** |
  | Fixed £1.50 service charge | ❌ Not Implemented | **High** |
  | Correct small order surcharge values | ❌ Not Implemented | **High** |
  | Delivery fee tiers | ✅ Implemented | - |
  | Small order threshold (≤£14.99) | ✅ Implemented | - |
  | Response format adjustment | ⚠️ Needs Review | Medium |
  | Route registration | ✅ Implemented | - |

  ---

  ## Required Changes

  To fully implement the client's requirements, the following changes are needed:

  ### High Priority:
  1. **Add POST handler** to `/api/pricing/preview` endpoint (or change GET to POST)
  2. **Change service charge** from percentage-based to fixed £1.50
  3. **Update small order surcharge values:**
    - 0-1 mile: £2.77 → £2.45
    - 1-2 miles: £3.77 → £3.25
    - 2-3 miles: £4.99 → £3.99
    - 3-4 miles: £5.50 → £4.80
    - 4-5 miles: £5.99 → £4.99

  ### Medium Priority:
  4. **Adjust response format** to match client's expected structure (or confirm frontend can handle current format)

  ---

  ## Files That Need Modification

  | File | Changes Needed |
  |------|----------------|
  | `Grubsy-Backend/services/pricingService.js` | Update service charge logic, update small order surcharge values |
  | `Grubsy-Backend/routes/pricing.js` | Add POST handler, adjust response format |

  ---

  *Report Generated: January 2026*
