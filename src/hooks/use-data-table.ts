import { useLocation, useRouter } from '@tanstack/react-router'
import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
  type TableState,
  type Updater,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table'
import * as React from 'react'

import { useDebouncedCallback } from '@/hooks/use-debounced-callback'
import { getSortingStateParser } from '@/lib/parsers'
import type { ExtendedColumnSort, QueryKeys } from '@/types/data-table'

const PAGE_KEY = 'page'
const PER_PAGE_KEY = 'perPage'
const SORT_KEY = 'sort'
const FILTERS_KEY = 'filters'
const JOIN_OPERATOR_KEY = 'joinOperator'
const DEBOUNCE_MS = 300
const THROTTLE_MS = 50

type SearchRecord = Record<string, unknown>
type SearchPrimitive = string | number | boolean
type SearchFilterValue = SearchPrimitive | SearchPrimitive[] | null

interface UseDataTableProps<TData>
  extends
    Omit<
      TableOptions<TData>,
      | 'state'
      | 'pageCount'
      | 'getCoreRowModel'
      | 'manualFiltering'
      | 'manualPagination'
      | 'manualSorting'
    >,
    Partial<Pick<TableOptions<TData>, 'pageCount'>> {
  initialState?: Omit<Partial<TableState>, 'sorting'> & {
    sorting?: ExtendedColumnSort<TData>[]
  }
  manualFiltering?: boolean
  manualPagination?: boolean
  manualSorting?: boolean
  queryKeys?: Partial<QueryKeys>
  history?: 'push' | 'replace'
  debounceMs?: number
  throttleMs?: number
  clearOnDefault?: boolean
  enableAdvancedFilter?: boolean
  scroll?: boolean
  shallow?: boolean
  startTransition?: React.TransitionStartFunction
}

function isSearchPrimitive(value: unknown): value is SearchPrimitive {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}

function normalizeSearchFilterValue(value: unknown): SearchFilterValue {
  if (value === null || value === undefined) {
    return null
  }

  if (Array.isArray(value)) {
    const nextValue = value.filter(isSearchPrimitive)
    return nextValue.length > 0 ? nextValue : null
  }

  return isSearchPrimitive(value) ? value : null
}

function areSearchValuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length &&
      left.every((item, index) => areSearchValuesEqual(item, right[index]))
    )
  }

  if (typeof left === 'object' && left !== null && typeof right === 'object' && right !== null) {
    const leftEntries = Object.entries(left)
    const rightEntries = Object.entries(right)

    return (
      leftEntries.length === rightEntries.length &&
      leftEntries.every(([key, value]) => areSearchValuesEqual(value, (right as SearchRecord)[key]))
    )
  }

  return false
}

function parsePositiveInteger(value: unknown, fallback: number) {
  const parsedValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseInt(value, 10)
        : Number.NaN

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback
}

function setSearchValue(
  search: SearchRecord,
  key: string,
  value: unknown,
  {
    clearOnDefault,
    defaultValue,
  }: {
    clearOnDefault: boolean
    defaultValue?: unknown
  },
) {
  if (
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  ) {
    delete search[key]
    return
  }

  if (clearOnDefault && defaultValue !== undefined && areSearchValuesEqual(value, defaultValue)) {
    delete search[key]
    return
  }

  search[key] = value
}

export function useDataTable<TData>(props: UseDataTableProps<TData>) {
  const {
    columns,
    pageCount = -1,
    initialState,
    manualFiltering = true,
    manualPagination = true,
    manualSorting = true,
    queryKeys,
    history = 'replace',
    debounceMs = DEBOUNCE_MS,
    throttleMs = THROTTLE_MS,
    clearOnDefault = false,
    enableAdvancedFilter = false,
    scroll = false,
    shallow = true,
    startTransition: _startTransition,
    ...tableProps
  } = props
  const router = useRouter()
  const location = useLocation({
    select: ({ hash, pathname, searchStr }) => ({ hash, pathname, searchStr }),
  })
  const pageKey = queryKeys?.page ?? PAGE_KEY
  const perPageKey = queryKeys?.perPage ?? PER_PAGE_KEY
  const sortKey = queryKeys?.sort ?? SORT_KEY
  const filtersKey = queryKeys?.filters ?? FILTERS_KEY
  const joinOperatorKey = queryKeys?.joinOperator ?? JOIN_OPERATOR_KEY
  const pageDefault = 1
  const perPageDefault = initialState?.pagination?.pageSize ?? 10
  const sortingDefault = React.useMemo(() => initialState?.sorting ?? [], [initialState?.sorting])
  const search = React.useMemo(
    () => router.options.parseSearch(location.searchStr) as SearchRecord,
    [location.searchStr, router],
  )

  const commitSearch = React.useCallback(
    (updater: (previous: SearchRecord) => SearchRecord) => {
      const nextSearch = updater({
        ...(router.options.parseSearch(location.searchStr) as SearchRecord),
      })

      return router.navigate({
        href: `${location.pathname}${router.options.stringifySearch(nextSearch)}${
          location.hash ? `#${location.hash}` : ''
        }`,
        replace: history === 'replace',
        resetScroll: scroll,
      })
    },
    [history, location.hash, location.pathname, location.searchStr, router, scroll],
  )

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
    initialState?.rowSelection ?? {},
  )
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    initialState?.columnVisibility ?? {},
  )

  const page = React.useMemo(
    () => parsePositiveInteger(search[pageKey], pageDefault),
    [pageDefault, pageKey, search],
  )
  const perPage = React.useMemo(
    () => parsePositiveInteger(search[perPageKey], perPageDefault),
    [perPageDefault, perPageKey, search],
  )

  const pagination: PaginationState = React.useMemo(() => {
    return {
      pageIndex: page - 1,
      pageSize: perPage,
    }
  }, [page, perPage])

  const onPaginationChange = React.useCallback(
    (updaterOrValue: Updater<PaginationState>) => {
      const nextPagination =
        typeof updaterOrValue === 'function' ? updaterOrValue(pagination) : updaterOrValue

      void commitSearch((previous) => {
        const nextSearch = { ...previous }

        setSearchValue(nextSearch, pageKey, nextPagination.pageIndex + 1, {
          clearOnDefault,
          defaultValue: pageDefault,
        })
        setSearchValue(nextSearch, perPageKey, nextPagination.pageSize, {
          clearOnDefault,
          defaultValue: perPageDefault,
        })

        return nextSearch
      })
    },
    [clearOnDefault, commitSearch, pageDefault, pagination, pageKey, perPageDefault, perPageKey],
  )

  const columnIds = React.useMemo(() => {
    return new Set(columns.map((column) => column.id).filter(Boolean) as string[])
  }, [columns])

  const sortingParser = React.useMemo(() => getSortingStateParser<TData>(columnIds), [columnIds])
  const sorting = React.useMemo(
    () => sortingParser.parse(search[sortKey]) ?? sortingDefault,
    [search, sortKey, sortingDefault, sortingParser],
  )

  const onSortingChange = React.useCallback(
    (updaterOrValue: Updater<SortingState>) => {
      const nextSorting =
        typeof updaterOrValue === 'function' ? updaterOrValue(sorting) : updaterOrValue

      void commitSearch((previous) => {
        const nextSearch = { ...previous }

        setSearchValue(nextSearch, sortKey, nextSorting as ExtendedColumnSort<TData>[], {
          clearOnDefault,
          defaultValue: sortingDefault,
        })

        return nextSearch
      })
    },
    [clearOnDefault, commitSearch, sortKey, sorting, sortingDefault],
  )

  const filterableColumns = React.useMemo(() => {
    if (enableAdvancedFilter) return []

    return columns.filter((column) => column.enableColumnFilter)
  }, [columns, enableAdvancedFilter])

  const filterValues = React.useMemo(() => {
    if (enableAdvancedFilter) {
      return {}
    }

    return filterableColumns.reduce<Record<string, SearchFilterValue>>((filters, column) => {
      if (!column.id) {
        return filters
      }

      filters[column.id] = normalizeSearchFilterValue(search[column.id])
      return filters
    }, {})
  }, [enableAdvancedFilter, filterableColumns, search])

  const debouncedSetFilterValues = useDebouncedCallback(
    (values: Record<string, SearchFilterValue>) => {
      void commitSearch((previous) => {
        const nextSearch = { ...previous }

        setSearchValue(nextSearch, pageKey, 1, {
          clearOnDefault,
          defaultValue: pageDefault,
        })

        for (const [key, value] of Object.entries(values)) {
          setSearchValue(nextSearch, key, value, {
            clearOnDefault: false,
          })
        }

        return nextSearch
      })
    },
    debounceMs,
  )

  const initialColumnFilters: ColumnFiltersState = React.useMemo(() => {
    if (enableAdvancedFilter) return []

    return Object.entries(filterValues).reduce<ColumnFiltersState>((filters, [key, value]) => {
      if (
        value !== null &&
        value !== undefined &&
        value !== '' &&
        (!Array.isArray(value) || value.length > 0)
      ) {
        filters.push({
          id: key,
          value,
        })
      }

      return filters
    }, [])
  }, [enableAdvancedFilter, filterValues])

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(initialColumnFilters)

  React.useEffect(() => {
    setColumnFilters(initialColumnFilters)
  }, [initialColumnFilters])

  const onColumnFiltersChange = React.useCallback(
    (updaterOrValue: Updater<ColumnFiltersState>) => {
      if (enableAdvancedFilter) return

      setColumnFilters((previous) => {
        const next =
          typeof updaterOrValue === 'function' ? updaterOrValue(previous) : updaterOrValue

        const filterUpdates = next.reduce<Record<string, SearchFilterValue>>((filters, filter) => {
          if (filterableColumns.find((column) => column.id === filter.id)) {
            filters[filter.id] = normalizeSearchFilterValue(filter.value)
          }

          return filters
        }, {})

        for (const previousFilter of previous) {
          if (!next.some((filter) => filter.id === previousFilter.id)) {
            filterUpdates[previousFilter.id] = null
          }
        }

        debouncedSetFilterValues(filterUpdates)
        return next
      })
    },
    [debouncedSetFilterValues, enableAdvancedFilter, filterableColumns],
  )

  // oxlint-disable-next-line react-hooks-js/incompatible-library
  const table = useReactTable({
    ...tableProps,
    columns,
    initialState,
    pageCount: manualPagination ? pageCount : undefined,
    state: {
      pagination,
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    defaultColumn: {
      ...tableProps.defaultColumn,
      enableColumnFilter: false,
    },
    enableRowSelection: tableProps.enableRowSelection ?? true,
    onRowSelectionChange: setRowSelection,
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    manualPagination,
    manualSorting,
    manualFiltering,
    meta: {
      ...tableProps.meta,
      queryKeys: {
        page: pageKey,
        perPage: perPageKey,
        sort: sortKey,
        filters: filtersKey,
        joinOperator: joinOperatorKey,
      },
    },
  })

  return React.useMemo(
    () => ({ table, shallow, debounceMs, throttleMs }),
    [table, shallow, debounceMs, throttleMs],
  )
}
