import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initAnalytics } from './utils/analytics'
import './index.css'
import App from './App.jsx'

initAnalytics()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
