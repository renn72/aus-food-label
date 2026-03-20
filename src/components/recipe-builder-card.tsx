import { RiAddLine, RiDeleteBin6Line, RiSaveLine } from '@remixicon/react'
import { useSetAtom } from 'jotai'
import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { VirtualizedCombobox } from '@/components/ui-extended/vitrualilzed-combobox'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addRecipeAtom } from '@/lib/workspace/atoms'
import type { IngredientRecord } from '@/lib/workspace/types'
import { formatWeightValue } from '@/lib/recipe/nutrition'

type RecipeIngredientDraft = {
  rowId: string
  ingredientId: string | null
  quantity: string
}

type RecipeBuilderPayload = {
  name: string
  outputWeight: number
  productWeight: number
  serveSize: number
  ingredients: Array<{
    ingredientId: string
    quantity: number
  }>
}

type RecipeSubmitEvent = Parameters<NonNullable<React.ComponentProps<'form'>['onSubmit']>>[0]

export function RecipeBuilderCard({
  ingredients,
  onCreated,
}: {
  readonly ingredients: IngredientRecord[]
  readonly onCreated: (recipeId: string) => void
}) {
  const addRecipe = useSetAtom(addRecipeAtom)
  const nextIngredientRowIdRef = useRef(1)
  const [name, setName] = useState('')
  const [outputWeight, setOutputWeight] = useState('100')
  const [productWeight, setProductWeight] = useState('100')
  const [serveSize, setServeSize] = useState('100')
  const [ingredientRows, setIngredientRows] = useState<RecipeIngredientDraft[]>([
    createInitialIngredientRow(),
  ])

  const ingredientOptions = useMemo(
    () =>
      ingredients.map((ingredient) => ({
        value: ingredient.id,
        label: `${ingredient.name} ${
          ingredient.source === 'custom'
            ? '· Custom'
            : ingredient.source === 'seed-solid'
              ? '· CSV solid'
              : '· CSV liquid'
        }`,
      })),
    [ingredients],
  )

  const rawNetWeight = ingredientRows.reduce(
    (total, row) => total + parseMetricInput(row.quantity),
    0,
  )
  const parsedOutputWeight = parseMetricInput(outputWeight)
  const parsedProductWeight = parseMetricInput(productWeight)
  const parsedServeSize = parseMetricInput(serveSize)
  const effectiveOutputYieldPercentage =
    rawNetWeight > 0 ? (parsedOutputWeight / rawNetWeight) * 100 : 0
  const effectiveServingsPerPack =
    parsedProductWeight > 0 && parsedServeSize > 0 ? parsedProductWeight / parsedServeSize : 0

  const handleSubmit = (event: RecipeSubmitEvent) => {
    event.preventDefault()

    const payload = buildPayload({
      name,
      outputWeight,
      productWeight,
      serveSize,
      ingredientRows,
    })

    if (!payload) {
      return
    }

    try {
      const recipe = addRecipe(payload)
      setName('')
      setOutputWeight('100')
      setProductWeight('100')
      setServeSize('100')
      nextIngredientRowIdRef.current = 1
      setIngredientRows([createInitialIngredientRow()])
      onCreated(recipe.id)
      toast.success('Recipe saved locally.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save recipe.')
    }
  }

  const createIngredientRow = () => {
    const rowId = `ingredient-row-${nextIngredientRowIdRef.current}`
    nextIngredientRowIdRef.current += 1

    return {
      rowId,
      ingredientId: null,
      quantity: '100',
    } satisfies RecipeIngredientDraft
  }

  return (
    <Card className="border-border/70 bg-card/85 shadow-xl shadow-black/10">
      <CardHeader className="border-b border-border/60">
        <CardTitle>Create recipe</CardTitle>
        <CardDescription>
          Build a recipe from the available ingredient catalogue and save it locally for label
          generation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="recipe-name">Recipe name</Label>
            <Input
              id="recipe-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Tomato chutney"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <MetricField
              id="recipe-output-weight"
              label="Output weight (g)"
              value={outputWeight}
              onChange={setOutputWeight}
            />
            <MetricField
              id="recipe-product-weight"
              label="Product weight (g)"
              value={productWeight}
              onChange={setProductWeight}
            />
            <MetricField
              id="recipe-serve-size"
              label="Serve size (g)"
              value={serveSize}
              onChange={setServeSize}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium">Recipe ingredients</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ingredient quantities are entered in grams.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => setIngredientRows((currentRows) => [...currentRows, createIngredientRow()])}
              >
                <RiAddLine className="size-4" />
                Add row
              </Button>
            </div>

            <div className="space-y-3">
              {ingredientRows.map((row, index) => (
                <div
                  key={row.rowId}
                  className="space-y-3 rounded-[1.5rem] border border-border/70 bg-background/55 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">Ingredient {index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-full"
                      onClick={() =>
                        setIngredientRows((currentRows) =>
                          currentRows.length === 1
                            ? currentRows
                            : currentRows.filter((currentRow) => currentRow.rowId !== row.rowId),
                        )
                      }
                      disabled={ingredientRows.length === 1}
                    >
                      <RiDeleteBin6Line className="size-4" />
                      Remove
                    </Button>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_10rem]">
                    <div className="grid gap-2">
                      <Label>Ingredient</Label>
                      <VirtualizedCombobox
                        options={ingredientOptions}
                        selectedOption={row.ingredientId ?? ''}
                        onSelectOption={(ingredientId) =>
                          setIngredientRows((currentRows) =>
                            currentRows.map((currentRow) =>
                              currentRow.rowId === row.rowId
                                ? { ...currentRow, ingredientId: ingredientId || null }
                                : currentRow,
                            ),
                          )
                        }
                        searchPlaceholder="Search ingredients..."
                        emptyMessage="No ingredients found."
                        width="100%"
                        contentWidth="min(34rem, calc(100vw - 2rem))"
                        height="20rem"
                        triggerClassName="w-full justify-between rounded-2xl px-3 font-normal"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor={`recipe-ingredient-quantity-${row.rowId}`}>Quantity (g)</Label>
                      <Input
                        id={`recipe-ingredient-quantity-${row.rowId}`}
                        value={row.quantity}
                        onChange={(event) =>
                          setIngredientRows((currentRows) =>
                            currentRows.map((currentRow) =>
                              currentRow.rowId === row.rowId
                                ? { ...currentRow, quantity: event.target.value }
                                : currentRow,
                            ),
                          )
                        }
                        type="number"
                        min="0.01"
                        step="0.01"
                        inputMode="decimal"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border/70 bg-background/55 p-4">
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <DerivedMetric label="Raw ingredient weight" value={`${formatWeightValue(rawNetWeight)} g`} />
              <DerivedMetric label="Output weight" value={`${formatWeightValue(parsedOutputWeight)} g`} />
              <DerivedMetric label="Product weight" value={`${formatWeightValue(parsedProductWeight)} g`} />
              <DerivedMetric label="Serve size" value={`${formatWeightValue(parsedServeSize)} g`} />
              <DerivedMetric
                label="Servings per package"
                value={formatWeightValue(effectiveServingsPerPack)}
              />
              <DerivedMetric
                label="Derived yield"
                value={`${formatWeightValue(effectiveOutputYieldPercentage)}%`}
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            <RiSaveLine className="size-4" />
            Save recipe
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function MetricField({
  id,
  label,
  value,
  onChange,
}: {
  readonly id: string
  readonly label: string
  readonly value: string
  readonly onChange: (nextValue: string) => void
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min="0.01"
        step="0.01"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

function DerivedMetric({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function buildPayload({
  name,
  outputWeight,
  productWeight,
  serveSize,
  ingredientRows,
}: {
  name: string
  outputWeight: string
  productWeight: string
  serveSize: string
  ingredientRows: RecipeIngredientDraft[]
}): RecipeBuilderPayload | null {
  const trimmedName = name.trim()

  if (!trimmedName) {
    toast.error('Recipe name is required.')
    return null
  }

  const recipeIngredients = ingredientRows.map((row) => ({
    ingredientId: row.ingredientId,
    quantity: parseMetricInput(row.quantity),
  }))

  if (recipeIngredients.some((ingredient) => ingredient.ingredientId === null)) {
    toast.error('Select an ingredient for every recipe row.')
    return null
  }

  if (recipeIngredients.some((ingredient) => ingredient.quantity <= 0)) {
    toast.error('Each ingredient quantity must be greater than zero.')
    return null
  }

  const uniqueIngredientIds = new Set(
    recipeIngredients.map((ingredient) => ingredient.ingredientId),
  )

  if (uniqueIngredientIds.size !== recipeIngredients.length) {
    toast.error('Each ingredient can only appear once per recipe.')
    return null
  }

  const parsedOutputWeight = parseMetricInput(outputWeight)
  const parsedProductWeight = parseMetricInput(productWeight)
  const parsedServeSize = parseMetricInput(serveSize)

  if (parsedOutputWeight <= 0) {
    toast.error('Output weight must be greater than zero.')
    return null
  }

  if (parsedProductWeight <= 0 || parsedServeSize <= 0) {
    toast.error('Product weight and serve size must both be greater than zero.')
    return null
  }

  if (parsedProductWeight < parsedServeSize) {
    toast.error('Product weight must be greater than or equal to serve size.')
    return null
  }

  return {
    name: trimmedName,
    outputWeight: parsedOutputWeight,
    productWeight: parsedProductWeight,
    serveSize: parsedServeSize,
    ingredients: recipeIngredients.map((ingredient) => ({
      ingredientId: ingredient.ingredientId as string,
      quantity: ingredient.quantity,
    })),
  }
}

function createInitialIngredientRow(): RecipeIngredientDraft {
  return {
    rowId: 'ingredient-row-0',
    ingredientId: null,
    quantity: '100',
  }
}

function parseMetricInput(value: string) {
  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) ? parsedValue : 0
}
