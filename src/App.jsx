import { Navigate, Route, Routes } from 'react-router-dom'
import { SavedProvider } from './SavedContext.jsx'
import { AuthProvider } from './AuthContext.jsx'
import { ResourcesProvider } from './ResourcesContext.jsx'
import Layout from './components/Layout.jsx'
import ResourceDirectory from './components/ResourceDirectory.jsx'
import ResourceDetail from './components/ResourceDetail.jsx'
import PlaceholderPage from './components/PlaceholderPage.jsx'
import SavedPage from './components/SavedPage.jsx'
import LoginPage from './components/LoginPage.jsx'
import ChatPage from './components/ChatPage.jsx'
import PlanPage from './components/PlanPage.jsx'
import AboutPage from './components/AboutPage.jsx'

export default function App() {
  return (
    <AuthProvider>
      <ResourcesProvider>
        <SavedProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/resources" replace />} />
            <Route path="/resources" element={<ResourceDirectory />} />
            <Route path="/resources/:id" element={<ResourceDetail />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/saved" element={<SavedPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/plan" element={<PlanPage />} />
            <Route
              path="/settings"
              element={
                <PlaceholderPage
                  title="Settings"
                  subtitle="Manage your preferences and how your information is used."
                />
              }
            />
            <Route path="*" element={<Navigate to="/resources" replace />} />
          </Route>
        </Routes>
        </SavedProvider>
      </ResourcesProvider>
    </AuthProvider>
  )
}
