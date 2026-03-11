import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { DashboardPage } from './pages/DashboardPage'
import { GlassPage } from './pages/GlassPage'
import { PatternsPage } from './pages/PatternsPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { SuppliesPage } from './pages/SuppliesPage'
import { ShoppingPage } from './pages/ShoppingPage'
import { SuppliersPage } from './pages/SuppliersPage'
import { SettingsPage } from './pages/SettingsPage'
import { SearchPage } from './pages/SearchPage'
import { DeadlinesPage } from './pages/DeadlinesPage'
import { StatsPage } from './pages/StatsPage'
import { PdfConverterPage } from './pages/PdfConverterPage'
import { GalleryPage } from './pages/GalleryPage'
import { HelpPage } from './pages/HelpPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="glass" element={<GlassPage />} />
          <Route path="patterns" element={<PatternsPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="deadlines" element={<DeadlinesPage />} />
          <Route path="supplies" element={<SuppliesPage />} />
          <Route path="shopping" element={<ShoppingPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="pdf-converter" element={<PdfConverterPage />} />
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="help" element={<HelpPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
