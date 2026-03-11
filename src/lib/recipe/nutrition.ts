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
export type DailyIntakeMetrics = Record<NutritionPanelFieldKey, number | null>

export const nutritionDailyIntakeTargets: Partial<Record<NutritionPanelFieldKey, number>> = {
  energy: 8_700,
  protein: 50,
  fatTotal: 70,
  carbohydrate: 310,
  sugar: 90,
  dietaryFibre: 30,
  sodium: 2_300,
}

export type RecipeNutritionIngredient = {
  ingredientId: number
  name: string
  quantity: number
  metrics: NutritionMetrics
}

export type RecipeNutritionSummary = {
  baseNetWeight: number
  outputWeight: number
  productWeight: number
  yieldPercentage: number
  serveSize: number
  servingsPerPack: number
  totals: NutritionMetrics
  perServe: NutritionMetrics
  dailyIntakePerServe: DailyIntakeMetrics
  per100g: NutritionMetrics
}

type NutritionSource = Partial<Record<NutritionPanelFieldKey, unknown>>

export function calculateRecipeNutrition({
  ingredients,
  outputNetWeight,
  productWeight,
  serveSize,
  servingsPerPack,
}: {
  ingredients: RecipeNutritionIngredient[]
  outputNetWeight: number | null
  productWeight: number | null
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
  const outputWeight = outputNetWeight ?? baseNetWeight
  const effectiveProductWeight =
    productWeight ??
    (servingsPerPack > 0 && serveSize > 0 ? servingsPerPack * serveSize : outputWeight)
  const effectiveServingsPerPack =
    serveSize > 0 ? effectiveProductWeight / serveSize : servingsPerPack
  const yieldPercentage = baseNetWeight > 0 ? (outputWeight / baseNetWeight) * 100 : 0
  const per100g = createEmptyNutritionMetrics()
  const perServe = createEmptyNutritionMetrics()
  const dailyIntakePerServe = createEmptyDailyIntakeMetrics()

  if (outputWeight > 0) {
    for (const field of nutritionPanelFields) {
      per100g[field.key] = (totals[field.key] / outputWeight) * 100
      perServe[field.key] = (per100g[field.key] * serveSize) / 100
      const dailyIntakeTarget = nutritionDailyIntakeTargets[field.key]
      dailyIntakePerServe[field.key] =
        typeof dailyIntakeTarget === 'number' && dailyIntakeTarget > 0
          ? (perServe[field.key] / dailyIntakeTarget) * 100
          : null
    }
  }

  return {
    baseNetWeight,
    outputWeight,
    productWeight: effectiveProductWeight,
    yieldPercentage,
    serveSize,
    servingsPerPack: effectiveServingsPerPack,
    totals,
    perServe,
    dailyIntakePerServe,
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

export function formatDailyIntakeValue(value: number | null) {
  if (value === null) {
    return '—'
  }

  const normalizedValue = Object.is(value, -0) ? 0 : value

  if (normalizedValue > 0 && normalizedValue < 1) {
    return '<1%'
  }

  return `${normalizedValue.toLocaleString('en-AU', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })}%`
}

export function formatWeightValue(value: number) {
  const normalizedValue = Object.is(value, -0) ? 0 : value
  return normalizedValue.toLocaleString('en-AU', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  })
}

export function buildNutritionPanelCopyText({
  recipeName,
  panel,
}: {
  recipeName: string
  panel: RecipeNutritionSummary
}) {
  const rows = nutritionPanelFields.map(
    (field) =>
      `${field.label}\t${formatPanelValue(field.key, panel.perServe[field.key])} ${field.unit}\t${formatDailyIntakeValue(panel.dailyIntakePerServe[field.key])}\t${formatPanelValue(field.key, panel.per100g[field.key])} ${field.unit}`,
  )

  return [
    'Nutrition Information',
    `Recipe: ${recipeName}`,
    `Net weight: ${formatWeightValue(panel.productWeight)} g`,
    `Servings per package: ${formatWeightValue(panel.servingsPerPack)}`,
    `Serving size: ${formatWeightValue(panel.serveSize)} g`,
    '',
    'Average quantity\tPer serve\t% Daily intake (per serve)\tPer 100 g',
    ...rows,
    '',
    'Daily intake targets: Energy 8700 kJ; Protein 50 g; Fat 70 g; Carbohydrate 310 g; Sugars 90 g; Dietary fibre 30 g; Sodium 2.3 g.',
  ].join('\n')
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

function createEmptyDailyIntakeMetrics(): DailyIntakeMetrics {
  return {
    energy: null,
    protein: null,
    fatTotal: null,
    fatSaturated: null,
    carbohydrate: null,
    sugar: null,
    dietaryFibre: null,
    sodium: null,
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
