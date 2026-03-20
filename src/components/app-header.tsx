import {
  RiBookletLine,
  RiDatabase2Line,
  RiFileList3Line,
  RiMoonClearLine,
  RiSunLine,
} from '@remixicon/react'

import { useTheme } from '@/components/theme-provider'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'

export function AppHeader({
  ingredientCount,
  customIngredientCount,
  recipeCount,
  baseReady,
}: {
  readonly ingredientCount: number
  readonly customIngredientCount: number
  readonly recipeCount: number
  readonly baseReady: boolean
}) {
  const { theme, setTheme } = useTheme()
  const nextTheme = theme === 'light' ? 'dark' : 'light'
  const themeLabel = nextTheme === 'dark' ? 'Dark mode' : 'Light mode'

  return (
    <header className="sticky top-4 z-40 overflow-hidden rounded-[2rem] border border-border/60 bg-card/85 shadow-2xl shadow-black/10 backdrop-blur">
      <div className="flex flex-col gap-6 px-5 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary/90 text-primary-foreground">Client-only workspace</Badge>
              <Badge variant="outline">Browser local storage</Badge>
              {baseReady ? (
                <Badge variant="secondary">CSV catalogue loaded</Badge>
              ) : (
                <Badge variant="outline">Loading CSV catalogue</Badge>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-[0.34em] text-primary/80 uppercase">
                Aus Food Label
              </p>
              <h1
                data-display
                className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl"
              >
                Build ingredients, recipes, and label-ready nutrition panels in one page.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                The base catalogue is seeded from the bundled ingredient CSVs. Custom ingredients
                and saved recipes stay in this browser, with recovery guards for malformed local
                storage.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="#ingredients"
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: 'h-10 rounded-full px-3',
              })}
            >
              <RiFileList3Line className="size-4" />
              Ingredients
            </a>
            <a
              href="#recipes"
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: 'h-10 rounded-full px-3',
              })}
            >
              <RiBookletLine className="size-4" />
              Recipes
            </a>
            <a
              href="#labels"
              className={buttonVariants({
                variant: 'default',
                size: 'sm',
                className: 'h-10 rounded-full px-3',
              })}
            >
              Produce labels
            </a>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 rounded-full px-3"
              onClick={() => setTheme(nextTheme)}
              aria-label={`Switch to ${themeLabel.toLowerCase()}`}
            >
              {nextTheme === 'dark' ? (
                <RiMoonClearLine className="size-4" />
              ) : (
                <RiSunLine className="size-4" />
              )}
              <span className="hidden sm:inline">{themeLabel}</span>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <HeaderStat
            label="All ingredients"
            value={ingredientCount.toLocaleString('en-AU')}
            description="Seed and custom records available for recipe building."
          />
          <HeaderStat
            label="Custom ingredients"
            value={customIngredientCount.toLocaleString('en-AU')}
            description="Saved in local storage on this device only."
          />
          <HeaderStat
            label="Recipes"
            value={recipeCount.toLocaleString('en-AU')}
            description="Reusable formulas with nutrition label output."
          />
        </div>

        <div className="flex items-center gap-2 rounded-[1.4rem] border border-border/60 bg-background/55 px-4 py-3 text-sm text-muted-foreground">
          <RiDatabase2Line className="size-4 shrink-0 text-primary" />
          <p>
            This rebuild has no auth, no server, and no database. Everything user-created is kept
            in browser storage.
          </p>
        </div>
      </div>
    </header>
  )
}

function HeaderStat({
  label,
  value,
  description,
}: {
  readonly label: string
  readonly value: string
  readonly description: string
}) {
  return (
    <div className="rounded-[1.5rem] border border-border/60 bg-background/55 px-4 py-4">
      <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </p>
      <p data-display className="mt-2 text-2xl font-semibold tracking-tight">
        {value}
      </p>
      <p className="mt-1.5 text-sm leading-5 text-muted-foreground">{description}</p>
    </div>
  )
}
