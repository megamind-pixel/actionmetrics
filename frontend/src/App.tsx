import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import Layout from './components/layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/auth/LoginPage'
import OverviewPage from './pages/OverviewPage'
import InstitutionsPage from './pages/institutions/InstitutionsPage'
import StudentsPage from './pages/students/StudentsPage'
import ResultsPage from './pages/results/ResultsPage'
import IndividualPage from './pages/individual/IndividualPage'
import AnalyticsPage from './pages/analytics/AnalyticsPage'
import ReportsPage from './pages/reports/ReportsPage'
import SettingsPage from './pages/settings/SettingsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<OverviewPage />} />
            <Route path="institutions" element={<InstitutionsPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="results" element={<ResultsPage />} />
            <Route path="individual" element={<IndividualPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools />}
    </QueryClientProvider>
  )
}

export default App
