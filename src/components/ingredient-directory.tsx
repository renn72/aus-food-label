import { RiRefreshLine } from '@remixicon/react'
import { useDeferredValue, useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { BaseIngredientsState, IngredientRecord } from '@/lib/workspace/types'

const sourceFilters = [
  { label: 'All sources', value: 'all' },
  { label: 'CSV seeds', value: 'base' },
  { label: 'Custom only', value: 'custom' },
  { label: 'Solid CSV', value: 'seed-solid' },
  { label: 'Liquid CSV', value: 'seed-liquid' },
] as const

const sortOptions = [
  { label: 'Name', value: 'name' },
  { label: 'Energy', value: 'energy' },
  { label: 'Protein', value: 'protein' },
  { label: 'Fat', value: 'fatTotal' },
  { label: 'Carbs', value: 'carbohydrate' },
  { label: 'Sodium', value: 'sodium' },
] as const

type SourceFilter = (typeof sourceFilters)[number]['value']
type SortOption = (typeof sortOptions)[number]['value']

export function IngredientDirectory({
  ingredients,
  baseState,
  onRetryLoad,
}: {
  readonly ingredients: IngredientRecord[]
  readonly baseState: BaseIngredientsState
  readonly onRetryLoad: () => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [pageIndex, setPageIndex] = useState(0)
  const pageSize = 25
  const deferredQuery = useDeferredValue(searchQuery)

  const filteredIngredients = useMemo(() => {
    const normalizedQuery = normalizeSearch(deferredQuery)
    const queryTokens = normalizedQuery.split(' ').filter(Boolean)
    const collator = new Intl.Collator('en-AU', { sensitivity: 'base', numeric: true })

    return ingredients
      .filter((ingredient) => matchesSourceFilter(ingredient, sourceFilter))
      .filter((ingredient) => {
        if (queryTokens.length === 0) {
          return true
        }

        const haystack = normalizeSearch([
          ingredient.name,
          ingredient.classification ?? '',
          ingredient.source,
          ingredient.serveUnit,
          ingredient.metrics.calories,
          ingredient.metrics.energy,
          ingredient.metrics.protein,
          ingredient.metrics.fatTotal,
          ingredient.metrics.fatSaturated,
          ingredient.metrics.carbohydrate,
          ingredient.metrics.sugar,
          ingredient.metrics.dietaryFibre,
          ingredient.metrics.sodium,
        ].join(' '))

        return queryTokens.every((token) => haystack.includes(token))
      })
      .sort((left, right) => compareIngredients(left, right, sortBy, collator))
  }, [deferredQuery, ingredients, sortBy, sourceFilter])

  const pageCount = Math.max(Math.ceil(filteredIngredients.length / pageSize), 1)
  const currentPage = Math.min(pageIndex, pageCount - 1)
  const pagedIngredients = filteredIngredients.slice(
    currentPage * pageSize,
    currentPage * pageSize + pageSize,
  )

  return (
    <Card className="border-border/70 bg-card/85 shadow-xl shadow-black/10">
      <CardHeader className="border-b border-border/60">
        <CardTitle>Ingredient directory</CardTitle>
        <CardDescription>
          Browse the base CSV catalogue and any custom ingredients stored in this browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem_10rem]">
            <Input
              type="search"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value)
                setPageIndex(0)
              }}
              placeholder="Search names, sources, or nutrient values"
            />
            <Select
              value={sourceFilter}
              onValueChange={(value) => {
                setSourceFilter(value as SourceFilter)
                setPageIndex(0)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sourceFilters.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={sortBy}
              onValueChange={(value) => {
                setSortBy(value as SortOption)
                setPageIndex(0)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    Sort by {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{filteredIngredients.length.toLocaleString('en-AU')} shown</Badge>
            {baseState.status === 'error' ? (
              <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={onRetryLoad}>
                <RiRefreshLine className="size-4" />
                Retry CSV load
              </Button>
            ) : null}
          </div>
        </div>

        {baseState.status === 'loading' ? (
          <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-background/55 px-4 py-5 text-sm text-muted-foreground">
            Loading the bundled ingredient CSVs. Custom ingredients are still available while the
            catalogue initializes.
          </div>
        ) : null}

        {baseState.status === 'error' ? (
          <div className="rounded-[1.5rem] border border-destructive/40 bg-destructive/5 px-4 py-5 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">The base ingredient catalogue could not be loaded.</p>
            <p className="mt-2">{baseState.message}</p>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-background/45">
          <Table className="min-w-[72rem]">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Calories</TableHead>
                <TableHead className="text-right">Energy</TableHead>
                <TableHead className="text-right">Protein</TableHead>
                <TableHead className="text-right">Fat</TableHead>
                <TableHead className="text-right">Sat fat</TableHead>
                <TableHead className="text-right">Carbs</TableHead>
                <TableHead className="text-right">Sugars</TableHead>
                <TableHead className="text-right">Fibre</TableHead>
                <TableHead className="text-right">Sodium</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedIngredients.length > 0 ? (
                pagedIngredients.map((ingredient) => (
                  <TableRow key={ingredient.id}>
                    <TableCell className="max-w-[24rem]">
                      <div className="space-y-1">
                        <p className="truncate font-medium">{ingredient.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {ingredient.classification ?? 'Ingredient'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant={ingredient.isBase ? 'secondary' : 'outline'}>
                          {getIngredientSourceLabel(ingredient)}
                        </Badge>
                        {!ingredient.isBase ? <Badge variant="outline">Local</Badge> : null}
                      </div>
                    </TableCell>
                    <MetricCell value={ingredient.metrics.calories} />
                    <MetricCell value={ingredient.metrics.energy} />
                    <MetricCell value={ingredient.metrics.protein} />
                    <MetricCell value={ingredient.metrics.fatTotal} />
                    <MetricCell value={ingredient.metrics.fatSaturated} />
                    <MetricCell value={ingredient.metrics.carbohydrate} />
                    <MetricCell value={ingredient.metrics.sugar} />
                    <MetricCell value={ingredient.metrics.dietaryFibre} />
                    <MetricCell value={ingredient.metrics.sodium} />
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={11} className="py-12 text-center text-muted-foreground">
                    No ingredients match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {pageCount}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setPageIndex((current) => Math.max(current - 1, 0))}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setPageIndex((current) => Math.min(current + 1, pageCount - 1))}
              disabled={currentPage >= pageCount - 1}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MetricCell({ value }: { readonly value: number }) {
  return <TableCell className="text-right font-medium tabular-nums">{formatMetric(value)}</TableCell>
}

function formatMetric(value: number) {
  return value.toLocaleString('en-AU', {
    maximumFractionDigits: value >= 100 ? 0 : 1,
    minimumFractionDigits: 0,
  })
}

function compareIngredients(
  left: IngredientRecord,
  right: IngredientRecord,
  sortBy: SortOption,
  collator: Intl.Collator,
) {
  if (sortBy === 'name') {
    return collator.compare(left.name, right.name)
  }

  const leftMetric = left.metrics[sortBy]
  const rightMetric = right.metrics[sortBy]

  if (leftMetric === rightMetric) {
    return collator.compare(left.name, right.name)
  }

  return rightMetric - leftMetric
}

function getIngredientSourceLabel(ingredient: IngredientRecord) {
  if (ingredient.source === 'custom') {
    return 'Custom'
  }

  return ingredient.source === 'seed-solid' ? 'CSV solid' : 'CSV liquid'
}

function matchesSourceFilter(ingredient: IngredientRecord, filter: SourceFilter) {
  switch (filter) {
    case 'all':
      return true
    case 'base':
      return ingredient.isBase
    case 'custom':
      return ingredient.source === 'custom'
    case 'seed-solid':
      return ingredient.source === 'seed-solid'
    case 'seed-liquid':
      return ingredient.source === 'seed-liquid'
    default:
      return true
  }
}

function normalizeSearch(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}
