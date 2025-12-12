import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';

type Client = { id: string; name: string; tags?: string[]; contracts?: any[]; contacts?: any[] };

export default function ClientsPage() {
  const api = useApi();
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    api
      .get('/clients')
      .then((res) => setClients(res.data))
      .catch(() => setClients([{ id: 'c1', name: 'Cliente Demo', tags: ['demo'], contracts: [], contacts: [] }]));
  }, [api]);

  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xl font-semibold">Clientes</div>
          <div className="text-sm text-gray-400">Resumo com contratos, tickets e ativos</div>
        </div>
        <button className="bg-primary text-black px-4 py-2 rounded-lg">Novo cliente</button>
      </div>
      <table className="w-full text-sm">
        <thead className="text-gray-400">
          <tr className="text-left">
            <th className="py-2">Nome</th>
            <th>Tags</th>
            <th>Contratos</th>
            <th>Contatos</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id} className="border-t border-gray-800 hover:bg-gray-900/60">
              <td className="py-2">{c.name}</td>
              <td className="text-xs text-primary">{c.tags?.join(', ')}</td>
              <td>{c.contracts?.length || 0}</td>
              <td>{c.contacts?.length || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
