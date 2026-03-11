import { z } from 'zod'

const positiveMetricSchema = z.coerce.number().positive().max(1_000_000)

const optionalPositiveMetricSchema = z.preprocess(
  (value) => {
    if (value === '' || value === null || value === undefined) {
      return null
    }

    return value
  },
  z.coerce.number().positive().max(1_000_000).nullable(),
)

export const createRecipeSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    outputNetWeight: optionalPositiveMetricSchema,
    serveSize: positiveMetricSchema,
    servingsPerPack: positiveMetricSchema,
    ingredients: z
      .array(
        z.object({
          ingredientId: z.coerce.number().int().positive(),
          quantity: positiveMetricSchema,
        }),
      )
      .min(1)
      .max(100),
  })
  .superRefine((data, context) => {
    const seenIngredientIds = new Set<number>()

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
  })

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>
