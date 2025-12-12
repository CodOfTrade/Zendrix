import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';

type Ticket = {
  id: string;
  number: number;
  title: string;
  client?: { name: string };
  stage?: { name: string };
  priority?: { name: string };
};

export default function TicketsPage() {
  const api = useApi();
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    api
      .get('/tickets')
      .then((res) => setTickets(res.data))
      .catch(() =>
        setTickets([
          { id: '1', number: 101, title: 'Onboarding VPN', client: { name: 'Cliente Demo' }, stage: { name: 'Triagem' }, priority: { name: 'Normal' } },
          { id: '2', number: 102, title: 'Erro ERP', client: { name: 'Cliente Demo' }, stage: { name: 'Em andamento' }, priority: { name: 'Crítico' } }
        ])
      );
  }, [api]);

  const stages = ['Triagem', 'Em andamento', 'Aguardando', 'Fechado'];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold">Tickets</div>
          <div className="text-sm text-gray-400">Lista e visão Kanban por estágio</div>
        </div>
        <button className="bg-primary text-black px-4 py-2 rounded-lg">Novo ticket</button>
      </div>
      <div className="glass p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-400">Lista</div>
          <div className="text-xs text-gray-500">Colunas configuráveis</div>
        </div>
        <table className="w-full text-sm">
          <thead className="text-gray-400">
            <tr className="text-left">
              <th className="py-2">#</th>
              <th>Título</th>
              <th>Cliente</th>
              <th>Estágio</th>
              <th>Prioridade</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id} className="border-t border-gray-800 hover:bg-gray-900/60">
                <td className="py-2 text-gray-400">{t.number}</td>
                <td>{t.title}</td>
                <td className="text-gray-300">{t.client?.name}</td>
                <td>{t.stage?.name}</td>
                <td>{t.priority?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {stages.map((stage) => (
          <div key={stage} className="glass p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">{stage}</div>
              <span className="text-xs text-gray-400">
                {tickets.filter((t) => t.stage?.name === stage).length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {tickets
                .filter((t) => t.stage?.name === stage)
                .map((t) => (
                  <div key={t.id} className="bg-gray-900 rounded-lg p-2 border border-gray-800">
                    <div className="text-xs text-gray-400">#{t.number}</div>
                    <div className="font-semibold">{t.title}</div>
                    <div className="text-xs text-primary">{t.priority?.name}</div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
