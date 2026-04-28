import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import DollsPage from './pages/Products/DollsPage';
import AccessoriesPage from './pages/Products/AccessoriesPage';
import InquiriesPage from './pages/Inquiries';
import UsersPage from './pages/Users';
import InventoryPage from './pages/Inventory';
import ReportsPage from './pages/Reports';
import CompanyPage from './pages/Company';
import SettingsPage from './pages/Settings';
import SeriesCategoryPage from './pages/SeriesCategory';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const adminId = sessionStorage.getItem('admin_id');
  if (!adminId) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products/dolls" element={<DollsPage />} />
          <Route path="products/accessories" element={<AccessoriesPage />} />
          <Route path="inquiries" element={<InquiriesPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="company" element={<CompanyPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="series-category" element={<SeriesCategoryPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
