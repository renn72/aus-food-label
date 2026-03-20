import { useAtomValue, useSetAtom } from 'jotai'
import { useState } from 'react'

import { AppHeader } from '@/components/app-header'
import { AppShell } from '@/components/app-shell'
import { IngredientCreator } from '@/components/ingredient-creator'
import { IngredientDirectory } from '@/components/ingredient-directory'
import { LabelPreview } from '@/components/label-preview'
import { RecipeBuilderCard } from '@/components/recipe-builder-card'
import { RecipeList } from '@/components/recipe-list'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  allIngredientsAtom,
  baseIngredientsStateAtom,
  customIngredientsAtom,
  dismissRecoveryMessagesAtom,
  hydratedRecipesAtom,
  recoveryMessagesAtom,
  refreshBaseIngredientsAtom,
} from '@/lib/workspace/atoms'

export function App() {
  const baseIngredientsState = useAtomValue(baseIngredientsStateAtom)
  const allIngredients = useAtomValue(allIngredientsAtom)
  const customIngredients = useAtomValue(customIngredientsAtom)
  const hydratedRecipes = useAtomValue(hydratedRecipesAtom)
  const recoveryMessages = useAtomValue(recoveryMessagesAtom)
  const dismissRecoveryMessages = useSetAtom(dismissRecoveryMessagesAtom)
  const refreshBaseIngredients = useSetAtom(refreshBaseIngredientsAtom)
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
  const effectiveSelectedRecipeId =
    selectedRecipeId && hydratedRecipes.some((recipe) => recipe.id === selectedRecipeId)
      ? selectedRecipeId
      : (hydratedRecipes[0]?.id ?? null)
  const selectedRecipe =
    hydratedRecipes.find((recipe) => recipe.id === effectiveSelectedRecipeId) ?? null
  const baseIngredientCount =
    baseIngredientsState.status === 'ready' ? baseIngredientsState.ingredients.length : 0

  return (
    <AppShell>
      <AppHeader
        ingredientCount={allIngredients.length}
        customIngredientCount={customIngredients.length}
        recipeCount={hydratedRecipes.length}
        baseReady={baseIngredientsState.status === 'ready'}
      />

      {recoveryMessages.length > 0 ? (
        <Alert className="rounded-[1.75rem] border border-border/70 bg-card/85 px-5 py-4 shadow-lg shadow-black/5">
          <div />
          <AlertTitle>Recovered saved local data</AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              {recoveryMessages.map((message) => (
                <p key={message}>{message}</p>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => dismissRecoveryMessages()}
              >
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      <section id="ingredients" className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_24rem]">
        <IngredientDirectory
          ingredients={allIngredients}
          baseState={baseIngredientsState}
          onRetryLoad={() => refreshBaseIngredients()}
        />
        <div className="space-y-6">
          <IngredientCreator customIngredients={customIngredients} />
          <WorkflowNote
            title="How the catalogue works"
            body={`The app ships with ${baseIngredientCount.toLocaleString(
              'en-AU',
            )} base ingredients from the bundled CSV files. Anything you add yourself is stored separately in browser local storage.`}
          />
        </div>
      </section>

      <section id="recipes" className="grid gap-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
        <RecipeBuilderCard
          ingredients={allIngredients}
          onCreated={(recipeId) => setSelectedRecipeId(recipeId)}
        />
        <RecipeList
          recipes={hydratedRecipes}
          selectedRecipeId={effectiveSelectedRecipeId}
          onSelectRecipe={(recipeId) => {
            setSelectedRecipeId(recipeId)
            document.getElementById('labels')?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            })
          }}
        />
      </section>

      <section id="labels">
        <LabelPreview recipe={selectedRecipe} />
      </section>
    </AppShell>
  )
}

function WorkflowNote({
  title,
  body,
}: {
  readonly title: string
  readonly body: string
}) {
  return (
    <div className="rounded-[1.75rem] border border-border/70 bg-card/85 px-5 py-5 shadow-lg shadow-black/5">
      <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
        {title}
      </p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  )
}
