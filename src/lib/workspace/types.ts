import type {
  NutritionMetrics,
  RecipeNutritionIngredient,
  RecipeNutritionSummary,
} from '@/lib/recipe/nutrition'

export type IngredientSource = 'seed-solid' | 'seed-liquid' | 'custom'
export type ServeUnit = 'grams' | 'mls'

export type IngredientMetrics = NutritionMetrics & {
  calories: number
}

type IngredientRecordBase = {
  id: string
  name: string
  classification: string | null
  publicFoodKey: string | null
  source: IngredientSource
  serveUnit: ServeUnit
  isBase: boolean
  isAusFood: boolean
  metrics: IngredientMetrics
}

export type BaseIngredient = IngredientRecordBase & {
  source: Exclude<IngredientSource, 'custom'>
  isBase: true
  createdAt: null
  updatedAt: null
}

export type CustomIngredient = IngredientRecordBase & {
  source: 'custom'
  isBase: false
  createdAt: string
  updatedAt: string
}

export type IngredientRecord = BaseIngredient | CustomIngredient

export type StoredRecipeIngredient = {
  ingredientId: string
  quantity: number
}

export type StoredRecipe = {
  id: string
  name: string
  outputWeight: number
  productWeight: number
  serveSize: number
  ingredients: StoredRecipeIngredient[]
  createdAt: string
  updatedAt: string
}

export type HydratedRecipeIngredient = RecipeNutritionIngredient & {
  ingredientId: string
  source: IngredientSource
  serveUnit: ServeUnit
}

export type HydratedRecipe = StoredRecipe & {
  panel: RecipeNutritionSummary | null
  missingIngredientIds: string[]
  resolvedIngredients: HydratedRecipeIngredient[]
  servingsPerPack: number
}

export type WorkspacePersistence = {
  version: 1
  customIngredients: CustomIngredient[]
  recipes: StoredRecipe[]
}

export type WorkspaceRecoveryState = {
  persistence: WorkspacePersistence
  recoveryMessages: string[]
}

export type BaseIngredientsState =
  | {
      status: 'loading'
    }
  | {
      status: 'ready'
      ingredients: BaseIngredient[]
    }
  | {
      status: 'error'
      message: string
    }
