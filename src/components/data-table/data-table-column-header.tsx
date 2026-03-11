import type { Column } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>
  label: string
  className?: string
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  label,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn('font-medium text-foreground', className)}>{label}</div>
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('-ml-2 h-8 px-2 font-medium text-foreground hover:bg-transparent', className)}
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      <span>{label}</span>
      <SortIcon direction={column.getIsSorted()} />
    </Button>
  )
}

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (direction === 'asc') {
    return <ArrowUp className="size-4" />
  }

  if (direction === 'desc') {
    return <ArrowDown className="size-4" />
  }

  return <ArrowUpDown className="size-4 text-muted-foreground" />
}
