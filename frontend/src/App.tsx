import { useEffect } from 'react';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import { useTabs } from './state/tabs';

export default function App() {
  const openTab = useTabs((s) => s.openTab);
  useEffect(() => {
    openTab({ id: 'dashboard', title: 'Dashboard', path: '/dashboard', component: <DashboardPage /> });
  }, [openTab]);
  return <Layout />;
}
