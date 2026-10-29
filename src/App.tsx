import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AppProvider, useApp } from './contexts/AppContext'
import { ToastProvider } from './contexts/ToastContext'
import { AppShell } from './components/AppShell'
const AuthPage = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })))
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const MentorPage = lazy(() => import('./pages/MentorPage').then(m => ({ default: m.MentorPage })))
const LearnPage = lazy(() => import('./pages/LearnPage').then(m => ({ default: m.LearnPage })))
const TopicPage = lazy(() => import('./pages/TopicPage').then(m => ({ default: m.TopicPage })))
const PYQPage = lazy(() => import('./pages/PYQPage').then(m => ({ default: m.PYQPage })))
const QuestionPage = lazy(() => import('./pages/QuestionPage').then(m => ({ default: m.QuestionPage })))
const PrelimsPage = lazy(() => import('./pages/PrelimsPage').then(m => ({ default: m.PrelimsPage })))
const TestPage = lazy(() => import('./pages/TestPage').then(m => ({ default: m.TestPage })))
const ResultsPage = lazy(() => import('./pages/ResultsPage').then(m => ({ default: m.ResultsPage })))
const MainsPage = lazy(() => import('./pages/MainsPage').then(m => ({ default: m.MainsPage })))
const EssayPage = lazy(() => import('./pages/EssayPage').then(m => ({ default: m.EssayPage })))
const CurrentAffairsPage = lazy(() => import('./pages/CurrentAffairsPage').then(m => ({ default: m.CurrentAffairsPage })))
const CurrentAffairPage = lazy(() => import('./pages/CurrentAffairPage').then(m => ({ default: m.CurrentAffairPage })))
const StudyPlanPage = lazy(() => import('./pages/StudyPlanPage').then(m => ({ default: m.StudyPlanPage })))
const NotesPage = lazy(() => import('./pages/NotesPage').then(m => ({ default: m.NotesPage })))
const FlashcardsPage = lazy(() => import('./pages/FlashcardsPage').then(m => ({ default: m.FlashcardsPage })))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })))
const InterviewPage = lazy(() => import('./pages/InterviewPage').then(m => ({ default: m.InterviewPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))

function FullScreenLoader() {
  return (
    <div className="boot-screen">
      <div className="boot-mark"><Loader2 className="spin" size={24} /></div>
      <strong>UPSC Mentor AI</strong>
      <span>Preparing your workspace…</span>
    </div>
  )
}

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.profile.onboarded ? '/dashboard' : '/onboarding'} replace />
}

function PublicOnly() {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (user) return <Navigate to={user.profile.onboarded ? '/dashboard' : '/onboarding'} replace />
  return <Outlet />
}

function RequireAuth() {
  const { user, loading } = useAuth()
  const { ready } = useApp()
  const location = useLocation()
  if (loading || (user && !ready)) return <FullScreenLoader />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (!user.profile.onboarded) return <Navigate to="/onboarding" replace />
  return <Outlet />
}

function OnboardingGate() {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!user) return <Navigate to="/login" replace />
  if (user.profile.onboarded) return <Navigate to="/dashboard" replace />
  return <OnboardingPage />
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppProvider>
            <Suspense fallback={<FullScreenLoader />}>
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route element={<PublicOnly />}>
                <Route path="/login" element={<AuthPage mode="login" />} />
                <Route path="/register" element={<AuthPage mode="register" />} />
              </Route>
              <Route path="/onboarding" element={<OnboardingGate />} />
              <Route element={<RequireAuth />}>
                <Route element={<AppShell />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/mentor" element={<MentorPage />} />
                  <Route path="/learn" element={<LearnPage />} />
                  <Route path="/learn/topic/:topicId" element={<TopicPage />} />
                  <Route path="/pyq" element={<PYQPage />} />
                  <Route path="/pyq/:questionId" element={<QuestionPage />} />
                  <Route path="/prelims" element={<PrelimsPage />} />
                  <Route path="/prelims/test" element={<TestPage />} />
                  <Route path="/prelims/results/:attemptId" element={<ResultsPage />} />
                  <Route path="/mains" element={<MainsPage />} />
                  <Route path="/essay" element={<EssayPage />} />
                  <Route path="/current-affairs" element={<CurrentAffairsPage />} />
                  <Route path="/current-affairs/:affairId" element={<CurrentAffairPage />} />
                  <Route path="/study-plan" element={<StudyPlanPage />} />
                  <Route path="/notes" element={<NotesPage />} />
                  <Route path="/flashcards" element={<FlashcardsPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/interview" element={<InterviewPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            </Suspense>
          </AppProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
