import { RiFileList3Line } from '@remixicon/react'
import { createFileRoute } from '@tanstack/react-router'

import { AppShell } from '@/components/app-shell'
import { IngredientTable } from '@/components/ingredient-table'
import { WsysBrand } from '@/components/wsys-brand'
import { $getIngredientTableRows } from '@/lib/ingredient/functions'

export const Route = createFileRoute('/_auth/ingredient')({
  loader: async () => await $getIngredientTableRows(),
  component: IngredientPage,
})

function IngredientPage() {
  const rows = Route.useLoaderData()

  return (
    <AppShell maxWidthClassName="max-w-[min(100%,112rem)]" fitViewport>
      <section className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-6 overflow-hidden">
        <div className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-card/70 px-6 py-5 shadow-lg shadow-black/10 backdrop-blur-sm sm:flex-row sm:items-end sm:justify-between">
          <div>
            <WsysBrand compact product="Ingredient Directory" caption="WSYS nutrient catalogue" />
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">All available ingredients</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Search and filter now run through the shared data-table tools so filtering, sorting,
              and pagination stay in the same state path.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
            <RiFileList3Line className="size-5 text-primary" />
            <div>
              <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
                Ingredients
              </p>
              <p className="text-lg font-semibold">{rows.length}</p>
            </div>
          </div>
        </div>

        <div className="min-h-0">
          <IngredientTable rows={rows} />
        </div>
      </section>
    </AppShell>
  )
}
