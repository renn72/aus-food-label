import { RiSaveLine } from '@remixicon/react'
import { useSetAtom } from 'jotai'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ingredientMetricFields } from '@/lib/ingredient/validation'
import { addCustomIngredientAtom } from '@/lib/workspace/atoms'
import type { CustomIngredient } from '@/lib/workspace/types'

const initialFormState = {
  name: '',
  calories: '0',
  energy: '0',
  protein: '0',
  fatTotal: '0',
  fatSaturated: '0',
  carbohydrate: '0',
  sugar: '0',
  dietaryFibre: '0',
  sodium: '0',
}

type IngredientSubmitEvent = Parameters<NonNullable<React.ComponentProps<'form'>['onSubmit']>>[0]

export function IngredientCreator({
  customIngredients,
}: {
  readonly customIngredients: CustomIngredient[]
}) {
  const addCustomIngredient = useSetAtom(addCustomIngredientAtom)
  const [formState, setFormState] = useState(initialFormState)

  const handleSubmit = (event: IngredientSubmitEvent) => {
    event.preventDefault()

    try {
      addCustomIngredient({
        name: formState.name,
        calories: formState.calories,
        energy: formState.energy,
        protein: formState.protein,
        fatTotal: formState.fatTotal,
        fatSaturated: formState.fatSaturated,
        carbohydrate: formState.carbohydrate,
        sugar: formState.sugar,
        dietaryFibre: formState.dietaryFibre,
        sodium: formState.sodium,
      })

      setFormState(initialFormState)
      toast.success('Custom ingredient saved locally.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save ingredient.')
    }
  }

  return (
    <Card className="border-border/70 bg-card/85 shadow-xl shadow-black/10">
      <CardHeader className="border-b border-border/60">
        <CardTitle>Add custom ingredient</CardTitle>
        <CardDescription>
          Enter nutrient values per 100 g. These ingredients are stored only in this browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="custom-ingredient-name">Name</Label>
            <Input
              id="custom-ingredient-name"
              value={formState.name}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Roasted cashew crumb"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {ingredientMetricFields.map((field) => (
              <div key={field.key} className="grid gap-2">
                <Label htmlFor={`custom-ingredient-${field.key}`}>
                  {field.label}
                  <span className="ml-1 text-xs text-muted-foreground">{field.unit}</span>
                </Label>
                <Input
                  id={`custom-ingredient-${field.key}`}
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={formState[field.key]}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full">
            <RiSaveLine className="size-4" />
            Save custom ingredient
          </Button>
        </form>

        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium">Recent local ingredients</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              The latest custom entries saved in local storage.
            </p>
          </div>

          {customIngredients.length > 0 ? (
            <div className="space-y-2">
              {customIngredients.slice(0, 5).map((ingredient) => (
                <div
                  key={ingredient.id}
                  className="rounded-[1.25rem] border border-border/70 bg-background/55 px-3 py-3"
                >
                  <p className="font-medium">{ingredient.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Energy {ingredient.metrics.energy.toLocaleString('en-AU')} kJ, Protein{' '}
                    {ingredient.metrics.protein.toLocaleString('en-AU')} g, Sodium{' '}
                    {ingredient.metrics.sodium.toLocaleString('en-AU')} mg
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.25rem] border border-dashed border-border/70 bg-background/40 px-3 py-4 text-sm text-muted-foreground">
              No custom ingredients saved yet.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
