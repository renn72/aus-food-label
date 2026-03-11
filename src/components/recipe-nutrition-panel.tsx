import { RiRestaurantLine } from '@remixicon/react'

import { Badge } from '@/components/ui/badge'
import type { RecipeWorkspaceData } from '@/lib/recipe/functions'
import {
  formatPanelValue,
  formatWeightValue,
  nutritionPanelFields,
} from '@/lib/recipe/nutrition'

type RecipeRecord = RecipeWorkspaceData['recipes'][number]

export function RecipeNutritionPanel({ recipe }: { readonly recipe: RecipeRecord }) {
  return (
    <article className="grid gap-6 rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-xl shadow-black/10 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
              WSYS recipe
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">{recipe.name}</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Net weight {formatWeightValue(recipe.panel.netWeight)} g</Badge>
            <Badge variant="outline">Serve size {formatWeightValue(recipe.serveSize)} g</Badge>
            <Badge variant="outline">
              Servings/pack {formatWeightValue(recipe.servingsPerPack)}
            </Badge>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            label="Raw ingredient weight"
            value={`${formatWeightValue(recipe.panel.baseNetWeight)} g`}
          />
          <MetricCard label="Panel net weight" value={`${formatWeightValue(recipe.panel.netWeight)} g`} />
          <MetricCard
            label="Source"
            value={recipe.outputNetWeight === null ? 'Derived from ingredients' : 'Custom output weight'}
          />
        </div>

        <section className="rounded-3xl border border-border/70 bg-background/55 p-4">
          <div className="flex items-center gap-2">
            <RiRestaurantLine className="size-4 text-primary" />
            <h3 className="text-sm font-medium">Recipe composition</h3>
          </div>

          <div className="mt-4 space-y-2">
            {recipe.ingredients.map((ingredient) => (
              <div
                key={`${recipe.id}-${ingredient.ingredientId}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 px-3 py-2.5 text-sm"
              >
                <span className="min-w-0 truncate font-medium">{ingredient.name}</span>
                <span className="shrink-0 text-muted-foreground">
                  {formatWeightValue(ingredient.quantity)} g
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-[1.75rem] border-2 border-foreground bg-background text-foreground">
        <div className="border-b-2 border-foreground px-4 py-4">
          <p className="text-[0.68rem] font-semibold tracking-[0.25em] text-muted-foreground uppercase">
            Australian panel
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight">Nutrition Information</h3>

          <div className="mt-4 grid gap-1 text-sm">
            <PanelMetaRow label="Net weight" value={`${formatWeightValue(recipe.panel.netWeight)} g`} />
            <PanelMetaRow label="Servings per package" value={formatWeightValue(recipe.servingsPerPack)} />
            <PanelMetaRow label="Serving size" value={`${formatWeightValue(recipe.serveSize)} g`} />
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_7.75rem_7.75rem] border-b border-foreground px-4 py-2 text-[0.68rem] font-semibold tracking-[0.2em] uppercase">
          <span>Average quantity</span>
          <span className="text-right">Per serve</span>
          <span className="text-right">Per 100 g</span>
        </div>

        <div className="divide-y divide-foreground/70 px-4">
          {nutritionPanelFields.map((field) => (
            <div
              key={field.key}
              className="grid grid-cols-[minmax(0,1fr)_7.75rem_7.75rem] items-center gap-3 py-2.5 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium">{field.label}</p>
              </div>
              <p className="text-right font-medium tabular-nums">
                {formatPanelValue(field.key, recipe.panel.perServe[field.key])} {field.unit}
              </p>
              <p className="text-right font-medium tabular-nums">
                {formatPanelValue(field.key, recipe.panel.per100g[field.key])} {field.unit}
              </p>
            </div>
          ))}
        </div>
      </section>
    </article>
  )
}

function MetricCard({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/55 px-4 py-3">
      <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 text-base font-semibold">{value}</p>
    </div>
  )
}

function PanelMetaRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
