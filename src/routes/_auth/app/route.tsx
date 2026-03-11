import { createFileRoute, Outlet } from '@tanstack/react-router'

import { AppShell } from '@/components/app-shell'

export const Route = createFileRoute('/_auth/app')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <AppShell>
      <div className="rounded-3xl border border-border/70 bg-card/60 p-6 shadow-xl shadow-black/10 backdrop-blur-sm">
        <Outlet />
      </div>
    </AppShell>
  )
}
