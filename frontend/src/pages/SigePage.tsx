import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';

type QueueItem = { id: string; ticketId: string; status: string; attempts: number; lastError?: string; updatedAt: string };

export default function SigePage() {
  const api = useApi();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [config, setConfig] = useState<any>();

  useEffect(() => {
    api
      .get('/sige/queue')
      .then((res) => setQueue(res.data))
      .catch(() => setQueue([]));
    api
      .get('/sige/config')
      .then((res) => setConfig(res.data))
      .catch(() => setConfig({ mode: 'mock' }));
  }, [api]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="glass p-4">
        <div className="text-lg font-semibold mb-2">Configuração</div>
        <div className="text-sm text-gray-400 mb-3">Modo: {config?.mode || 'mock'}</div>
        <div className="bg-gray-900 rounded-lg p-3 text-xs text-gray-300 border border-gray-800">
          Endpoint OS: {config?.osEndpoint || '/orders'}
          <br />
          Flag OS: {config?.osFlagField || 'is_os'}
        </div>
      </div>
      <div className="glass p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-lg font-semibold">Fila SIGE</div>
          <span className="text-xs text-gray-400">Reprocesso manual</span>
        </div>
        <div className="grid gap-2">
          {queue.length === 0 && <div className="text-sm text-gray-500">Sem pendências</div>}
          {queue.map((q) => (
            <div key={q.id} className="bg-gray-900 border border-gray-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Ticket {q.ticketId}</div>
                  <div className="text-xs text-gray-400">Status: {q.status}</div>
                </div>
                <button className="text-xs bg-primary text-black px-3 py-1 rounded">Reprocessar</button>
              </div>
              {q.lastError && <div className="text-xs text-red-400 mt-1">{q.lastError}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
