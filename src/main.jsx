import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initAnalytics } from './utils/analytics'
import { takePathwayFromURL } from './utils/exportPDF'
import './index.css'
import App from './App.jsx'

// Before analytics starts, so share-link answers never reach PostHog
const sharedAnswers = takePathwayFromURL()
initAnalytics()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App sharedAnswers={sharedAnswers} />
  </StrictMode>,
)
