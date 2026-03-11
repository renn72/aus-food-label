import { createServerFn } from '@tanstack/react-start'
import { asc, eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import {
  ingredient,
  ingredientAdditionOne,
  ingredientAdditionThree,
  ingredientAdditionTwo,
} from '@/lib/db/schema'

export const $getIngredientTableRows = createServerFn({ method: 'GET' }).handler(async () => {
  return await db
    .select({
      id: ingredient.id,
      name: ingredient.foodName,
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
    .orderBy(asc(ingredient.foodName), asc(ingredient.id))
})

export type IngredientTableRow = Awaited<ReturnType<typeof $getIngredientTableRows>>[number]
