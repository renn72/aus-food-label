import type { CustomIngredient, StoredRecipe, WorkspacePersistence } from '@/lib/workspace/types'
import { customIngredientSchema, storedRecipeSchema } from '@/lib/workspace/schema'

export const WORKSPACE_STORAGE_KEY = 'aus-food-label.workspace.v1'
export const WORKSPACE_STORAGE_VERSION = 1 as const

export const defaultWorkspacePersistence: WorkspacePersistence = {
  version: WORKSPACE_STORAGE_VERSION,
  customIngredients: [],
  recipes: [],
}

type LoadWorkspaceResult = {
  workspace: WorkspacePersistence
  recoveryMessages: string[]
  recovered: boolean
}

export function loadPersistedWorkspace(): LoadWorkspaceResult {
  if (!canUseLocalStorage()) {
    return {
      workspace: defaultWorkspacePersistence,
      recoveryMessages: [],
      recovered: false,
    }
  }

  let rawValue: string | null = null

  try {
    rawValue = window.localStorage.getItem(WORKSPACE_STORAGE_KEY)
  } catch {
    return {
      workspace: defaultWorkspacePersistence,
      recoveryMessages: ['Browser storage is unavailable in this session.'],
      recovered: false,
    }
  }

  if (!rawValue) {
    return {
      workspace: defaultWorkspacePersistence,
      recoveryMessages: [],
      recovered: false,
    }
  }

  let parsedValue: unknown

  try {
    parsedValue = JSON.parse(rawValue)
  } catch {
    return {
      workspace: defaultWorkspacePersistence,
      recoveryMessages: ['Saved local data was unreadable and has been reset.'],
      recovered: true,
    }
  }

  if (!isRecord(parsedValue)) {
    return {
      workspace: defaultWorkspacePersistence,
      recoveryMessages: ['Saved local data had an unexpected shape and has been reset.'],
      recovered: true,
    }
  }

  const recoveryMessages: string[] = []

  if (parsedValue.version !== WORKSPACE_STORAGE_VERSION) {
    recoveryMessages.push('Saved local data was normalized to the current app version.')
  }

  const customIngredients = sanitizeCustomIngredients(parsedValue.customIngredients, recoveryMessages)
  const recipes = sanitizeRecipes(parsedValue.recipes, recoveryMessages)

  const workspace = normalizeWorkspace({
    version: WORKSPACE_STORAGE_VERSION,
    customIngredients,
    recipes,
  })

  return {
    workspace,
    recoveryMessages,
    recovered: recoveryMessages.length > 0,
  }
}

export function persistWorkspace(workspace: WorkspacePersistence) {
  if (!canUseLocalStorage()) {
    return
  }

  try {
    window.localStorage.setItem(
      WORKSPACE_STORAGE_KEY,
      JSON.stringify(normalizeWorkspace(workspace)),
    )
  } catch (error) {
    console.warn('Unable to persist workspace data.', error)
  }
}

export function normalizeWorkspace(workspace: WorkspacePersistence): WorkspacePersistence {
  return {
    version: WORKSPACE_STORAGE_VERSION,
    customIngredients: [...workspace.customIngredients].sort(sortByUpdatedAtDescending),
    recipes: [...workspace.recipes].sort(sortByUpdatedAtDescending),
  }
}

function sanitizeCustomIngredients(value: unknown, recoveryMessages: string[]) {
  if (value === undefined || value === null) {
    return []
  }

  if (!Array.isArray(value)) {
    recoveryMessages.push('Custom ingredients were reset because the saved data was malformed.')
    return []
  }

  const ingredients: CustomIngredient[] = []
  const seenIds = new Set<string>()
  let droppedEntries = 0

  for (const candidate of value) {
    const parsedIngredient = customIngredientSchema.safeParse(candidate)

    if (!parsedIngredient.success) {
      droppedEntries += 1
      continue
    }

    if (seenIds.has(parsedIngredient.data.id)) {
      droppedEntries += 1
      continue
    }

    seenIds.add(parsedIngredient.data.id)
    ingredients.push(parsedIngredient.data)
  }

  if (droppedEntries > 0) {
    recoveryMessages.push(
      `Custom ingredients were repaired and ${droppedEntries} invalid entr${droppedEntries === 1 ? 'y was' : 'ies were'} removed.`,
    )
  }

  return ingredients
}

function sanitizeRecipes(value: unknown, recoveryMessages: string[]) {
  if (value === undefined || value === null) {
    return []
  }

  if (!Array.isArray(value)) {
    recoveryMessages.push('Recipes were reset because the saved data was malformed.')
    return []
  }

  const recipes: StoredRecipe[] = []
  const seenIds = new Set<string>()
  let droppedEntries = 0

  for (const candidate of value) {
    const parsedRecipe = storedRecipeSchema.safeParse(candidate)

    if (!parsedRecipe.success) {
      droppedEntries += 1
      continue
    }

    if (seenIds.has(parsedRecipe.data.id)) {
      droppedEntries += 1
      continue
    }

    seenIds.add(parsedRecipe.data.id)
    recipes.push(parsedRecipe.data)
  }

  if (droppedEntries > 0) {
    recoveryMessages.push(
      `Recipes were repaired and ${droppedEntries} invalid entr${droppedEntries === 1 ? 'y was' : 'ies were'} removed.`,
    )
  }

  return recipes
}

function sortByUpdatedAtDescending<T extends { updatedAt: string }>(left: T, right: T) {
  return right.updatedAt.localeCompare(left.updatedAt)
}

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
