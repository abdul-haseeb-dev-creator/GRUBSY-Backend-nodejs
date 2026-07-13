# Grubsy Pricing Structure

This document outlines the complete pricing structure used by the Grubsy platform, including customer-facing fees and internal commission calculations.

---

## Table of Contents

1. [Customer-Facing Fees](#customer-facing-fees)
   - [Delivery Fees](#delivery-fees)
   - [Service Charges](#service-charges)
   - [Small Order Fees](#small-order-fees)
2. [Order Total Calculation](#order-total-calculation)
3. [Merchant Commissions](#merchant-commissions)
4. [Driver Payments](#driver-payments)
5. [Platform Fees](#platform-fees)
6. [Example Calculations](#example-calculations)

---

## Customer-Facing Fees

These are the fees displayed to customers when placing an order.

### Delivery Fees

Delivery fees are based on the distance between the restaurant and the customer's delivery address. The pricing uses a tiered system with half-mile increments up to 5 miles.

| Distance (miles) | Delivery Fee |
|------------------|--------------|
| 0 - 1.0          | £3.45        |
| 1.0 - 1.5        | £3.92        |
| 1.5 - 2.0        | £4.40        |
| 2.0 - 2.5        | £4.88        |
| 2.5 - 3.0        | £5.35        |
| 3.0 - 3.5        | £5.83        |
| 3.5 - 4.0        | £6.15        |
| 4.0 - 4.5        | £6.55        |
| 4.5 - 5.0        | £7.10        |
| Over 5.0         | £7.10        |

> **Note:** For distances over 5 miles, the maximum delivery fee of £7.10 is applied.

---

### Service Charges

Service charges are calculated as a percentage of the order subtotal (food items only, before delivery fees). The percentage varies based on delivery distance.

| Distance (miles) | Service Charge Rate |
|------------------|---------------------|
| 0 - 2.0          | 6.0%                |
| 2.0 - 3.0        | 7.0%                |
| 3.0 - 4.0        | 7.0%                |
| 4.0 - 5.0        | 8.0%                |
| Over 5.0         | 8.0%                |

**Minimum Service Charge:** £1.50

> The service charge will never be less than £1.50, regardless of the calculated percentage.

---

### Small Order Fees

Small order fees apply to orders with a subtotal **under £15**. This fee helps cover operational costs for smaller deliveries.

| Distance (miles) | Small Order Fee |
|------------------|-----------------|
| 0 - 1.0          | £2.77           |
| 1.0 - 2.0        | £3.77           |
| 2.0 - 3.0        | £4.99           |
| 3.0 - 4.0        | £5.50           |
| 4.0 - 5.0        | £5.99           |
| Over 5.0         | £5.99           |

> **Note:** Small order fees do NOT apply to orders of £15 or more.

---

## Order Total Calculation

The customer's total is calculated as follows:

```
Grand Total = Subtotal + Delivery Fee + Service Charge + Small Order Fee (if applicable)
```

**Where:**
- **Subtotal** = Sum of all menu items in the order
- **Delivery Fee** = Based on distance (see table above)
- **Service Charge** = Percentage of subtotal based on distance (minimum £1.50)
- **Small Order Fee** = Applied only if subtotal < £15

---

## Merchant Commissions

Grubsy charges merchants a commission on each order. This commission is deducted from the order subtotal before payment is transferred to the merchant.

### Commission Rates

| Merchant Tier    | Commission Rate |
|------------------|-----------------|
| Standard         | 15%             |
| Premium          | 12%             |
| High Volume*     | 13%             |

*High volume discount applies to merchants processing over £1,000 in monthly order volume.

### Merchant-Specific Rates

Individual merchants may have custom commission rates stored in the system. These are configured on a per-merchant basis and override the default tier rates.

### Merchant Earnings Calculation

```
Merchant Earnings = Subtotal - (Subtotal × Commission Rate)
```

**Example:** For a £50 order with 15% commission:
- Commission: £50 × 0.15 = £7.50
- Merchant Earnings: £50 - £7.50 = £42.50

---

## Driver Payments

Drivers receive fixed payments based on delivery distance. These payments are separate from customer-facing delivery fees.

### Base Driver Payments

| Distance (miles) | Driver Payment |
|------------------|----------------|
| 0 - 1.0          | £3.35          |
| 1.0 - 1.5        | £3.83          |
| 1.5 - 2.0        | £4.30          |
| 2.0 - 2.5        | £4.78          |
| 2.5 - 3.0        | £5.25          |
| 3.0 - 3.5        | £5.73          |
| 3.5 - 4.0        | £6.10          |
| 4.0 - 4.5        | £6.50          |
| 4.5 - 5.0        | £7.10          |
| Over 5.0         | £7.10          |

### Time-Based Bonuses

Drivers receive additional bonuses during certain hours:

| Bonus Type       | Additional Payment |
|------------------|-------------------|
| Peak Hours       | +£1.50            |
| Late Night       | +£2.00            |

### Tips

Customer tips are passed directly to drivers in addition to their base payment and bonuses.

### Total Driver Earnings Calculation

```
Total Driver Earnings = Base Payment + Time Bonuses + Tips
```

---

## Platform Fees

These are internal fees collected by Grubsy from transactions.

### Service Fee

A fixed platform service fee of **£0.50** is applied to each order.

### Payment Processing Fees

Payment processing fees vary by payment method:

| Payment Method   | Processing Fee |
|------------------|----------------|
| Stripe           | 2.9%           |
| Apple Pay        | 2.9%           |
| Google Pay       | 2.9%           |
| PayPal           | 3.4%           |
| Klarna           | 2.5%           |
| Cash             | 0%             |

---

## Example Calculations

### Example 1: Standard Order

**Scenario:**
- Order subtotal: £25.00
- Distance: 2.5 miles
- Payment method: Stripe

**Customer Sees:**
| Item                | Amount   |
|---------------------|----------|
| Subtotal            | £25.00   |
| Delivery Fee        | £4.88    |
| Service Charge (7%) | £1.75    |
| Small Order Fee     | £0.00    |
| **Total**           | **£31.63** |

**Behind the Scenes:**
| Item                          | Amount   |
|-------------------------------|----------|
| Merchant Commission (15%)     | £3.75    |
| Merchant Earnings             | £21.25   |
| Driver Payment                | £4.78    |
| Platform Service Fee          | £0.50    |
| Payment Processing (2.9%)     | £0.92    |

---

### Example 2: Small Order

**Scenario:**
- Order subtotal: £12.00
- Distance: 1.5 miles
- Payment method: Apple Pay

**Customer Sees:**
| Item                | Amount   |
|---------------------|----------|
| Subtotal            | £12.00   |
| Delivery Fee        | £3.92    |
| Service Charge (6%) | £1.50*   |
| Small Order Fee     | £3.77    |
| **Total**           | **£21.19** |

*Service charge minimum of £1.50 applied (6% of £12 = £0.72, but minimum is £1.50)

**Behind the Scenes:**
| Item                          | Amount   |
|-------------------------------|----------|
| Merchant Commission (15%)     | £1.80    |
| Merchant Earnings             | £10.20   |
| Driver Payment                | £3.83    |
| Platform Service Fee          | £0.50    |
| Payment Processing (2.9%)     | £0.61    |

---

### Example 3: Large Order with Tip (Peak Hours)

**Scenario:**
- Order subtotal: £75.00
- Distance: 4.0 miles
- Customer tip: £5.00
- Peak hour delivery
- Payment method: Google Pay

**Customer Sees:**
| Item                | Amount   |
|---------------------|----------|
| Subtotal            | £75.00   |
| Delivery Fee        | £6.15    |
| Service Charge (7%) | £5.25    |
| Small Order Fee     | £0.00    |
| Tip                 | £5.00    |
| **Total**           | **£91.40** |

**Behind the Scenes:**
| Item                          | Amount   |
|-------------------------------|----------|
| Merchant Commission (15%)     | £11.25   |
| Merchant Earnings             | £63.75   |
| Driver Base Payment           | £6.10    |
| Driver Peak Hour Bonus        | £1.50    |
| Driver Tip                    | £5.00    |
| **Total Driver Earnings**     | **£12.60** |
| Platform Service Fee          | £0.50    |
| Payment Processing (2.9%)     | £2.65    |

---

## API Endpoints

The following API endpoints are available for pricing calculations:

| Endpoint                       | Method | Description                              |
|--------------------------------|--------|------------------------------------------|
| `/api/pricing/preview`         | GET    | Get pricing preview for distance/subtotal |
| `/api/pricing/calculate`       | POST   | Calculate complete order pricing          |
| `/api/pricing/delivery-fee`    | GET    | Get delivery fee for specific distance    |
| `/api/pricing/service-charge`  | GET    | Get service charge for distance/subtotal  |
| `/api/pricing/small-order-fee` | GET    | Get small order fee for specific distance |

---

## Notes

1. All prices are in GBP (£).
2. Distance calculations use straight-line distance between restaurant and delivery address.
3. Maximum supported delivery distance is 50 miles.
4. Merchant-specific commission rates take precedence over tier rates.
5. Pricing may be adjusted for promotional campaigns or special events.

---

*Last Updated: January 2026*
