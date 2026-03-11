import { flexRender, type Table as TanStackTable } from '@tanstack/react-table'
import type * as React from 'react'

import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface DataTableProps<TData> extends React.ComponentProps<'div'> {
  table: TanStackTable<TData>
  containerClassName?: string
  viewportClassName?: string
  tableClassName?: string
  paginationClassName?: string
  pageSizeOptions?: number[]
  stickyHeader?: boolean
  stickyHeaderBackground?: string
}

export function DataTable<TData>({
  table,
  containerClassName,
  viewportClassName,
  tableClassName,
  paginationClassName,
  pageSizeOptions,
  stickyHeader = false,
  stickyHeaderBackground = 'var(--background)',
  children,
  className,
  ...props
}: DataTableProps<TData>) {
  return (
    <div className={cn('flex min-h-0 w-full flex-col gap-2.5', className)} {...props}>
      {children}

      <div className={cn('min-h-0 flex-1 overflow-hidden rounded-md border', containerClassName)}>
        <ScrollArea className={cn('h-full w-full', viewportClassName)}>
          <Table className={cn('min-w-full', tableClassName)}>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(stickyHeader && 'sticky top-0 z-20 backdrop-blur-sm')}
                      style={{
                        width: header.getSize(),
                        background: stickyHeader ? stickyHeaderBackground : undefined,
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={table.getAllLeafColumns().length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      <DataTablePagination
        table={table}
        pageSizeOptions={pageSizeOptions}
        className={paginationClassName}
      />
    </div>
  )
}
