import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { AppShell } from './components/layout/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { Incidents } from './pages/Incidents'
import { IncidentDetail } from './pages/IncidentDetail'
import { AnalyzeIncident } from './pages/AnalyzeIncident'
import { LiveMap } from './pages/LiveMap'
import { PriorityQueuePage } from './pages/PriorityQueuePage'
import { DataSources } from './pages/DataSources'
import { Settings } from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="incidents" element={<Incidents />} />
            <Route path="incidents/:id" element={<IncidentDetail />} />
            <Route path="analyze" element={<AnalyzeIncident />} />
            <Route path="map" element={<LiveMap />} />
            <Route path="priority" element={<PriorityQueuePage />} />
            <Route path="sources" element={<DataSources />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  )
}
