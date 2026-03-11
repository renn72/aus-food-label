import { z } from 'zod'

import { dataTableConfig } from '@/config/data-table'
import type { ExtendedColumnFilter, ExtendedColumnSort } from '@/types/data-table'

export interface DataTableSearchParser<TValue> {
  parse: (value: unknown) => TValue | null
  serialize: (value: TValue) => string
  eq: (a: TValue, b: TValue) => boolean
}

const sortingItemSchema = z.object({
  id: z.string(),
  desc: z.boolean(),
})

function resolveColumnIds(columnIds?: string[] | Set<string>) {
  if (!columnIds) {
    return null
  }

  return columnIds instanceof Set ? columnIds : new Set(columnIds)
}

function parseSearchValue(value: unknown) {
  if (typeof value !== 'string') {
    return value
  }

  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function arePrimitiveArraysEqual(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && left.every((item, index) => item === right[index])
}

function areFilterValuesEqual(left: FilterItemSchema['value'], right: FilterItemSchema['value']) {
  if (Array.isArray(left) && Array.isArray(right)) {
    return arePrimitiveArraysEqual(left, right)
  }

  return left === right
}

export const getSortingStateParser = <TData>(columnIds?: string[] | Set<string>) => {
  const validKeys = resolveColumnIds(columnIds)

  return {
    parse: (value) => {
      try {
        const parsed = parseSearchValue(value)
        const result = z.array(sortingItemSchema).safeParse(parsed)

        if (!result.success) return null

        if (validKeys && result.data.some((item) => !validKeys.has(item.id))) {
          return null
        }

        return result.data as ExtendedColumnSort<TData>[]
      } catch {
        return null
      }
    },
    serialize: (value) => JSON.stringify(value),
    eq: (a, b) =>
      a.length === b.length &&
      a.every((item, index) => item.id === b[index]?.id && item.desc === b[index]?.desc),
  } satisfies DataTableSearchParser<ExtendedColumnSort<TData>[]>
}

const filterItemSchema = z.object({
  id: z.string(),
  value: z.union([z.string(), z.array(z.string())]),
  variant: z.enum(dataTableConfig.filterVariants),
  operator: z.enum(dataTableConfig.operators),
  filterId: z.string(),
})

export type FilterItemSchema = z.infer<typeof filterItemSchema>

export const getFiltersStateParser = <TData>(columnIds?: string[] | Set<string>) => {
  const validKeys = resolveColumnIds(columnIds)

  return {
    parse: (value) => {
      try {
        const parsed = parseSearchValue(value)
        const result = z.array(filterItemSchema).safeParse(parsed)

        if (!result.success) return null

        if (validKeys && result.data.some((item) => !validKeys.has(item.id))) {
          return null
        }

        return result.data as ExtendedColumnFilter<TData>[]
      } catch {
        return null
      }
    },
    serialize: (value) => JSON.stringify(value),
    eq: (a, b) =>
      a.length === b.length &&
      a.every(
        (filter, index) =>
          filter.id === b[index]?.id &&
          areFilterValuesEqual(filter.value, b[index]?.value ?? '') &&
          filter.variant === b[index]?.variant &&
          filter.operator === b[index]?.operator &&
          filter.filterId === b[index]?.filterId,
      ),
  } satisfies DataTableSearchParser<ExtendedColumnFilter<TData>[]>
}
