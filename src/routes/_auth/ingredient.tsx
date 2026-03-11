import { RiFileList3Line, RiSearch2Line } from '@remixicon/react'
import { createFileRoute } from '@tanstack/react-router'
import { startTransition, useDeferredValue, useState } from 'react'

import { AppShell } from '@/components/app-shell'
import { IngredientTable } from '@/components/ingredient-table'
import { Input } from '@/components/ui/input'
import { WsysBrand } from '@/components/wsys-brand'
import { $getIngredientTableRows } from '@/lib/ingredient/functions'
import { searchIngredientRows } from '@/lib/ingredient/search'

export const Route = createFileRoute('/_auth/ingredient')({
  loader: async () => await $getIngredientTableRows(),
  component: IngredientPage,
})

function IngredientPage() {
  const rows = Route.useLoaderData()
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const filteredRows = searchIngredientRows(rows, deferredQuery)

  return (
    <AppShell maxWidthClassName="max-w-[min(100%,112rem)]" fitViewport>
      <section className="grid min-h-0 flex-1 grid-rows-[auto_auto_minmax(0,1fr)] gap-6 overflow-hidden">
        <div className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-card/70 px-6 py-5 shadow-lg shadow-black/10 backdrop-blur-sm sm:flex-row sm:items-end sm:justify-between">
          <div>
            <WsysBrand compact product="Ingredient Directory" caption="WSYS nutrient catalogue" />
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">All imported ingredients</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Nutrient values are shown per imported serving basis from the Aus Food data files.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
            <RiFileList3Line className="size-5 text-primary" />
            <div>
              <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
                Results
              </p>
              <p className="text-lg font-semibold">
                {filteredRows.length}
                <span className="ml-2 text-sm font-medium text-muted-foreground">
                  / {rows.length}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border/70 bg-card/70 p-4 shadow-lg shadow-black/10 backdrop-blur-sm">
          <div className="relative max-w-xl">
            <RiSearch2Line className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => {
                const nextValue = event.target.value
                startTransition(() => {
                  setQuery(nextValue)
                })
              }}
              placeholder="Search by ingredient name or nutrient values"
              className="h-11 rounded-full border-border/70 bg-background/80 pr-4 pl-10"
              type="search"
            />
          </div>
        </div>

        <div className="min-h-0">
          <IngredientTable rows={filteredRows} query={deferredQuery} />
        </div>
      </section>
    </AppShell>
  )
}
