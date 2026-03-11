import { RiAddLine, RiLoader4Line } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { $createIngredient } from '@/lib/ingredient/functions'
import {
  ingredientMetricFields,
  type IngredientMetricFieldKey,
} from '@/lib/ingredient/validation'

type FormSubmitEvent = Parameters<NonNullable<React.ComponentProps<'form'>['onSubmit']>>[0]
type CreateIngredientPayload = { name: string } & Record<IngredientMetricFieldKey, string>

export function CreateIngredientSheet() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement | null>(null)
  const [open, setOpen] = useState(false)

  const { mutate, isPending } = useMutation({
    mutationFn: async (payload: CreateIngredientPayload) => await $createIngredient({ data: payload }),
    onSuccess: async () => {
      formRef.current?.reset()
      setOpen(false)
      await router.invalidate()
      toast.success('Ingredient created.')
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Unable to create ingredient.'
      toast.error(message)
    },
  })

  const handleSubmit = (event: FormSubmitEvent) => {
    event.preventDefault()

    if (isPending) {
      return
    }

    const formData = new FormData(event.currentTarget)
    const payload = {
      name: getFormValue(formData, 'name'),
      calories: getFormValue(formData, 'calories'),
      energy: getFormValue(formData, 'energy'),
      protein: getFormValue(formData, 'protein'),
      fatTotal: getFormValue(formData, 'fatTotal'),
      fatSaturated: getFormValue(formData, 'fatSaturated'),
      carbohydrate: getFormValue(formData, 'carbohydrate'),
      sugar: getFormValue(formData, 'sugar'),
      dietaryFibre: getFormValue(formData, 'dietaryFibre'),
      sodium: getFormValue(formData, 'sodium'),
    } satisfies CreateIngredientPayload

    mutate(payload)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button className="h-11 rounded-full px-4" type="button">
            <RiAddLine className="size-4" />
            New ingredient
          </Button>
        }
      />

      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader className="border-b border-border/70 px-6 py-5">
          <SheetTitle>Create ingredient</SheetTitle>
          <SheetDescription>
            Save a custom ingredient on a per 100 g basis. New ingredients default to non-Aus Food
            and stay scoped to your account.
          </SheetDescription>
        </SheetHeader>

        <form ref={formRef} className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
            <div className="grid gap-2">
              <Label htmlFor="ingredient-name">Name</Label>
              <Input
                id="ingredient-name"
                name="name"
                placeholder="Custom ingredient name"
                readOnly={isPending}
                required
              />
            </div>

            <section className="space-y-4">
              <div>
                <h2 className="text-sm font-medium">Nutrients per 100 g</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Only the values currently shown on the ingredient directory are required here.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {ingredientMetricFields.map((field) => (
                  <div key={field.key} className="grid gap-2">
                    <Label htmlFor={`ingredient-${field.key}`}>
                      {field.label}
                      <span className="ml-1 text-xs text-muted-foreground">{field.unit}</span>
                    </Label>
                    <Input
                      id={`ingredient-${field.key}`}
                      name={field.key}
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder={`0.00 ${field.unit}`}
                      readOnly={isPending}
                      required
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>

          <SheetFooter className="border-t border-border/70 bg-background/80 px-6 py-4">
            <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
              {isPending && <RiLoader4Line className="size-4 animate-spin" />}
              {isPending ? 'Creating...' : 'Create ingredient'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function getFormValue(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName)
  return typeof value === 'string' ? value : ''
}
