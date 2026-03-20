import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'

import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { router } from '@/router'

import '@/styles.css'

const rootElement = document.getElementById('app')

if (!rootElement) {
  throw new Error('The app root element could not be found.')
}

ReactDOM.createRoot(rootElement).render(
  <ThemeProvider defaultTheme="dark">
    <RouterProvider router={router} />
    <Toaster richColors />
  </ThemeProvider>,
)
