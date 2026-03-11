import { createFileRoute } from '@tanstack/react-router'

import { AuthScreen } from '@/components/auth-screen'

export const Route = createFileRoute('/_guest/login')({
  component: LoginForm,
})

function LoginForm() {
  const { redirectUrl } = Route.useRouteContext()

  return <AuthScreen defaultMode="login" redirectUrl={redirectUrl} />
}
