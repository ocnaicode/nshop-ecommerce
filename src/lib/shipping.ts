import { calculateDistance } from '@/lib/utils';

// =============================================================================
// Advanced Shipping Calculator
// =============================================================================
// Computes delivery fees using a combination of:
//  - Distance-based zone tiers (seller delivery)
//  - Base fee + per-km overage for distances beyond the configured zones
//  - Percentage-based fee with min/max caps (platform delivery)
//  - Weight-based surcharge
//  - Free-delivery thresholds & coupon-driven free delivery

export interface DeliveryZone {
  minDistance: number;
  maxDistance: number;
  fee: number;
  estimatedTime?: number;
}

export type DeliveryMethod = 'seller_delivery' | 'platform_delivery' | 'self_pickup';

export interface ShippingCalculationInput {
  subtotal: number;
  deliveryMethod: DeliveryMethod;
  /** Distance between shop and customer in kilometers (optional) */
  distanceKm?: number;
  /** Distance-based delivery zones (seller delivery config) */
  zones?: DeliveryZone[];
  /** Flat base fee used when no zone matches */
  baseFee?: number;
  /** Per-kilometer fee applied beyond the last zone */
  perKmFee?: number;
  /** Orders above this subtotal get free delivery */
  freeDeliveryThreshold?: number;
  /** Platform delivery: percentage of subtotal */
  platformPercentage?: number;
  platformMinFee?: number;
  platformMaxFee?: number;
  /** Total order weight in kg (optional) */
  weightKg?: number;
  /** Force zero fee (e.g. free-delivery coupon) */
  forceFree?: boolean;
}

export interface ShippingBreakdown {
  method: DeliveryMethod;
  baseFee: number;
  distanceFee: number;
  weightSurcharge: number;
  totalFee: number;
  freeDeliveryApplied: boolean;
  estimatedTimeMinutes?: number;
}

const DEFAULT_PER_KM_FEE = 8; // ৳8 per km beyond zone range
const WEIGHT_FREE_KG = 5; // first 5kg included
const WEIGHT_SURCHARGE_PER_KG = 5; // ৳5 per extra kg

export function calculateShippingFee(input: ShippingCalculationInput): ShippingBreakdown {
  const {
    subtotal,
    deliveryMethod,
    distanceKm = 0,
    zones = [],
    baseFee = 30,
    perKmFee = DEFAULT_PER_KM_FEE,
    freeDeliveryThreshold,
    platformPercentage = 15,
    platformMinFee = 20,
    platformMaxFee = 300,
    weightKg = 0,
    forceFree = false,
  } = input;

  const breakdown: ShippingBreakdown = {
    method: deliveryMethod,
    baseFee: 0,
    distanceFee: 0,
    weightSurcharge: 0,
    totalFee: 0,
    freeDeliveryApplied: false,
  };

  if (deliveryMethod === 'self_pickup' || forceFree) {
    if (forceFree && deliveryMethod !== 'self_pickup') {
      breakdown.freeDeliveryApplied = true;
    }
    return breakdown;
  }

  if (deliveryMethod === 'seller_delivery') {
    // 1. Match a distance zone
    const zone = zones.find(
      (z) => distanceKm >= z.minDistance && distanceKm <= z.maxDistance
    );

    if (zone) {
      breakdown.baseFee = zone.fee;
      breakdown.estimatedTimeMinutes = zone.estimatedTime;
    } else if (zones.length > 0) {
      // Beyond the last zone: last zone fee + per-km overage
      const last = zones[zones.length - 1];
      const overKm = Math.max(0, distanceKm - last.maxDistance);
      breakdown.baseFee = last.fee;
      breakdown.distanceFee = Math.round(overKm * perKmFee);
      breakdown.estimatedTimeMinutes = last.estimatedTime;
    } else {
      // No zones configured: base fee + per-km
      breakdown.baseFee = baseFee;
      breakdown.distanceFee = Math.round(Math.max(0, distanceKm) * perKmFee);
      breakdown.estimatedTimeMinutes = Math.round(distanceKm * 3 + 20); // ~3 min/km + handling
    }
  } else if (deliveryMethod === 'platform_delivery') {
    const pct = Math.round(subtotal * (platformPercentage / 100));
    breakdown.baseFee = Math.max(platformMinFee, Math.min(pct, platformMaxFee));
    breakdown.estimatedTimeMinutes = Math.round(distanceKm * 2 + 30);
  }

  // 2. Weight surcharge (only for physical deliveries)
  if (weightKg > WEIGHT_FREE_KG) {
    breakdown.weightSurcharge = Math.round((weightKg - WEIGHT_FREE_KG) * WEIGHT_SURCHARGE_PER_KG);
  }

  // 3. Free-delivery threshold
  if (freeDeliveryThreshold && subtotal >= freeDeliveryThreshold) {
    breakdown.freeDeliveryApplied = true;
    breakdown.totalFee = 0;
    return breakdown;
  }

  breakdown.totalFee = breakdown.baseFee + breakdown.distanceFee + breakdown.weightSurcharge;
  return breakdown;
}

/** Convenience wrapper: calculate distance between two coordinates and derive fee. */
export function estimateShippingFee(input: ShippingCalculationInput): ShippingBreakdown {
  return calculateShippingFee(input);
}

/** Haversine distance helper (re-exported for callers that don't want the utils import). */
export { calculateDistance };
