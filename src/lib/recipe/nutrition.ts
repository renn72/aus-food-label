export const nutritionPanelFields = [
  {
    key: 'energy',
    label: 'Energy',
    unit: 'kJ',
    maximumFractionDigits: 0,
  },
  {
    key: 'protein',
    label: 'Protein',
    unit: 'g',
    maximumFractionDigits: 1,
  },
  {
    key: 'fatTotal',
    label: 'Fat, total',
    unit: 'g',
    maximumFractionDigits: 1,
  },
  {
    key: 'fatSaturated',
    label: 'Fat, saturated',
    unit: 'g',
    maximumFractionDigits: 1,
  },
  {
    key: 'carbohydrate',
    label: 'Carbohydrate',
    unit: 'g',
    maximumFractionDigits: 1,
  },
  {
    key: 'sugar',
    label: 'Sugars',
    unit: 'g',
    maximumFractionDigits: 1,
  },
  {
    key: 'dietaryFibre',
    label: 'Dietary fibre',
    unit: 'g',
    maximumFractionDigits: 1,
  },
  {
    key: 'sodium',
    label: 'Sodium',
    unit: 'mg',
    maximumFractionDigits: 0,
  },
] as const

export type NutritionPanelFieldKey = (typeof nutritionPanelFields)[number]['key']
export type NutritionMetrics = Record<NutritionPanelFieldKey, number>

export type RecipeNutritionIngredient = {
  ingredientId: number
  name: string
  quantity: number
  metrics: NutritionMetrics
}

export type RecipeNutritionSummary = {
  baseNetWeight: number
  netWeight: number
  serveSize: number
  servingsPerPack: number
  totals: NutritionMetrics
  perServe: NutritionMetrics
  per100g: NutritionMetrics
}

type NutritionSource = Partial<Record<NutritionPanelFieldKey, unknown>>

export function calculateRecipeNutrition({
  ingredients,
  outputNetWeight,
  serveSize,
  servingsPerPack,
}: {
  ingredients: RecipeNutritionIngredient[]
  outputNetWeight: number | null
  serveSize: number
  servingsPerPack: number
}): RecipeNutritionSummary {
  const totals = createEmptyNutritionMetrics()

  for (const ingredient of ingredients) {
    for (const field of nutritionPanelFields) {
      totals[field.key] += (ingredient.metrics[field.key] * ingredient.quantity) / 100
    }
  }

  const baseNetWeight = ingredients.reduce((total, ingredient) => total + ingredient.quantity, 0)
  const netWeight = outputNetWeight ?? baseNetWeight
  const per100g = createEmptyNutritionMetrics()
  const perServe = createEmptyNutritionMetrics()

  if (netWeight > 0) {
    for (const field of nutritionPanelFields) {
      per100g[field.key] = (totals[field.key] / netWeight) * 100
      perServe[field.key] = (per100g[field.key] * serveSize) / 100
    }
  }

  return {
    baseNetWeight,
    netWeight,
    serveSize,
    servingsPerPack,
    totals,
    perServe,
    per100g,
  }
}

export function extractNutritionMetrics(source: NutritionSource): NutritionMetrics {
  return {
    energy: parseMetricValue(source.energy),
    protein: parseMetricValue(source.protein),
    fatTotal: parseMetricValue(source.fatTotal),
    fatSaturated: parseMetricValue(source.fatSaturated),
    carbohydrate: parseMetricValue(source.carbohydrate),
    sugar: parseMetricValue(source.sugar),
    dietaryFibre: parseMetricValue(source.dietaryFibre),
    sodium: parseMetricValue(source.sodium),
  }
}

export function formatPanelValue(fieldKey: NutritionPanelFieldKey, value: number) {
  const maximumFractionDigits =
    nutritionPanelFields.find((field) => field.key === fieldKey)?.maximumFractionDigits ?? 1
  const normalizedValue = Object.is(value, -0) ? 0 : value

  return normalizedValue.toLocaleString('en-AU', {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  })
}

export function formatWeightValue(value: number) {
  const normalizedValue = Object.is(value, -0) ? 0 : value
  return normalizedValue.toLocaleString('en-AU', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  })
}

function createEmptyNutritionMetrics(): NutritionMetrics {
  return {
    energy: 0,
    protein: 0,
    fatTotal: 0,
    fatSaturated: 0,
    carbohydrate: 0,
    sugar: 0,
    dietaryFibre: 0,
    sodium: 0,
  }
}

function parseMetricValue(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value !== 'string') {
    return 0
  }

  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return 0
  }

  const parsedValue = Number(normalizedValue)
  return Number.isFinite(parsedValue) ? parsedValue : 0
}
