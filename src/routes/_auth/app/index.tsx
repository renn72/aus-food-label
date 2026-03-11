import { createFileRoute } from '@tanstack/react-router'

import { WsysBrand } from '@/components/wsys-brand'

export const Route = createFileRoute('/_auth/app/')({
  component: AppIndex,
})

function AppIndex() {
  const { user } = Route.useRouteContext()

  return (
    <section className="grid gap-6">
      <div className="space-y-3">
        <WsysBrand compact product="Workspace" caption="WSYS authenticated shell" />
        <h2 className="text-3xl font-semibold tracking-tight">
          Welcome back{user.name ? `, ${user.name}` : ''}.
        </h2>
        <p className="max-w-2xl text-muted-foreground">
          The WSYS shell is now the base for ingredients, labels, and the rest of your application
          workflows.
        </p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-background/70 p-5">
        <p className="text-sm text-muted-foreground">Signed in as</p>
        <p className="mt-2 text-lg font-medium">{user.email}</p>
      </div>
    </section>
  )
}
