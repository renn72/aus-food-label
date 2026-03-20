import { atom } from 'jotai'

import { loadBaseIngredients } from '@/lib/ingredient/csv'
import { calculateRecipeNutrition, extractNutritionMetrics } from '@/lib/recipe/nutrition'
import { createIngredientSchema } from '@/lib/ingredient/validation'
import { createClientRecipeSchema } from '@/lib/workspace/schema'
import {
  WORKSPACE_STORAGE_KEY,
  defaultWorkspacePersistence,
  loadPersistedWorkspace,
  normalizeWorkspace,
  persistWorkspace,
} from '@/lib/workspace/persistence'
import type {
  BaseIngredientsState,
  CustomIngredient,
  HydratedRecipe,
  HydratedRecipeIngredient,
  IngredientRecord,
  StoredRecipe,
  WorkspacePersistence,
  WorkspaceRecoveryState,
} from '@/lib/workspace/types'

type Updater<T> = T | ((currentValue: T) => T)

const initialWorkspaceState: WorkspaceRecoveryState = {
  persistence: defaultWorkspacePersistence,
  recoveryMessages: [],
}

const workspaceStateAtomBase = atom<WorkspaceRecoveryState>(initialWorkspaceState)

workspaceStateAtomBase.onMount = (setWorkspaceState) => {
  const loadedWorkspace = loadPersistedWorkspace()

  setWorkspaceState({
    persistence: loadedWorkspace.workspace,
    recoveryMessages: loadedWorkspace.recoveryMessages,
  })

  if (loadedWorkspace.recovered) {
    persistWorkspace(loadedWorkspace.workspace)
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== WORKSPACE_STORAGE_KEY) {
      return
    }

    const nextWorkspace = loadPersistedWorkspace()

    setWorkspaceState({
      persistence: nextWorkspace.workspace,
      recoveryMessages: nextWorkspace.recoveryMessages,
    })

    if (nextWorkspace.recovered) {
      persistWorkspace(nextWorkspace.workspace)
    }
  }

  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener('storage', handleStorage)
  }
}

const workspacePersistenceAtom = atom(
  (get) => get(workspaceStateAtomBase).persistence,
  (get, set, update: Updater<WorkspacePersistence>) => {
    const currentState = get(workspaceStateAtomBase)
    const nextValue = typeof update === 'function' ? update(currentState.persistence) : update
    const normalizedWorkspace = normalizeWorkspace(nextValue)

    persistWorkspace(normalizedWorkspace)
    set(workspaceStateAtomBase, {
      persistence: normalizedWorkspace,
      recoveryMessages: currentState.recoveryMessages,
    })
  },
)

const baseIngredientsStateAtomBase = atom<BaseIngredientsState>({
  status: 'loading',
})

baseIngredientsStateAtomBase.onMount = (setBaseIngredientsState) => {
  let isActive = true

  void loadBaseIngredients()
    .then((ingredients) => {
      if (!isActive) {
        return
      }

      setBaseIngredientsState({
        status: 'ready',
        ingredients,
      })
    })
    .catch((error) => {
      if (!isActive) {
        return
      }

      setBaseIngredientsState({
        status: 'error',
        message: getErrorMessage(error),
      })
    })

  return () => {
    isActive = false
  }
}

export const baseIngredientsStateAtom = atom((get) => get(baseIngredientsStateAtomBase))

export const refreshBaseIngredientsAtom = atom(null, async (_get, set) => {
  set(baseIngredientsStateAtomBase, {
    status: 'loading',
  })

  try {
    const ingredients = await loadBaseIngredients({ force: true })

    set(baseIngredientsStateAtomBase, {
      status: 'ready',
      ingredients,
    })
  } catch (error) {
    set(baseIngredientsStateAtomBase, {
      status: 'error',
      message: getErrorMessage(error),
    })
  }
})

export const recoveryMessagesAtom = atom((get) => get(workspaceStateAtomBase).recoveryMessages)

export const dismissRecoveryMessagesAtom = atom(null, (get, set) => {
  const currentState = get(workspaceStateAtomBase)

  if (currentState.recoveryMessages.length === 0) {
    return
  }

  set(workspaceStateAtomBase, {
    ...currentState,
    recoveryMessages: [],
  })
})

export const customIngredientsAtom = atom(
  (get) => get(workspacePersistenceAtom).customIngredients,
  (get, set, update: Updater<CustomIngredient[]>) => {
    set(workspacePersistenceAtom, (currentWorkspace) => ({
      ...currentWorkspace,
      customIngredients:
        typeof update === 'function' ? update(currentWorkspace.customIngredients) : update,
    }))
  },
)

export const recipesAtom = atom(
  (get) => get(workspacePersistenceAtom).recipes,
  (get, set, update: Updater<StoredRecipe[]>) => {
    set(workspacePersistenceAtom, (currentWorkspace) => ({
      ...currentWorkspace,
      recipes: typeof update === 'function' ? update(currentWorkspace.recipes) : update,
    }))
  },
)

export const allIngredientsAtom = atom((get) => {
  const baseState = get(baseIngredientsStateAtom)
  const customIngredients = get(customIngredientsAtom)
  const baseIngredients = baseState.status === 'ready' ? baseState.ingredients : []
  const collator = new Intl.Collator('en-AU', { sensitivity: 'base', numeric: true })

  return [...baseIngredients, ...customIngredients].sort(
    (left, right) =>
      collator.compare(left.name, right.name) || collator.compare(left.id, right.id),
  )
})

export const ingredientMapAtom = atom((get) => {
  const ingredientMap = new Map<string, IngredientRecord>()

  for (const ingredient of get(allIngredientsAtom)) {
    ingredientMap.set(ingredient.id, ingredient)
  }

  return ingredientMap
})

export const hydratedRecipesAtom = atom((get) => {
  const ingredientMap = get(ingredientMapAtom)

  return get(recipesAtom).map((recipe) => hydrateRecipe(recipe, ingredientMap))
})

export const addCustomIngredientAtom = atom(
  null,
  (_get, set, input: Parameters<typeof createIngredientSchema.parse>[0]) => {
    const parsedIngredient = createIngredientSchema.parse(input)
    const timestamp = new Date().toISOString()
    const customIngredient: CustomIngredient = {
      id: `custom:${crypto.randomUUID()}`,
      name: parsedIngredient.name,
      classification: 'Custom ingredient',
      publicFoodKey: null,
      source: 'custom',
      serveUnit: 'grams',
      isBase: false,
      isAusFood: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      metrics: {
        calories: parsedIngredient.calories,
        energy: parsedIngredient.energy,
        protein: parsedIngredient.protein,
        fatTotal: parsedIngredient.fatTotal,
        fatSaturated: parsedIngredient.fatSaturated,
        carbohydrate: parsedIngredient.carbohydrate,
        sugar: parsedIngredient.sugar,
        dietaryFibre: parsedIngredient.dietaryFibre,
        sodium: parsedIngredient.sodium,
      },
    }

    set(customIngredientsAtom, (currentIngredients) => [customIngredient, ...currentIngredients])

    return customIngredient
  },
)

export const addRecipeAtom = atom(
  null,
  (_get, set, input: Parameters<typeof createClientRecipeSchema.parse>[0]) => {
    const parsedRecipe = createClientRecipeSchema.parse(input)
    const timestamp = new Date().toISOString()
    const recipe: StoredRecipe = {
      id: `recipe:${crypto.randomUUID()}`,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...parsedRecipe,
    }

    set(recipesAtom, (currentRecipes) => [recipe, ...currentRecipes])

    return recipe
  },
)

export const deleteRecipeAtom = atom(null, (_get, set, recipeId: string) => {
  set(recipesAtom, (currentRecipes) =>
    currentRecipes.filter((recipe) => recipe.id !== recipeId),
  )
})

function hydrateRecipe(
  recipe: StoredRecipe,
  ingredientMap: Map<string, IngredientRecord>,
): HydratedRecipe {
  const resolvedIngredients: HydratedRecipeIngredient[] = []
  const missingIngredientIds: string[] = []

  for (const recipeIngredient of recipe.ingredients) {
    const ingredient = ingredientMap.get(recipeIngredient.ingredientId)

    if (!ingredient) {
      missingIngredientIds.push(recipeIngredient.ingredientId)
      continue
    }

    resolvedIngredients.push({
      ingredientId: ingredient.id,
      name: ingredient.name,
      quantity: recipeIngredient.quantity,
      metrics: extractNutritionMetrics(ingredient.metrics),
      source: ingredient.source,
      serveUnit: ingredient.serveUnit,
    })
  }

  const servingsPerPack = recipe.serveSize > 0 ? recipe.productWeight / recipe.serveSize : 0

  return {
    ...recipe,
    resolvedIngredients,
    missingIngredientIds,
    servingsPerPack,
    panel:
      missingIngredientIds.length === 0
        ? calculateRecipeNutrition({
            ingredients: resolvedIngredients,
            outputNetWeight: recipe.outputWeight,
            productWeight: recipe.productWeight,
            serveSize: recipe.serveSize,
            servingsPerPack,
          })
        : null,
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.'
}
