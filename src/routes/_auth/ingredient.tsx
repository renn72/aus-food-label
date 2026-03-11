import { RiFileList3Line } from '@remixicon/react'
import { createFileRoute } from '@tanstack/react-router'

import { AppShell } from '@/components/app-shell'
import { IngredientTable } from '@/components/ingredient-table'
import { $getIngredientTableRows } from '@/lib/ingredient/functions'

export const Route = createFileRoute('/_auth/ingredient')({
  loader: async () => await $getIngredientTableRows(),
  component: IngredientPage,
})

function IngredientPage() {
  const rows = Route.useLoaderData()

  return (
    <AppShell>
      <section className="grid gap-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-card/70 px-6 py-5 shadow-lg shadow-black/10 backdrop-blur-sm sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.35em] text-primary/80 uppercase">
              Ingredient Directory
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">All imported ingredients</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Nutrient values are shown per imported serving basis from the Aus Food data files.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
            <RiFileList3Line className="size-5 text-primary" />
            <div>
              <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
                Rows
              </p>
              <p className="text-lg font-semibold">{rows.length}</p>
            </div>
          </div>
        </div>

        <IngredientTable rows={rows} />
      </section>
    </AppShell>
  )
}
