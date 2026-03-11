import type { ReactNode } from 'react'

import { AppHeader } from '@/components/app-header'
import { cn } from '@/lib/utils'

export function AppShell({
  children,
  maxWidthClassName = 'max-w-6xl',
  fitViewport = false,
}: {
  readonly children: ReactNode
  readonly maxWidthClassName?: string
  readonly fitViewport?: boolean
}) {
  return (
    <div
      className={cn(
        'bg-background px-6 py-6 text-foreground sm:px-8',
        fitViewport ? 'h-svh overflow-hidden' : 'min-h-svh',
      )}
    >
      <div
        className={cn(
          'mx-auto flex w-full flex-col gap-6',
          maxWidthClassName,
          fitViewport && 'h-full min-h-0',
        )}
      >
        <AppHeader />
        {children}
      </div>
    </div>
  )
}
