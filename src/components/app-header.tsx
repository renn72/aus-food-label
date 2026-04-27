import {
  RiBookletLine,
  RiDatabase2Line,
  RiFileList3Line,
  RiMoonClearLine,
  RiSunLine,
} from "@remixicon/react";

import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";

export function AppHeader({
  ingredientCount,
  customIngredientCount,
  recipeCount,
  baseReady,
}: {
  readonly ingredientCount: number;
  readonly customIngredientCount: number;
  readonly recipeCount: number;
  readonly baseReady: boolean;
}) {
  const { theme, setTheme } = useTheme();
  const nextTheme = theme === "light" ? "dark" : "light";
  const themeLabel = nextTheme === "dark" ? "Dark mode" : "Light mode";

  return (
    <header className="overflow-hidden z-40 border shadow-2xl rounded-[2rem] border-border/60 bg-card/85 shadow-black/10 backdrop-blur">
      <div className="flex flex-col gap-6 py-5 px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-start">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap gap-2 items-center">
              <Badge className="bg-primary/90 text-primary-foreground">
                Client-only workspace
              </Badge>
              {baseReady ? (
                <Badge variant="secondary">CSV catalogue loaded</Badge>
              ) : (
                <Badge variant="outline">Loading CSV catalogue</Badge>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-primary/80">
                Aus Food Label
              </p>
              <h1
                data-display
                className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl"
              >
                Build ingredients, recipes, and label-ready nutrition panels in
                one page.
              </h1>
              <p className="max-w-2xl text-sm leading-6 sm:text-base text-muted-foreground">
                The base catalogue is seeded from the bundled ingredient CSVs.
                Custom ingredients and saved recipes stay in this browser, with
                recovery guards for malformed local storage.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <a
              href="#ingredients"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "h-10 rounded-full px-3",
              })}
            >
              <RiFileList3Line className="size-4" />
              Ingredients
            </a>
            <a
              href="#recipes"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "h-10 rounded-full px-3",
              })}
            >
              <RiBookletLine className="size-4" />
              Recipes
            </a>
            <a
              href="#labels"
              className={buttonVariants({
                variant: "default",
                size: "sm",
                className: "h-10 rounded-full px-3",
              })}
            >
              Produce labels
            </a>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="px-3 h-10 rounded-full"
              onClick={() => setTheme(nextTheme)}
              aria-label={`Switch to ${themeLabel.toLowerCase()}`}
            >
              {nextTheme === "dark" ? (
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
            value={ingredientCount.toLocaleString("en-AU")}
            description="Seed and custom records available for recipe building."
          />
          <HeaderStat
            label="Custom ingredients"
            value={customIngredientCount.toLocaleString("en-AU")}
            description="Saved in local storage on this device only."
          />
          <HeaderStat
            label="Recipes"
            value={recipeCount.toLocaleString("en-AU")}
            description="Reusable formulas with nutrition label output."
          />
        </div>
      </div>
    </header>
  );
}

function HeaderStat({
  label,
  value,
  description,
}: {
  readonly label: string;
  readonly value: string;
  readonly description: string;
}) {
  return (
    <div className="py-4 px-4 border rounded-[1.5rem] border-border/60 bg-background/55">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p data-display className="mt-2 text-2xl font-semibold tracking-tight">
        {value}
      </p>
      <p className="mt-1.5 text-sm leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
