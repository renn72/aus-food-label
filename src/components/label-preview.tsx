import { RiFileCopyLine, RiFileWarningLine } from '@remixicon/react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { HydratedRecipe } from '@/lib/workspace/types'
import {
  buildNutritionPanelCopyText,
  formatDailyIntakeValue,
  formatPanelValue,
  formatWeightValue,
  nutritionPanelFields,
} from '@/lib/recipe/nutrition'

export function LabelPreview({
  recipe,
}: {
  readonly recipe: HydratedRecipe | null
}) {
  const handleCopy = async () => {
    if (!recipe?.panel) {
      return
    }

    try {
      await navigator.clipboard.writeText(
        buildNutritionPanelCopyText({
          recipeName: recipe.name,
          panel: recipe.panel,
        }),
      )
      toast.success('Nutrition panel copied to the clipboard.')
    } catch {
      toast.error('Unable to copy the nutrition panel.')
    }
  }

  return (
    <Card className="border-border/70 bg-card/85 shadow-xl shadow-black/10">
      <CardHeader className="border-b border-border/60">
        <CardTitle>Label preview</CardTitle>
        <CardDescription>
          Produce a single nutrition panel from any saved recipe without leaving the page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <Alert className="rounded-[1.5rem] border-amber-500/30 bg-amber-500/10 text-foreground">
          <RiFileWarningLine className="size-4 text-amber-400" />
          <AlertTitle>Disclaimer</AlertTitle>
          <AlertDescription>
            We do not guarantee this label. Verify all values, ingredient inputs, and regulatory
            requirements before use. User beware.
          </AlertDescription>
        </Alert>

        {recipe ? (
          recipe.panel ? (
            <LabelPreviewContent recipe={recipe} panel={recipe.panel} onCopy={handleCopy} />
          ) : (
            <div className="rounded-[1.5rem] border border-destructive/30 bg-destructive/5 px-4 py-6">
              <p className="font-medium text-foreground">
                "{recipe.name}" is missing one or more ingredients and cannot produce a label.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Check the recipe ingredients and recreate the recipe once the missing ingredient data
                is available again.
              </p>
            </div>
          )
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-background/40 px-4 py-10 text-center text-muted-foreground">
            Select a saved recipe to produce its label preview.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function LabelPreviewContent({
  recipe,
  panel,
  onCopy,
}: {
  readonly recipe: HydratedRecipe
  readonly panel: NonNullable<HydratedRecipe['panel']>
  readonly onCopy: () => void
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,27rem)]">
              <div className="space-y-5">
                <div className="rounded-[1.5rem] border border-border/70 bg-background/55 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                        Selected recipe
                      </p>
                      <h3 data-display className="mt-2 text-2xl font-semibold tracking-tight">
                        {recipe.name}
                      </h3>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={onCopy}
                    >
                      <RiFileCopyLine className="size-4" />
                      Copy label text
                    </Button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="outline">
                      Output {formatWeightValue(panel.outputWeight)} g
                    </Badge>
                    <Badge variant="outline">
                      Product {formatWeightValue(panel.productWeight)} g
                    </Badge>
                    <Badge variant="outline">
                      Serve {formatWeightValue(recipe.serveSize)} g
                    </Badge>
                    <Badge variant="outline">
                      Servings/pack {formatWeightValue(panel.servingsPerPack)}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Raw ingredient weight"
                    value={`${formatWeightValue(panel.baseNetWeight)} g`}
                  />
                  <MetricCard
                    label="Output weight"
                    value={`${formatWeightValue(panel.outputWeight)} g`}
                  />
                  <MetricCard
                    label="Product weight"
                    value={`${formatWeightValue(panel.productWeight)} g`}
                  />
                  <MetricCard
                    label="Output yield"
                    value={`${formatWeightValue(panel.yieldPercentage)}%`}
                  />
                </div>

                <div className="rounded-[1.5rem] border border-border/70 bg-background/55 p-4">
                  <h4 className="text-sm font-medium">Recipe composition</h4>
                  <div className="mt-4 space-y-2">
                    {recipe.resolvedIngredients.map((ingredient) => (
                      <div
                        key={`${recipe.id}-${ingredient.ingredientId}`}
                        className="flex items-center justify-between gap-3 rounded-[1rem] border border-border/60 bg-background/60 px-3 py-2.5 text-sm"
                      >
                        <span className="min-w-0 truncate font-medium">{ingredient.name}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {formatWeightValue(ingredient.quantity)} g
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <section className="min-w-0 rounded-[1.75rem] border-2 border-foreground bg-background text-foreground">
                <div className="border-b-2 border-foreground px-4 py-4">
                  <p className="text-[0.68rem] font-semibold tracking-[0.25em] text-muted-foreground uppercase">
                    Australian panel
                  </p>
                  <h4 data-display className="mt-2 text-2xl font-semibold tracking-tight">
                    Nutrition Information
                  </h4>

                  <div className="mt-4 grid gap-1 text-sm">
                    <PanelMetaRow
                      label="Net weight"
                      value={`${formatWeightValue(panel.productWeight)} g`}
                    />
                    <PanelMetaRow
                      label="Servings per package"
                      value={formatWeightValue(panel.servingsPerPack)}
                    />
                    <PanelMetaRow
                      label="Serving size"
                      value={`${formatWeightValue(recipe.serveSize)} g`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.95fr)_minmax(0,0.8fr)] gap-2 border-b border-foreground px-4 py-2 text-[0.62rem] font-semibold tracking-[0.16em] uppercase sm:text-[0.68rem]">
                  <span className="min-w-0">Average quantity</span>
                  <span className="min-w-0 text-right">Per serve</span>
                  <span className="min-w-0 text-right">
                    % Daily intake
                    <span className="block tracking-normal normal-case">(per serve)</span>
                  </span>
                  <span className="min-w-0 text-right">Per 100 g</span>
                </div>

                <div className="divide-y divide-foreground/70 px-4">
                  {nutritionPanelFields.map((field) => (
                    <div
                      key={field.key}
                      className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.95fr)_minmax(0,0.8fr)] items-center gap-2 py-2.5 text-xs sm:text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{field.label}</p>
                      </div>
                      <p className="min-w-0 text-right font-medium tabular-nums">
                        {formatPanelValue(field.key, panel.perServe[field.key])} {field.unit}
                      </p>
                      <p className="min-w-0 text-right font-medium tabular-nums">
                        {formatDailyIntakeValue(panel.dailyIntakePerServe[field.key])}
                      </p>
                      <p className="min-w-0 text-right font-medium tabular-nums">
                        {formatPanelValue(field.key, panel.per100g[field.key])} {field.unit}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-foreground/70 px-4 py-3 text-[0.68rem] leading-5 text-muted-foreground">
                  Daily intake targets used: Energy 8700 kJ, Protein 50 g, Fat 70 g,
                  Carbohydrate 310 g, Sugars 90 g, Dietary fibre 30 g, Sodium 2.3 g.
                </div>
              </section>
    </div>
  )
}

function MetricCard({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-background/55 px-4 py-3">
      <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </p>
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
