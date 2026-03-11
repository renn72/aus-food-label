import { createServerFn } from '@tanstack/react-start'
import { asc, eq, isNull, or, sql } from 'drizzle-orm'

import { _getUser } from '@/lib/auth/functions'
import { db } from '@/lib/db'
import {
  ingredient,
  ingredientAdditionOne,
  ingredientAdditionThree,
  ingredientAdditionTwo,
} from '@/lib/db/schema'
import { createIngredientSchema, formatStoredMetric } from '@/lib/ingredient/validation'

const ingredientName = sql<string>`coalesce(${ingredient.foodName}, ${ingredient.name})`

export const $getIngredientTableRows = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await _getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return await db
    .select({
      id: ingredient.id,
      name: ingredientName,
      isAusFood: ingredient.isAusFood,
      calories: ingredient.caloriesWFibre,
      energy: ingredientAdditionOne.energyWithDietaryFibre,
      protein: ingredient.protein,
      fatTotal: ingredient.fatTotal,
      fatSaturated: ingredientAdditionThree.totalSaturatedFattyAcids,
      carbohydrate: ingredient.availableCarbohydrateWithSugarAlcohols,
      sugar: ingredient.totalSugars,
      dietaryFibre: ingredient.totalDietaryFibre,
      sodium: ingredientAdditionTwo.sodium,
    })
    .from(ingredient)
    .leftJoin(ingredientAdditionOne, eq(ingredientAdditionOne.ingredientId, ingredient.id))
    .leftJoin(ingredientAdditionTwo, eq(ingredientAdditionTwo.ingredientId, ingredient.id))
    .leftJoin(ingredientAdditionThree, eq(ingredientAdditionThree.ingredientId, ingredient.id))
    .where(or(isNull(ingredient.userId), eq(ingredient.userId, user.id)))
    .orderBy(asc(ingredient.foodName), asc(ingredient.id))
})

export const $createIngredient = createServerFn({ method: 'POST' })
  .inputValidator(createIngredientSchema)
  .handler(async ({ data }) => {
    const user = await _getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    return await db.transaction(async (tx) => {
      const [createdIngredient] = await tx
        .insert(ingredient)
        .values({
          userId: user.id,
          classification: 'Custom ingredient',
          foodName: data.name,
          name: data.name,
          serveSize: '100',
          serveUnit: 'grams',
          caloriesWFibre: formatStoredMetric(data.calories),
          protein: formatStoredMetric(data.protein),
          fatTotal: formatStoredMetric(data.fatTotal),
          totalDietaryFibre: formatStoredMetric(data.dietaryFibre),
          totalSugars: formatStoredMetric(data.sugar),
          availableCarbohydrateWithSugarAlcohols: formatStoredMetric(data.carbohydrate),
          isAusFood: false,
          isAllStores: false,
          isUserCreated: true,
          isPrivate: true,
        })
        .returning({
          id: ingredient.id,
        })

      await tx.insert(ingredientAdditionOne).values({
        ingredientId: createdIngredient.id,
        energyWithDietaryFibre: formatStoredMetric(data.energy),
      })

      await tx.insert(ingredientAdditionTwo).values({
        ingredientId: createdIngredient.id,
        sodium: formatStoredMetric(data.sodium),
      })

      await tx.insert(ingredientAdditionThree).values({
        ingredientId: createdIngredient.id,
        totalSaturatedFattyAcids: formatStoredMetric(data.fatSaturated),
      })

      return createdIngredient
    })
  })

export type IngredientTableRow = Awaited<ReturnType<typeof $getIngredientTableRows>>[number]
