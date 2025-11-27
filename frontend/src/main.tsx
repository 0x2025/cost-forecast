import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { api } from '@costvela/api-client'

const API_URL = import.meta.env.VITE_API_URL;
if (API_URL) {
  api.setConfig({ baseUrl: API_URL });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
