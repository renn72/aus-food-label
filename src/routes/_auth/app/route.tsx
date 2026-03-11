import { createFileRoute, Outlet } from '@tanstack/react-router'

import { SignOutButton } from '@/components/sign-out-button'

export const Route = createFileRoute('/_auth/app')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <div className="min-h-svh bg-background px-6 py-8 text-foreground sm:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-card/70 px-6 py-5 shadow-lg shadow-black/10 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.35em] text-primary/80 uppercase">
              Aus Food Label
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">App workspace</h1>
          </div>
          <SignOutButton />
        </header>

        <div className="rounded-3xl border border-border/70 bg-card/60 p-6 shadow-xl shadow-black/10 backdrop-blur-sm">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
