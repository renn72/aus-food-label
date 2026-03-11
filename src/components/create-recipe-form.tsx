import { RiAddLine, RiDeleteBin6Line, RiLoader4Line } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { type ComponentProps, useRef, useState } from 'react'
import { toast } from 'sonner'

import { VirtualizedCombobox } from '@/components/ui-extended/vitrualilzed-combobox'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { $createRecipe, type RecipeWorkspaceData } from '@/lib/recipe/functions'
import { formatWeightValue } from '@/lib/recipe/nutrition'

type RecipeIngredientDraft = {
  rowId: string
  ingredientId: number | null
  quantity: string
}

type CreateRecipePayload = {
  name: string
  outputNetWeight: number | null
  serveSize: number
  servingsPerPack: number
  ingredients: Array<{
    ingredientId: number
    quantity: number
  }>
}

type RecipeFormSubmitEvent = Parameters<NonNullable<ComponentProps<'form'>['onSubmit']>>[0]

export function CreateRecipeForm({
  ingredients,
}: {
  readonly ingredients: RecipeWorkspaceData['availableIngredients']
}) {
  const router = useRouter()
  const nextIngredientRowIdRef = useRef(1)
  const [name, setName] = useState('')
  const [outputNetWeight, setOutputNetWeight] = useState('')
  const [serveSize, setServeSize] = useState('100')
  const [servingsPerPack, setServingsPerPack] = useState('1')
  const [ingredientRows, setIngredientRows] = useState<RecipeIngredientDraft[]>(() => [
    createInitialIngredientRow(),
  ])

  const createIngredientRow = () => {
    const rowId = `ingredient-row-${nextIngredientRowIdRef.current}`
    nextIngredientRowIdRef.current += 1

    return {
      rowId,
      ingredientId: null,
      quantity: '100',
    } satisfies RecipeIngredientDraft
  }

  const { mutate, isPending } = useMutation({
    mutationFn: async (payload: CreateRecipePayload) => await $createRecipe({ data: payload }),
    onSuccess: async () => {
      setName('')
      setOutputNetWeight('')
      setServeSize('100')
      setServingsPerPack('1')
      nextIngredientRowIdRef.current = 1
      setIngredientRows([createInitialIngredientRow()])
      await router.invalidate()
      toast.success('Recipe created.')
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Unable to create recipe.'
      toast.error(message)
    },
  })

  const rawNetWeight = ingredientRows.reduce(
    (total, row) => total + parseMetricInput(row.quantity),
    0,
  )
  const effectiveNetWeight = outputNetWeight.trim()
    ? parseMetricInput(outputNetWeight)
    : rawNetWeight

  const handleSubmit = (event: RecipeFormSubmitEvent) => {
    event.preventDefault()

    if (isPending) {
      return
    }

    const payload = buildPayload({
      name,
      outputNetWeight,
      serveSize,
      servingsPerPack,
      ingredientRows,
    })

    if (!payload) {
      return
    }

    mutate(payload)
  }

  return (
    <Card className="border-border/70 bg-card/80 shadow-xl shadow-black/10 xl:sticky xl:top-24">
      <CardHeader className="border-b border-border/70">
        <CardTitle>Create recipe</CardTitle>
        <CardDescription>
          Build a recipe from your ingredient catalogue and generate an Australian nutrition panel.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="recipe-name">Recipe name</Label>
            <Input
              id="recipe-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Roasted vegetable soup"
              readOnly={isPending}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="recipe-output-net-weight">Output net weight (g)</Label>
              <Input
                id="recipe-output-net-weight"
                value={outputNetWeight}
                onChange={(event) => setOutputNetWeight(event.target.value)}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="Optional"
                readOnly={isPending}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="recipe-serve-size">Serve size (g)</Label>
              <Input
                id="recipe-serve-size"
                value={serveSize}
                onChange={(event) => setServeSize(event.target.value)}
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                readOnly={isPending}
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="recipe-servings-per-pack">Servings per pack</Label>
            <Input
              id="recipe-servings-per-pack"
              value={servingsPerPack}
              onChange={(event) => setServingsPerPack(event.target.value)}
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              readOnly={isPending}
              required
            />
          </div>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium">Recipe ingredients</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Quantities are entered in grams and rolled into the panel math on a per 100 g
                  basis.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() =>
                  setIngredientRows((currentRows) => [...currentRows, createIngredientRow()])
                }
                disabled={isPending}
              >
                <RiAddLine className="size-4" />
                Add ingredient
              </Button>
            </div>

            <div className="space-y-3">
              {ingredientRows.map((row, index) => (
                <div
                  key={row.rowId}
                  className="space-y-3 rounded-3xl border border-border/70 bg-background/50 p-4"
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
                      disabled={isPending || ingredientRows.length === 1}
                    >
                      <RiDeleteBin6Line className="size-4" />
                      Remove
                    </Button>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_10rem]">
                    <div className="grid gap-2">
                      <Label>Ingredient</Label>
                      <IngredientPicker
                        ingredients={ingredients}
                        value={row.ingredientId}
                        onChange={(ingredientId) =>
                          setIngredientRows((currentRows) =>
                            currentRows.map((currentRow) =>
                              currentRow.rowId === row.rowId
                                ? { ...currentRow, ingredientId }
                                : currentRow,
                            ),
                          )
                        }
                        disabled={isPending}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor={`recipe-ingredient-quantity-${row.rowId}`}>
                        Quantity (g)
                      </Label>
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
                        placeholder="100"
                        readOnly={isPending}
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="rounded-3xl border border-border/70 bg-background/60 p-4">
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Raw ingredient weight</span>
                <span className="font-medium">{formatWeightValue(rawNetWeight)} g</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Panel net weight</span>
                <span className="font-medium">{formatWeightValue(effectiveNetWeight)} g</span>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              When output net weight is left blank, the nutrition panel falls back to the summed
              ingredient weight.
            </p>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isPending}>
            {isPending && <RiLoader4Line className="size-4 animate-spin" />}
            {isPending ? 'Creating recipe...' : 'Create recipe'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function IngredientPicker({
  ingredients,
  value,
  onChange,
  disabled,
}: {
  readonly ingredients: RecipeWorkspaceData['availableIngredients']
  readonly value: number | null
  readonly onChange: (ingredientId: number | null) => void
  readonly disabled: boolean
}) {
  const selectedIngredient = ingredients.find((ingredient) => ingredient.id === value) ?? null
  const options = ingredients.map((ingredient) => ({
    value: String(ingredient.id),
    label: `${ingredient.name} ${ingredient.isAusFood ? '· AUS' : '· Custom'}`,
  }))

  return (
    <VirtualizedCombobox
      options={options}
      selectedOption={selectedIngredient ? String(selectedIngredient.id) : ''}
      onSelectOption={(ingredientId) => {
        onChange(ingredientId ? Number(ingredientId) : null)
      }}
      searchPlaceholder="Search ingredients..."
      emptyMessage="No ingredients found."
      width="100%"
      contentWidth="min(34rem, calc(100vw - 2rem))"
      height="22rem"
      disabled={disabled}
      triggerClassName="w-full justify-between rounded-2xl px-3 font-normal"
    />
  )
}

function buildPayload({
  name,
  outputNetWeight,
  serveSize,
  servingsPerPack,
  ingredientRows,
}: {
  name: string
  outputNetWeight: string
  serveSize: string
  servingsPerPack: string
  ingredientRows: RecipeIngredientDraft[]
}): CreateRecipePayload | null {
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

  const parsedServeSize = parseMetricInput(serveSize)
  const parsedServingsPerPack = parseMetricInput(servingsPerPack)

  if (parsedServeSize <= 0 || parsedServingsPerPack <= 0) {
    toast.error('Serve size and servings per pack must both be greater than zero.')
    return null
  }

  const parsedOutputNetWeight = outputNetWeight.trim() ? parseMetricInput(outputNetWeight) : null

  if (parsedOutputNetWeight !== null && parsedOutputNetWeight <= 0) {
    toast.error('Output net weight must be greater than zero when provided.')
    return null
  }

  return {
    name: trimmedName,
    outputNetWeight: parsedOutputNetWeight,
    serveSize: parsedServeSize,
    servingsPerPack: parsedServingsPerPack,
    ingredients: recipeIngredients.map((ingredient) => ({
      ingredientId: ingredient.ingredientId as number,
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
