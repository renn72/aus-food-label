import { z } from 'zod'

import { createIngredientSchema } from '@/lib/ingredient/validation'

const positiveMetricSchema = z.coerce.number().positive().max(1_000_000)
const persistedTextSchema = z.string().trim().min(1)

export const ingredientMetricsSchema = z.object({
  calories: createIngredientSchema.shape.calories,
  energy: createIngredientSchema.shape.energy,
  protein: createIngredientSchema.shape.protein,
  fatTotal: createIngredientSchema.shape.fatTotal,
  fatSaturated: createIngredientSchema.shape.fatSaturated,
  carbohydrate: createIngredientSchema.shape.carbohydrate,
  sugar: createIngredientSchema.shape.sugar,
  dietaryFibre: createIngredientSchema.shape.dietaryFibre,
  sodium: createIngredientSchema.shape.sodium,
})

export const customIngredientSchema = z.object({
  id: persistedTextSchema,
  name: createIngredientSchema.shape.name,
  classification: z.string().trim().min(1).nullable(),
  publicFoodKey: z.string().trim().min(1).nullable(),
  source: z.literal('custom'),
  serveUnit: z.enum(['grams', 'mls']),
  isBase: z.literal(false),
  isAusFood: z.boolean(),
  metrics: ingredientMetricsSchema,
  createdAt: persistedTextSchema,
  updatedAt: persistedTextSchema,
})

export const recipeIngredientSchema = z.object({
  ingredientId: persistedTextSchema,
  quantity: positiveMetricSchema,
})

export const createClientRecipeSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    outputWeight: positiveMetricSchema,
    productWeight: positiveMetricSchema,
    serveSize: positiveMetricSchema,
    ingredients: z.array(recipeIngredientSchema).min(1).max(100),
  })
  .superRefine((data, context) => {
    const seenIngredientIds = new Set<string>()

    data.ingredients.forEach((ingredient, index) => {
      if (seenIngredientIds.has(ingredient.ingredientId)) {
        context.addIssue({
          code: 'custom',
          path: ['ingredients', index, 'ingredientId'],
          message: 'Each ingredient can only appear once per recipe.',
        })
        return
      }

      seenIngredientIds.add(ingredient.ingredientId)
    })

    if (data.productWeight < data.serveSize) {
      context.addIssue({
        code: 'custom',
        path: ['productWeight'],
        message: 'Product weight must be greater than or equal to serve size.',
      })
    }
  })

export const storedRecipeSchema = createClientRecipeSchema.extend({
  id: persistedTextSchema,
  createdAt: persistedTextSchema,
  updatedAt: persistedTextSchema,
})

export type CreateClientRecipeInput = z.infer<typeof createClientRecipeSchema>
