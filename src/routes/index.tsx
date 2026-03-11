import { createFileRoute, redirect } from '@tanstack/react-router'

import { AuthScreen } from '@/components/auth-screen'
import { authQueryOptions } from '@/lib/auth/queries'

export const Route = createFileRoute('/')({
  beforeLoad: async ({ context }) => {
    const redirectUrl = '/app'

    const user = await context.queryClient.ensureQueryData({
      ...authQueryOptions(),
      revalidateIfStale: true,
    })

    if (user) {
      throw redirect({ to: redirectUrl })
    }

    return { redirectUrl }
  },
  component: HomePage,
})

function HomePage() {
  const { redirectUrl } = Route.useRouteContext()

  return <AuthScreen redirectUrl={redirectUrl} />
}
