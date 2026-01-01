import React from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import RsvpPage from './pages/RsvpPage'
import AccommodationsPage from './pages/AccommodationsPage'
import FaqPage from './pages/FaqPage'
import GalleryPage from './pages/GalleryPage'
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
            <Route path="/accommodations" element={<AccommodationsPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
          </Routes>
        </BrowserRouter>
      </FeatureFlagsProvider>
    </ChakraProvider>
  </React.StrictMode>
)

