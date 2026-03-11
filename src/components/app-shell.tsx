import type { ReactNode } from 'react'

import { AppHeader } from '@/components/app-header'

export function AppShell({ children }: { readonly children: ReactNode }) {
  return (
    <div className="min-h-svh bg-background px-6 py-6 text-foreground sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <AppHeader />
        {children}
      </div>
    </div>
  )
}
