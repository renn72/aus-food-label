import { type ColumnDef, type SortingFn } from '@tanstack/react-table'
import * as React from 'react'

import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DataTableViewOptions } from '@/components/data-table/data-table-view-options'
import { useDataTable } from '@/hooks/use-data-table'
import type { IngredientTableRow } from '@/lib/ingredient/functions'

const metricSortingFn: SortingFn<IngredientTableRow> = (rowA, rowB, columnId) => {
  const leftValue = parseMetricNumber(rowA.getValue(columnId))
  const rightValue = parseMetricNumber(rowB.getValue(columnId))

  if (leftValue === null && rightValue === null) {
    return 0
  }

  if (leftValue === null) {
    return 1
  }

  if (rightValue === null) {
    return -1
  }

  return leftValue - rightValue
}

const columns: ColumnDef<IngredientTableRow>[] = [
  {
    accessorKey: 'name',
    enableHiding: false,
    minSize: 320,
    size: 360,
    meta: {
      label: 'Name',
    },
    header: ({ column }) => <DataTableColumnHeader column={column} label="Name" />,
    cell: ({ getValue }) => (
      <div className="min-w-64 font-medium text-foreground">{formatMetric(getValue())}</div>
    ),
  },
  {
    accessorKey: 'calories',
    size: 130,
    meta: {
      label: 'Calories',
    },
    header: ({ column }) => <DataTableColumnHeader column={column} label="Calories" />,
    sortingFn: metricSortingFn,
    cell: ({ getValue }) => <MetricCell value={getValue()} />,
  },
  {
    accessorKey: 'energy',
    size: 130,
    meta: {
      label: 'Energy',
    },
    header: ({ column }) => <DataTableColumnHeader column={column} label="Energy" />,
    sortingFn: metricSortingFn,
    cell: ({ getValue }) => <MetricCell value={getValue()} />,
  },
  {
    accessorKey: 'protein',
    size: 130,
    meta: {
      label: 'Protein',
    },
    header: ({ column }) => <DataTableColumnHeader column={column} label="Protein" />,
    sortingFn: metricSortingFn,
    cell: ({ getValue }) => <MetricCell value={getValue()} />,
  },
  {
    accessorKey: 'fatTotal',
    size: 150,
    meta: {
      label: 'Fat total',
    },
    header: ({ column }) => <DataTableColumnHeader column={column} label="Fat total" />,
    sortingFn: metricSortingFn,
    cell: ({ getValue }) => <MetricCell value={getValue()} />,
  },
  {
    accessorKey: 'fatSaturated',
    size: 170,
    meta: {
      label: 'Fat saturated',
    },
    header: ({ column }) => <DataTableColumnHeader column={column} label="Fat saturated" />,
    sortingFn: metricSortingFn,
    cell: ({ getValue }) => <MetricCell value={getValue()} />,
  },
  {
    accessorKey: 'carbohydrate',
    size: 170,
    meta: {
      label: 'Carbohydrate',
    },
    header: ({ column }) => <DataTableColumnHeader column={column} label="Carbohydrate" />,
    sortingFn: metricSortingFn,
    cell: ({ getValue }) => <MetricCell value={getValue()} />,
  },
  {
    accessorKey: 'sugar',
    size: 130,
    meta: {
      label: 'Sugar',
    },
    header: ({ column }) => <DataTableColumnHeader column={column} label="Sugar" />,
    sortingFn: metricSortingFn,
    cell: ({ getValue }) => <MetricCell value={getValue()} />,
  },
  {
    accessorKey: 'dietaryFibre',
    size: 170,
    meta: {
      label: 'Dietary fibre',
    },
    header: ({ column }) => <DataTableColumnHeader column={column} label="Dietary fibre" />,
    sortingFn: metricSortingFn,
    cell: ({ getValue }) => <MetricCell value={getValue()} />,
  },
  {
    accessorKey: 'sodium',
    size: 130,
    meta: {
      label: 'Sodium',
    },
    header: ({ column }) => <DataTableColumnHeader column={column} label="Sodium" />,
    sortingFn: metricSortingFn,
    cell: ({ getValue }) => <MetricCell value={getValue()} />,
  },
]

export function IngredientTable({
  rows,
  query,
}: {
  readonly rows: IngredientTableRow[]
  readonly query: string
}) {
  const { table } = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => String(row.id),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 50,
      },
    },
    manualFiltering: false,
    manualPagination: false,
    manualSorting: false,
    enableRowSelection: false,
    clearOnDefault: true,
    queryKeys: {
      page: 'ingredientPage',
      perPage: 'ingredientPerPage',
      sort: 'ingredientSort',
      filters: 'ingredientFilters',
      joinOperator: 'ingredientJoinOperator',
    },
  })
  const previousQueryRef = React.useRef(query)

  React.useEffect(() => {
    if (previousQueryRef.current === query) {
      return
    }

    previousQueryRef.current = query
    table.setPageIndex(0)
  }, [query, table])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-border/70 bg-card/70 p-4 shadow-xl shadow-black/10 backdrop-blur-sm">
      <DataTable
        table={table}
        className="min-h-0 flex-1"
        containerClassName="rounded-2xl border-border/70 bg-background/40"
        viewportClassName="h-full"
        tableClassName="min-w-[78rem]"
        paginationClassName="px-1"
        pageSizeOptions={[25, 50, 100, 250]}
        stickyHeader
        stickyHeaderBackground="var(--card)"
      >
        <div className="flex items-center justify-end">
          <DataTableViewOptions table={table} align="end" />
        </div>
      </DataTable>
    </div>
  )
}

function MetricCell({ value }: { value: unknown }) {
  return <div className="text-right font-medium tabular-nums">{formatMetric(value)}</div>
}

function formatMetric(value: unknown) {
  if (typeof value === 'number') return String(value)

  if (typeof value === 'string') {
    const normalizedValue = value.trim()
    return normalizedValue || '-'
  }

  return '-'
}

function parseMetricNumber(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim()

    if (!normalizedValue) {
      return null
    }

    const parsedValue = Number(normalizedValue)
    return Number.isNaN(parsedValue) ? null : parsedValue
  }

  return null
}
