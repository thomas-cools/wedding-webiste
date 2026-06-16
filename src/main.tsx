import React, { lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import RsvpPage from './pages/RsvpPage'
import AccommodationsPage from './pages/AccommodationsPage'
import FaqPage from './pages/FaqPage'
import GalleryPage from './pages/GalleryPage'
import DrinkPreferencesPage from './pages/DrinkPreferencesPage'
import FinalRsvpPage from './pages/FinalRsvpPage'
import theme from './theme'
import { FeatureFlagsProvider } from './contexts/FeatureFlagsContext'
import ScrollToTop from './components/ScrollToTop'
import './index.css'

// Initialize i18n (must be imported before App)
import './i18n'

// Lazy-loaded admin page (hidden route, not in nav)
const AdminPage = lazy(() => import('./pages/AdminPage'))

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <FeatureFlagsProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/rsvp" element={<RsvpPage />} />
            <Route path="/accommodations" element={<AccommodationsPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/drinks" element={<DrinkPreferencesPage />} />
            <Route path="/final-rsvp" element={<FinalRsvpPage />} />
            <Route
              path="/admin"
              element={
                <Suspense fallback={null}>
                  <AdminPage />
                </Suspense>
              }
            />
          </Routes>
        </BrowserRouter>
      </FeatureFlagsProvider>
    </ChakraProvider>
  </React.StrictMode>
)

