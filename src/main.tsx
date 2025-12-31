import React from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import RsvpPage from './pages/RsvpPage'
import theme from './theme'
import { FeatureFlagsProvider } from './contexts/FeatureFlagsContext'
import './index.css'

// Initialize i18n (must be imported before App)
import './i18n'

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <FeatureFlagsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/rsvp" element={<RsvpPage />} />
          </Routes>
        </BrowserRouter>
      </FeatureFlagsProvider>
    </ChakraProvider>
  </React.StrictMode>
)

