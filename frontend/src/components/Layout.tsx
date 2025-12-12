import Sidebar from './Sidebar';
import TabBar from './TabBar';
import { useTabs } from '../state/tabs';

export default function Layout() {
  const { tabs, activeTabId } = useTabs();
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col bg-surface">
        <div className="p-4 flex items-center justify-between border-b border-gray-800">
          <input
            placeholder="Buscar tickets, clientes..."
            className="bg-gray-900 rounded-lg px-3 py-2 w-96 border border-gray-800 focus:border-primary outline-none"
          />
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">Dark mode padrão</span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-emerald-300" />
          </div>
        </div>
        <TabBar />
        <div className="flex-1 overflow-auto p-4">{activeTab?.component ?? <EmptyState />}</div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center text-gray-500">
      Selecione um módulo na barra lateral para abrir uma aba.
    </div>
  );
}
