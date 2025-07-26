import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAppStore } from './stores/useAppStore';
import { ROUTES } from './constants';

// 页面组件
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import ChatPageEnhanced from './pages/ChatPageEnhanced';
import FamilySummaryPage from './pages/FamilySummaryPage';
import DoctorPage from './pages/DoctorPage';
import DoctorReportPage from './pages/DoctorReportPage';

// 新增页面组件
import AssessmentPage from './pages/AssessmentPage';
import AssessmentBasicPage from './pages/AssessmentBasicPage';
import AssessmentCasePage from './pages/AssessmentCasePage';
import AssessmentChatPage from './pages/AssessmentChatPage';
import VirtualPatientsPage from './pages/VirtualPatientsPage';
import ShareReportPage from './pages/ShareReportPage';

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
            <Route path={ROUTES.SHARE_REPORT} element={<ShareReportPage />} />
            
            {/* 受保护路由 */}
            {user ? (
              <Route path="/*" element={<Layout />}>
                <Route index element={<DashboardPage />} />
                <Route path="history" element={<HistoryPage />} />
                <Route path="chat" element={<ChatPageEnhanced />} />
                <Route path="family-summary" element={<FamilySummaryPage />} />
                <Route path="doctor" element={<DoctorPage />} />
                <Route path="doctor/report/:sid" element={<DoctorReportPage />} />
                
                {/* 分级问诊路由 */}
                <Route path="assessment" element={<AssessmentPage />} />
                <Route path="assessment/basic" element={<AssessmentBasicPage />} />
                <Route path="assessment/case" element={<AssessmentCasePage />} />
                <Route path="assessment/chat" element={<AssessmentChatPage />} />
                
                {/* 虚拟病人路由 */}
                <Route path="virtual-patients" element={<VirtualPatientsPage />} />
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