import { useTabs } from '../state/tabs';
import TicketsPage from '../pages/TicketsPage';
import DashboardPage from '../pages/DashboardPage';
import ClientsPage from '../pages/ClientsPage';
import AutomationsPage from '../pages/AutomationsPage';
import SigePage from '../pages/SigePage';
import AssetsPage from '../pages/AssetsPage';
import AgendaPage from '../pages/AgendaPage';

const links = [
  { id: 'dashboard', title: 'Dashboard', component: <DashboardPage /> },
  { id: 'tickets', title: 'Tickets', component: <TicketsPage /> },
  { id: 'clients', title: 'Clientes', component: <ClientsPage /> },
  { id: 'assets', title: 'Recursos', component: <AssetsPage /> },
  { id: 'agenda', title: 'Agenda', component: <AgendaPage /> },
  { id: 'automations', title: 'Automações', component: <AutomationsPage /> },
  { id: 'sige', title: 'SIGE Cloud', component: <SigePage /> }
];

export default function Sidebar() {
  const openTab = useTabs((s) => s.openTab);
  return (
    <div className="w-60 bg-surfaceAlt h-screen p-4 flex flex-col gap-4">
      <div className="text-xl font-semibold text-primary">Zendrix</div>
      <div className="flex-1 flex flex-col gap-2">
        {links.map((link) => (
          <button
            key={link.id}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-800 transition"
            onClick={() => openTab({ id: link.id, title: link.title, path: `/${link.id}`, component: link.component })}
          >
            {link.title}
          </button>
        ))}
      </div>
    </div>
  );
}
