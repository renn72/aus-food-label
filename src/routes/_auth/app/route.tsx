import { createFileRoute, Outlet } from '@tanstack/react-router'

import { AppHeader } from '@/components/app-header'

export const Route = createFileRoute('/_auth/app')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <div className="min-h-svh bg-background px-6 py-6 text-foreground sm:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <AppHeader />

        <div className="rounded-3xl border border-border/70 bg-card/60 p-6 shadow-xl shadow-black/10 backdrop-blur-sm">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
