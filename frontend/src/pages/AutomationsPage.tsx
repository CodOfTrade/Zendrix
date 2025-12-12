import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';

type Automation = { id: string; name: string; trigger: any; actions: any[]; active: boolean };

export default function AutomationsPage() {
  const api = useApi();
  const [items, setItems] = useState<Automation[]>([]);

  useEffect(() => {
    api
      .get('/automations')
      .then((res) => setItems(res.data))
      .catch(() =>
        setItems([
          { id: 'auto1', name: 'Alerta SLA', trigger: { event: 'sla_warning' }, actions: [{ type: 'notify' }], active: true }
        ])
      );
  }, [api]);

  return (
    <div className="glass p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold">Automações</div>
          <div className="text-sm text-gray-400">Gatilhos e ações para tickets/agenda/alertas</div>
        </div>
        <button className="bg-primary text-black px-4 py-2 rounded-lg">Nova automação</button>
      </div>
      <div className="grid gap-2">
        {items.map((a) => (
          <div key={a.id} className="bg-gray-900 border border-gray-800 rounded-lg p-3 flex items-center justify-between">
            <div>
              <div className="font-semibold">{a.name}</div>
              <div className="text-xs text-gray-400">Gatilho: {a.trigger?.event}</div>
            </div>
            <div className="text-xs text-primary">{a.actions.map((x) => x.type).join(', ')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
