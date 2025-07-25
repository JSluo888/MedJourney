import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAppStore } from './stores/useAppStore';
import { ROUTES } from './constants';

// 页面组件
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import ChatPage from './pages/ChatPage';
import FamilySummaryPage from './pages/FamilySummaryPage';
import DoctorPage from './pages/DoctorPage';
import DoctorReportPage from './pages/DoctorReportPage';

// 布局组件
import Layout from './components/Layout';

function App() {
  const { user } = useAppStore();

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
          <Routes>
            {/* 公开路由 */}
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            
            {/* 受保护路由 */}
            {user ? (
              <Route path="/*" element={<Layout />}>
                <Route index element={<DashboardPage />} />
                <Route path="history" element={<HistoryPage />} />
                <Route path="chat" element={<ChatPage />} />
                <Route path="family-summary" element={<FamilySummaryPage />} />
                <Route path="doctor" element={<DoctorPage />} />
                <Route path="doctor/report/:sid" element={<DoctorReportPage />} />
              </Route>
            ) : (
              <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
            )}
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;