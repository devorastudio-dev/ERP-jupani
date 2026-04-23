/**
 * @param {number | null | undefined} quantitySold
 * @param {number | null | undefined} currentStock
 * @param {number} periodDays
 */
export function calculateCoverageDays(quantitySold, currentStock, periodDays) {
  const sold = Number(quantitySold ?? 0);
  const stock = Number(currentStock ?? 0);
  if (sold <= 0 || stock <= 0 || periodDays <= 0) return null;

  const averageDailyConsumption = sold / periodDays;
  if (averageDailyConsumption <= 0) return null;

  return stock / averageDailyConsumption;
}

/**
 * @param {number | null | undefined} quantitySold
 * @param {number | null | undefined} averageStock
 */
export function calculateTurnover(quantitySold, averageStock) {
  const sold = Number(quantitySold ?? 0);
  const stock = Number(averageStock ?? 0);
  if (sold <= 0 || stock <= 0) return null;

  return sold / stock;
}

/**
 * @param {number | null | undefined} currentStock
 * @param {number | null | undefined} minimumStock
 */
export function calculateReplenishmentGap(currentStock, minimumStock) {
  const current = Number(currentStock ?? 0);
  const minimum = Number(minimumStock ?? 0);
  return Math.max(minimum - current, 0);
}
