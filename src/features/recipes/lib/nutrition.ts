import { areUnitsCompatible, convertQuantity } from "@/lib/measurement";
import { getAverageSlicesByPanShape } from "@/features/products/lib/pan-shapes";

type NutritionIngredientInput = {
  unit?: string | null;
  nutrition_quantity?: number | null;
  nutrition_unit?: string | null;
  kcal_amount?: number | null;
};

type NutritionRecipeItemInput = {
  ingredient_id: string;
  unit: string;
  quantity: number | null;
};

const roundMetric = (value: number) => Math.round(value * 100) / 100;

export function calculateEstimatedServings(input: {
  yieldQuantity?: number | null;
  yieldUnit?: string | null;
  panShapeCode?: string | null;
  servingReferenceQuantity?: number | null;
  servingReferenceUnit?: string | null;
}) {
  const averageSlices = getAverageSlicesByPanShape(input.panShapeCode);
  if (averageSlices > 0) {
    return roundMetric(averageSlices);
  }

  const yieldQuantity = Number(input.yieldQuantity ?? 0);
  const servingReferenceQuantity = Number(input.servingReferenceQuantity ?? 0);
  const yieldUnit = String(input.yieldUnit ?? "").trim();
  const servingReferenceUnit = String(input.servingReferenceUnit ?? "").trim();

  if (yieldQuantity <= 0 || servingReferenceQuantity <= 0 || !yieldUnit || !servingReferenceUnit) {
    return 0;
  }

  const convertedYield = convertQuantity(yieldQuantity, yieldUnit, servingReferenceUnit);
  const compatibleYield =
    convertedYield ?? (areUnitsCompatible(yieldUnit, servingReferenceUnit) ? yieldQuantity : null);

  if (!compatibleYield || compatibleYield <= 0) {
    return 0;
  }

  return roundMetric(compatibleYield / servingReferenceQuantity);
}

export function calculateRecipeNutrition(input: {
  items: NutritionRecipeItemInput[];
  ingredientsMap: Map<string, NutritionIngredientInput>;
  yieldQuantity?: number | null;
  yieldUnit?: string | null;
  panShapeCode?: string | null;
  servingReferenceQuantity?: number | null;
  servingReferenceUnit?: string | null;
}) {
  const totalKcal = input.items.reduce((sum, item) => {
    const ingredient = input.ingredientsMap.get(item.ingredient_id);
    if (!ingredient) {
      return sum;
    }

    const nutritionQuantity = Number(ingredient.nutrition_quantity ?? 0);
    const kcalAmount = Number(ingredient.kcal_amount ?? 0);
    const nutritionUnit = String(ingredient.nutrition_unit ?? ingredient.unit ?? "").trim();

    if (nutritionQuantity <= 0 || kcalAmount <= 0 || !nutritionUnit) {
      return sum;
    }

    const convertedQuantity = convertQuantity(Number(item.quantity ?? 0), item.unit, nutritionUnit);
    const safeQuantity =
      convertedQuantity ?? (areUnitsCompatible(item.unit, nutritionUnit) ? Number(item.quantity ?? 0) : 0);

    if (!safeQuantity || safeQuantity <= 0) {
      return sum;
    }

    return sum + (safeQuantity / nutritionQuantity) * kcalAmount;
  }, 0);

  const estimatedServings = calculateEstimatedServings({
    yieldQuantity: input.yieldQuantity,
    yieldUnit: input.yieldUnit,
    panShapeCode: input.panShapeCode,
    servingReferenceQuantity: input.servingReferenceQuantity,
    servingReferenceUnit: input.servingReferenceUnit,
  });

  return {
    estimatedServings,
    estimatedKcalTotal: roundMetric(totalKcal),
    estimatedKcalPerServing: estimatedServings > 0 ? roundMetric(totalKcal / estimatedServings) : 0,
  };
}
