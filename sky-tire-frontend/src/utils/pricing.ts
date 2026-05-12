/**
 * Pricing and Margin Utility Functions
 * Ported from legacy ProductForm business logic.
 */

export interface PricingCalculationResult {
  processingAmount: number;
  netCost: number;
  marginPercentage: string | null;
  recommendedSalePrice: string | null;
}

const DEFAULT_MARGIN_PERCENTAGE = 23; // From VITE_REACT_APP_MARGIN_PERCENTAGE
const DEFAULT_PROCESSING_PERCENTAGE = 3.5;

/**
 * Calculates processing amount, net cost, and margin percentage.
 * 
 * Formula:
 * processingAmount = (salePrice * processingPercentage) / 100
 * netCost = cost + freightCharges + processingAmount
 * marginPercentage = ((salePrice - netCost) / netCost) * 100
 */
export const calculatePricing = (
  cost: number,
  freightCharges: number,
  salePrice: number,
  processingPercentage: number = DEFAULT_PROCESSING_PERCENTAGE
): PricingCalculationResult => {
  const costNum = Number(cost) || 0;
  const freightNum = Number(freightCharges) || 0;
  const salePriceNum = Number(salePrice) || 0;
  const processingPctNum = Number(processingPercentage) || 0;

  const processingAmount = (salePriceNum * processingPctNum) / 100;
  const netCost = costNum + freightNum + processingAmount;

  let marginPercentage: string | null = null;
  if (netCost > 0 && salePriceNum > 0) {
    const percentage = ((salePriceNum - netCost) / netCost) * 100;
    marginPercentage = percentage.toFixed(2);
  }

  const recommendedSalePrice = calculateRecommendedSalePrice(costNum, freightNum, processingPctNum);

  return {
    processingAmount,
    netCost,
    marginPercentage,
    recommendedSalePrice,
  };
};

/**
 * Calculates recommended sale price based on target margin.
 * 
 * Formula derived from: margin% = (salePrice - netCost) / netCost * 100
 * Solving for salePrice gives:
 * salePrice = baseCost * (1 + margin/100) / (1 - (processingPct/100) * (1 + margin/100))
 */
export const calculateRecommendedSalePrice = (
  cost: number,
  freightCharges: number,
  processingPercentage: number = DEFAULT_PROCESSING_PERCENTAGE,
  targetMargin: number = DEFAULT_MARGIN_PERCENTAGE
): string | null => {
  const costNum = Number(cost) || 0;
  const freightNum = Number(freightCharges) || 0;
  const processingPctNum = Number(processingPercentage) || 0;
  const marginPct = Number(targetMargin) || 23;

  const baseCost = costNum + freightNum;

  if (baseCost > 0) {
    const marginMultiplier = 1 + marginPct / 100;
    const processingFactor = (processingPctNum / 100) * marginMultiplier;
    const denominator = 1 - processingFactor;

    if (denominator > 0) {
      const recommendedPrice = (baseCost * marginMultiplier) / denominator;
      return recommendedPrice.toFixed(2);
    }
  }

  return null;
};
