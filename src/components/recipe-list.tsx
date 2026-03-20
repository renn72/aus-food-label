import { RiArrowRightLine, RiDeleteBin6Line } from '@remixicon/react'
import { useSetAtom } from 'jotai'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { deleteRecipeAtom } from '@/lib/workspace/atoms'
import type { HydratedRecipe } from '@/lib/workspace/types'
import { formatWeightValue } from '@/lib/recipe/nutrition'

export function RecipeList({
  recipes,
  selectedRecipeId,
  onSelectRecipe,
}: {
  readonly recipes: HydratedRecipe[]
  readonly selectedRecipeId: string | null
  readonly onSelectRecipe: (recipeId: string) => void
}) {
  const deleteRecipe = useSetAtom(deleteRecipeAtom)

  const handleDelete = (recipe: HydratedRecipe) => {
    const confirmed = window.confirm(`Delete "${recipe.name}" from local storage?`)

    if (!confirmed) {
      return
    }

    deleteRecipe(recipe.id)
    toast.success('Recipe removed from local storage.')
  }

  return (
    <Card className="border-border/70 bg-card/85 shadow-xl shadow-black/10">
      <CardHeader className="border-b border-border/60">
        <CardTitle>Saved recipes</CardTitle>
        <CardDescription>
          Select a recipe to produce the label preview in the section below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {recipes.length > 0 ? (
          recipes.map((recipe) => {
            const isSelected = recipe.id === selectedRecipeId

            return (
              <article
                key={recipe.id}
                className="rounded-[1.5rem] border border-border/70 bg-background/55 p-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                        Local recipe
                      </p>
                      <h3 data-display className="mt-2 text-xl font-semibold tracking-tight">
                        {recipe.name}
                      </h3>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        {recipe.ingredients.length.toLocaleString('en-AU')} ingredients
                      </Badge>
                      <Badge variant="outline">
                        Product {formatWeightValue(recipe.productWeight)} g
                      </Badge>
                      <Badge variant="outline">
                        Serve {formatWeightValue(recipe.serveSize)} g
                      </Badge>
                    </div>

                    {recipe.missingIngredientIds.length > 0 ? (
                      <p className="text-sm text-destructive">
                        This recipe cannot produce a label because one or more ingredients are
                        missing.
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Ready to produce a label preview with Australian nutrition panel math.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      className="rounded-full"
                      onClick={() => onSelectRecipe(recipe.id)}
                    >
                      Produce label
                      <RiArrowRightLine className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDelete(recipe)}
                    >
                      <RiDeleteBin6Line className="size-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </article>
            )
          })
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-background/40 px-4 py-10 text-center text-muted-foreground">
            Save a recipe to produce a nutrition label preview.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
