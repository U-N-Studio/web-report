import { HashRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Layout from './components/Layout';
import SearchPage from './pages/SearchPage';
import ReportPage from './pages/ReportPage';
import ReportDetailPage from './pages/ReportDetailPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/reports" element={<ReportPage />} />
            <Route path="/reports/:id" element={<ReportDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Layout>
      </HashRouter>
    </ConfigProvider>
  );
}

export default App;
