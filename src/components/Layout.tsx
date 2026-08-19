import { Layout as AntLayout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { SearchOutlined, FileTextOutlined, SettingOutlined } from '@ant-design/icons';

const { Header, Content } = AntLayout;

const menuItems = [
  { key: '/', label: '搜索分析', icon: <SearchOutlined /> },
  { key: '/reports', label: '报告列表', icon: <FileTextOutlined /> },
  { key: '/settings', label: '设置', icon: <SettingOutlined /> },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginRight: 40 }}>
          Web Report
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1 }}
        />
      </Header>
      <Content style={{ padding: 24 }}>{children}</Content>
    </AntLayout>
  );
}
