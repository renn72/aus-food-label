import { createServerFn } from '@tanstack/react-start'
import { and, asc, desc, eq, inArray, isNull, or, sql } from 'drizzle-orm'

import { _getUser } from '@/lib/auth/functions'
import { db } from '@/lib/db'
import {
  ingredient,
  ingredientAdditionOne,
  ingredientAdditionThree,
  ingredientAdditionTwo,
  recipe,
  recipeIngredient,
} from '@/lib/db/schema'
import {
  calculateRecipeNutrition,
  extractNutritionMetrics,
  type RecipeNutritionIngredient,
} from '@/lib/recipe/nutrition'
import { createRecipeSchema } from '@/lib/recipe/validation'

const ingredientName = sql<string>`coalesce(${ingredient.foodName}, ${ingredient.name})`

type RecipeRow = {
  recipeId: number
  recipeName: string
  outputNetWeight: number | null
  productWeight: number | null
  serveSize: number
  servingsPerPack: number
  recipeIngredientId: number | null
  ingredientId: number | null
  ingredientName: string | null
  quantity: number | null
  sortOrder: number | null
  energy: string | null
  protein: string | null
  fatTotal: string | null
  fatSaturated: string | null
  carbohydrate: string | null
  sugar: string | null
  dietaryFibre: string | null
  sodium: string | null
}

export const $getRecipeWorkspaceData = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await _getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const availableIngredients = await db
    .select({
      id: ingredient.id,
      name: ingredientName,
      isAusFood: ingredient.isAusFood,
    })
    .from(ingredient)
    .where(or(isNull(ingredient.userId), eq(ingredient.userId, user.id)))
    .orderBy(asc(ingredientName), asc(ingredient.id))

  const recipeRows = await db
    .select({
      recipeId: recipe.id,
      recipeName: recipe.name,
      outputNetWeight: recipe.outputNetWeight,
      productWeight: recipe.productWeight,
      serveSize: recipe.serveSize,
      servingsPerPack: recipe.servingsPerPack,
      recipeIngredientId: recipeIngredient.id,
      ingredientId: ingredient.id,
      ingredientName,
      quantity: recipeIngredient.quantity,
      sortOrder: recipeIngredient.sortOrder,
      energy: ingredientAdditionOne.energyWithDietaryFibre,
      protein: ingredient.protein,
      fatTotal: ingredient.fatTotal,
      fatSaturated: ingredientAdditionThree.totalSaturatedFattyAcids,
      carbohydrate: ingredient.availableCarbohydrateWithSugarAlcohols,
      sugar: ingredient.totalSugars,
      dietaryFibre: ingredient.totalDietaryFibre,
      sodium: ingredientAdditionTwo.sodium,
    })
    .from(recipe)
    .leftJoin(recipeIngredient, eq(recipeIngredient.recipeId, recipe.id))
    .leftJoin(ingredient, eq(ingredient.id, recipeIngredient.ingredientId))
    .leftJoin(ingredientAdditionOne, eq(ingredientAdditionOne.ingredientId, ingredient.id))
    .leftJoin(ingredientAdditionTwo, eq(ingredientAdditionTwo.ingredientId, ingredient.id))
    .leftJoin(ingredientAdditionThree, eq(ingredientAdditionThree.ingredientId, ingredient.id))
    .where(eq(recipe.userId, user.id))
    .orderBy(desc(recipe.id), asc(recipeIngredient.sortOrder), asc(recipeIngredient.id))

  const recipes = Array.from(groupRecipeRows(recipeRows).values()).map((recipeRecord) => ({
    ...recipeRecord,
    panel: calculateRecipeNutrition({
      ingredients: recipeRecord.ingredients,
      outputNetWeight: recipeRecord.outputNetWeight,
      productWeight: recipeRecord.productWeight,
      serveSize: recipeRecord.serveSize,
      servingsPerPack: recipeRecord.servingsPerPack,
    }),
  }))

  return {
    availableIngredients,
    recipes,
  }
})

export const $createRecipe = createServerFn({ method: 'POST' })
  .inputValidator(createRecipeSchema)
  .handler(async ({ data }) => {
    const user = await _getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const ingredientIds = data.ingredients.map((ingredientEntry) => ingredientEntry.ingredientId)
    const baseInputWeight = data.ingredients.reduce(
      (total, ingredientEntry) => total + ingredientEntry.quantity,
      0,
    )
    const outputNetWeight = (baseInputWeight * data.outputScalePercent) / 100
    const servingsPerPack = data.productWeight / data.serveSize

    return await db.transaction(async (tx) => {
      const visibleIngredients = await tx
        .select({
          id: ingredient.id,
        })
        .from(ingredient)
        .where(
          and(
            inArray(ingredient.id, ingredientIds),
            or(isNull(ingredient.userId), eq(ingredient.userId, user.id)),
          ),
        )

      if (visibleIngredients.length !== ingredientIds.length) {
        throw new Error('One or more ingredients are unavailable.')
      }

      const [createdRecipe] = await tx
        .insert(recipe)
        .values({
          userId: user.id,
          name: data.name,
          outputNetWeight,
          productWeight: data.productWeight,
          serveSize: data.serveSize,
          servingsPerPack,
        })
        .returning({
          id: recipe.id,
        })

      await tx.insert(recipeIngredient).values(
        data.ingredients.map((ingredientEntry, index) => ({
          recipeId: createdRecipe.id,
          ingredientId: ingredientEntry.ingredientId,
          quantity: ingredientEntry.quantity,
          sortOrder: index,
        })),
      )

      return createdRecipe
    })
  })

function groupRecipeRows(rows: RecipeRow[]) {
  const recipeMap = new Map<
    number,
    {
      id: number
      name: string
      outputNetWeight: number | null
      productWeight: number | null
      serveSize: number
      servingsPerPack: number
      ingredients: RecipeNutritionIngredient[]
    }
  >()

  for (const row of rows) {
    const existingRecipe = recipeMap.get(row.recipeId)

    if (!existingRecipe) {
      recipeMap.set(row.recipeId, {
        id: row.recipeId,
        name: row.recipeName,
        outputNetWeight: row.outputNetWeight,
        productWeight: row.productWeight,
        serveSize: row.serveSize,
        servingsPerPack: row.servingsPerPack,
        ingredients: [],
      })
    }

    if (
      row.recipeIngredientId === null ||
      row.ingredientId === null ||
      row.quantity === null ||
      row.ingredientName === null
    ) {
      continue
    }

    recipeMap.get(row.recipeId)?.ingredients.push({
      ingredientId: row.ingredientId,
      name: row.ingredientName,
      quantity: row.quantity,
      metrics: extractNutritionMetrics({
        energy: row.energy,
        protein: row.protein,
        fatTotal: row.fatTotal,
        fatSaturated: row.fatSaturated,
        carbohydrate: row.carbohydrate,
        sugar: row.sugar,
        dietaryFibre: row.dietaryFibre,
        sodium: row.sodium,
      }),
    })
  }

  return recipeMap
}

export type RecipeWorkspaceData = Awaited<ReturnType<typeof $getRecipeWorkspaceData>>
