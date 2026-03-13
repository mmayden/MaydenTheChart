/**
 * main.jsx — App entry point.
 *
 * Order of operations:
 *   1. validateEnv() — throw immediately if keys are missing
 *   2. Render React tree with QueryClientProvider
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './services/queryClient'
import { validateEnv } from './utils/validateEnv'
import App from './App'
import './index.css'

validateEnv()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
