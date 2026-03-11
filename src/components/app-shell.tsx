import type { ReactNode } from 'react'

import { AppHeader } from '@/components/app-header'
import { cn } from '@/lib/utils'

export function AppShell({
  children,
  maxWidthClassName = 'max-w-6xl',
}: {
  readonly children: ReactNode
  readonly maxWidthClassName?: string
}) {
  return (
    <div className="min-h-svh bg-background px-6 py-6 text-foreground sm:px-8">
      <div className={cn('mx-auto flex w-full flex-col gap-6', maxWidthClassName)}>
        <AppHeader />
        {children}
      </div>
    </div>
  )
}
