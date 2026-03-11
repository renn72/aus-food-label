import { RiBookletLine, RiFileList3Line } from '@remixicon/react'
import { createFileRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { AppShell } from '@/components/app-shell'
import { CreateRecipeForm } from '@/components/create-recipe-form'
import { RecipeNutritionPanel } from '@/components/recipe-nutrition-panel'
import { WsysBrand } from '@/components/wsys-brand'
import { $getRecipeWorkspaceData } from '@/lib/recipe/functions'

export const Route = createFileRoute('/_auth/recipe')({
  loader: async () => await $getRecipeWorkspaceData(),
  component: RecipePage,
})

function RecipePage() {
  const { availableIngredients, recipes } = Route.useLoaderData()

  return (
    <AppShell maxWidthClassName="max-w-[min(100%,112rem)]">
      <section className="grid gap-6">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-border/70 bg-card/70 px-6 py-5 shadow-lg shadow-black/10 backdrop-blur-sm lg:flex-row lg:items-end lg:justify-between">
          <div>
            <WsysBrand compact product="Recipe Panels" caption="WSYS Australian nutrition output" />
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Recipe builder and nutrition panels</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Combine ingredients into recipes, capture processed net weight, and generate
              quantity-per-serve and quantity-per-100 g Australian nutrition panels.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryStat
              icon={<RiBookletLine className="size-5 text-primary" />}
              label="Recipes"
              value={String(recipes.length)}
            />
            <SummaryStat
              icon={<RiFileList3Line className="size-5 text-primary" />}
              label="Available ingredients"
              value={String(availableIngredients.length)}
            />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[28rem_minmax(0,1fr)] xl:items-start">
          <CreateRecipeForm ingredients={availableIngredients} />

          <div className="grid gap-6">
            {recipes.length > 0 ? (
              recipes.map((recipe) => <RecipeNutritionPanel key={recipe.id} recipe={recipe} />)
            ) : (
              <div className="rounded-[2rem] border border-border/70 bg-card/70 px-6 py-10 text-center shadow-lg shadow-black/10">
                <p className="text-sm font-medium tracking-[0.18em] text-muted-foreground uppercase">
                  No recipes yet
                </p>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                  Create your first recipe to generate a nutrition panel.
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  The panel output appears here after you add ingredients, serve size, and optional
                  post-cook net weight.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  )
}

function SummaryStat({
  icon,
  label,
  value,
}: {
  readonly icon: ReactNode
  readonly label: string
  readonly value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
      {icon}
      <div>
        <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
          {label}
        </p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </div>
  )
}
