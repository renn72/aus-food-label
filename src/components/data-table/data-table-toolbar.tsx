import type { Table } from '@tanstack/react-table'
import { X } from 'lucide-react'
import type * as React from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const ALL_FILTER_VALUE = '__all__'

export interface DataTableSelectFilterOption {
  label: string
  value: string
}

export interface DataTableSelectFilter {
  columnId: string
  title: string
  allLabel?: string
  options: DataTableSelectFilterOption[]
}

interface DataTableToolbarProps<TData> extends React.ComponentProps<'div'> {
  table: Table<TData>
  searchColumnId?: string
  searchPlaceholder?: string
  selectFilters?: DataTableSelectFilter[]
}

export function DataTableToolbar<TData>({
  table,
  searchColumnId,
  searchPlaceholder,
  selectFilters = [],
  children,
  className,
  ...props
}: DataTableToolbarProps<TData>) {
  const searchColumn = searchColumnId ? table.getColumn(searchColumnId) : undefined
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div
      role="toolbar"
      aria-orientation="horizontal"
      className={cn('flex w-full flex-wrap items-start justify-between gap-3 p-1', className)}
      {...props}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {searchColumn ? (
          <Input
            placeholder={searchPlaceholder ?? 'Search...'}
            value={(searchColumn.getFilterValue() as string) ?? ''}
            onChange={(event) => {
              searchColumn.setFilterValue(event.target.value)
            }}
            className="h-8 w-full min-w-56 sm:max-w-sm"
          />
        ) : null}

        {selectFilters.map((filter) => {
          const column = table.getColumn(filter.columnId)

          if (!column) {
            return null
          }

          const currentValue = column.getFilterValue()
          const value =
            typeof currentValue === 'string' && currentValue ? currentValue : ALL_FILTER_VALUE

          return (
            <Select
              key={filter.columnId}
              value={value}
              onValueChange={(nextValue) => {
                column.setFilterValue(nextValue === ALL_FILTER_VALUE ? undefined : nextValue)
              }}
            >
              <SelectTrigger className="min-w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>
                  {filter.allLabel ?? `All ${filter.title}`}
                </SelectItem>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        })}

        {isFiltered ? (
          <Button variant="outline" size="sm" onClick={() => table.resetColumnFilters()}>
            <X />
            Reset
          </Button>
        ) : null}
      </div>

      {children ? <div className="flex items-center gap-2">{children}</div> : null}
    </div>
  )
}
