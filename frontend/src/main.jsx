import '@fontsource/eb-garamond/400.css'
import '@fontsource/eb-garamond/400-italic.css'
import '@fontsource/eb-garamond/500.css'
import '@fontsource/cormorant-garamond/300.css'
import '@fontsource/cormorant-garamond/400.css'
import '@fontsource/cormorant-garamond/500.css'
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
// The Crisis wears period newspaper type: a fat-face Didone for mastheads
// and headlines, Old Standard for decks and datelines.
import '@fontsource/playfair-display/500.css'
import '@fontsource/playfair-display/700.css'
import '@fontsource/playfair-display/900.css'
import '@fontsource/old-standard-tt/400.css'
import '@fontsource/old-standard-tt/400-italic.css'
import '@fontsource/old-standard-tt/700.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { App } from './app/App'
import './styles/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
