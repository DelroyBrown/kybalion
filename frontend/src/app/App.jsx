import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { LoadingVeil } from '../components/common/states'
import { SmoothScroll } from '../components/common/SmoothScroll'
import { ThemeApplier } from '../components/common/ThemeApplier'
import { AppLayout } from '../layouts/AppLayout'
import { AboutPage } from '../pages/AboutPage'
import { BookmarksPage } from '../pages/BookmarksPage'
import { HighlightsPage } from '../pages/HighlightsPage'
import { HomePage } from '../pages/HomePage'
import { JournalPage } from '../pages/JournalPage'
import { LandingPage } from '../pages/LandingPage'
import { LoginPage, RegisterPage } from '../pages/AuthPages'
import { NotFoundPage } from '../pages/NotFoundPage'
import { PrinciplesPage } from '../pages/PrinciplesPage'
import { ProfilePage } from '../pages/ProfilePage'
import { ProgressPage } from '../pages/ProgressPage'
import { ReadRedirect } from '../pages/ReadRedirect'
import { ReaderPage } from '../pages/ReaderPage'
import { SearchPage } from '../pages/SearchPage'
import { SettingsPage } from '../pages/SettingsPage'

const PrincipleDetailPage = lazy(() =>
  import('../pages/PrincipleDetailPage').then((m) => ({ default: m.PrincipleDetailPage }))
)
const KnowledgeMapPage = lazy(() =>
  import('../pages/KnowledgeMapPage').then((m) => ({ default: m.KnowledgeMapPage }))
)

export function App() {
  return (
    <>
      <ThemeApplier />
      <SmoothScroll />
      <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<AppLayout />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/read" element={<ReadRedirect />} />
        <Route path="/read/:chapterSlug" element={<ReaderPage />} />
        <Route path="/principles" element={<PrinciplesPage />} />
        <Route
          path="/principles/:slug"
          element={
            <Suspense fallback={<LoadingVeil label="Opening the principle" />}>
              <PrincipleDetailPage />
            </Suspense>
          }
        />
        <Route
          path="/map"
          element={
            <Suspense fallback={<LoadingVeil label="Drawing the map" />}>
              <KnowledgeMapPage />
            </Suspense>
          }
        />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/bookmarks" element={<BookmarksPage />} />
        <Route path="/highlights" element={<HighlightsPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/index.html" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      </Routes>
    </>
  )
}
