import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { authQueryOptions } from '@/lib/auth/queries'

export const Route = createFileRoute('/_guest')({
  component: Outlet,
  beforeLoad: async ({ context }) => {
    const REDIRECT_URL = '/app'

    const user = await context.queryClient.ensureQueryData({
      ...authQueryOptions(),
      revalidateIfStale: true,
    })
    if (user) {
      throw redirect({
        to: REDIRECT_URL,
      })
    }

    return {
      redirectUrl: REDIRECT_URL,
    }
  },
})
