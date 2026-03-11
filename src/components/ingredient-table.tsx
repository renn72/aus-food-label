import {
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingFn,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import * as React from 'react'

import { CreateIngredientSheet } from '@/components/create-ingredient-sheet'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar'
import { Badge } from '@/components/ui/badge'
import type { IngredientTableRow } from '@/lib/ingredient/functions'
import { matchesIngredientRow } from '@/lib/ingredient/search'

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

const ingredientSearchFilterFn: FilterFn<IngredientTableRow> = (row, _columnId, filterValue) => {
  return matchesIngredientRow(row.original, String(filterValue ?? ''))
}

const isAusFoodFilterFn: FilterFn<IngredientTableRow> = (row, _columnId, filterValue) => {
  const selectedValues = Array.isArray(filterValue)
    ? filterValue.map((value) => String(value))
    : typeof filterValue === 'string'
      ? [filterValue]
      : []

  if (selectedValues.length === 0) {
    return true
  }

  const value = row.original.isAusFood ? 'yes' : 'no'
  return selectedValues.includes(value)
}

const columns: ColumnDef<IngredientTableRow>[] = [
  {
    accessorKey: 'name',
    enableHiding: false,
    enableColumnFilter: true,
    filterFn: ingredientSearchFilterFn,
    minSize: 320,
    size: 360,
    meta: {
      label: 'Search',
      placeholder: 'Search ingredients or nutrients',
      variant: 'text',
    },
    header: ({ column }) => <DataTableColumnHeader column={column} label="Name" />,
    cell: ({ getValue }) => (
      <div className="min-w-64 font-medium text-foreground">{formatMetric(getValue())}</div>
    ),
  },
  {
    accessorKey: 'isAusFood',
    enableColumnFilter: true,
    filterFn: isAusFoodFilterFn,
    size: 140,
    meta: {
      label: 'Aus food',
      variant: 'select',
      options: [
        {
          label: 'Aus food',
          value: 'yes',
        },
        {
          label: 'Custom',
          value: 'no',
        },
      ],
    },
    header: ({ column }) => <DataTableColumnHeader column={column} label="Aus food" />,
    cell: ({ getValue }) => {
      const isAusFood = getValue() === true

      return (
        <div className="flex justify-center">
          <Badge variant={isAusFood ? 'default' : 'secondary'}>{isAusFood ? 'Yes' : 'No'}</Badge>
        </div>
      )
    },
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

export function IngredientTable({ rows }: { readonly rows: IngredientTableRow[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  // oxlint-disable-next-line react-hooks-js/incompatible-library
  const table = useReactTable({
    data: rows,
    columns,
    getRowId: (row) => String(row.id),
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })
  const filteredRowCount = table.getFilteredRowModel().rows.length

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
        <DataTableToolbar
          table={table}
          searchColumnId="name"
          searchPlaceholder="Search ingredients or nutrients"
          selectFilters={[
            {
              columnId: 'isAusFood',
              title: 'Aus food',
              allLabel: 'All sources',
              options: [
                { label: 'Aus food', value: 'yes' },
                { label: 'Custom', value: 'no' },
              ],
            },
          ]}
        >
          <div className="flex items-center gap-2">
            <div className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-sm font-medium">
              {filteredRowCount} / {rows.length}
            </div>
            <CreateIngredientSheet />
          </div>
        </DataTableToolbar>
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
