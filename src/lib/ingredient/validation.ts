import { z } from 'zod'

export const ingredientMetricFields = [
  {
    key: 'calories',
    label: 'Calories',
    unit: 'kcal',
  },
  {
    key: 'energy',
    label: 'Energy',
    unit: 'kJ',
  },
  {
    key: 'protein',
    label: 'Protein',
    unit: 'g',
  },
  {
    key: 'fatTotal',
    label: 'Fat total',
    unit: 'g',
  },
  {
    key: 'fatSaturated',
    label: 'Fat saturated',
    unit: 'g',
  },
  {
    key: 'carbohydrate',
    label: 'Carbohydrate',
    unit: 'g',
  },
  {
    key: 'sugar',
    label: 'Sugar',
    unit: 'g',
  },
  {
    key: 'dietaryFibre',
    label: 'Dietary fibre',
    unit: 'g',
  },
  {
    key: 'sodium',
    label: 'Sodium',
    unit: 'mg',
  },
] as const

const nonNegativeMetricSchema = z.coerce.number().min(0).max(1_000_000)

export const createIngredientSchema = z.object({
  name: z.string().trim().min(1).max(160),
  calories: nonNegativeMetricSchema,
  energy: nonNegativeMetricSchema,
  protein: nonNegativeMetricSchema,
  fatTotal: nonNegativeMetricSchema,
  fatSaturated: nonNegativeMetricSchema,
  carbohydrate: nonNegativeMetricSchema,
  sugar: nonNegativeMetricSchema,
  dietaryFibre: nonNegativeMetricSchema,
  sodium: nonNegativeMetricSchema,
})

export type CreateIngredientInput = z.infer<typeof createIngredientSchema>
export type IngredientMetricFieldKey = (typeof ingredientMetricFields)[number]['key']

export function formatStoredMetric(value: number) {
  const normalizedValue = value.toFixed(4).replace(/\.?0+$/, '')
  return normalizedValue === '' ? '0' : normalizedValue
}
