import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';

type Appointment = { id: string; title: string; startAt: string; endAt: string; ticketId?: string };

export default function AgendaPage() {
  const api = useApi();
  const [items, setItems] = useState<Appointment[]>([]);

  useEffect(() => {
    api
      .get('/agenda')
      .then((res) => setItems(res.data))
      .catch(() =>
        setItems([
          { id: 'ag1', title: 'Visita onsite', startAt: new Date().toISOString(), endAt: new Date(Date.now() + 3600000).toISOString() }
        ])
      );
  }, [api]);

  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xl font-semibold">Agenda</div>
          <div className="text-sm text-gray-400">Compromissos, ausências e recorrências</div>
        </div>
        <button className="bg-primary text-black px-4 py-2 rounded-lg">Novo compromisso</button>
      </div>
      <div className="grid gap-3">
        {items.map((i) => (
          <div key={i.id} className="bg-gray-900 p-3 rounded-lg border border-gray-800">
            <div className="font-semibold">{i.title}</div>
            <div className="text-xs text-gray-400">
              {new Date(i.startAt).toLocaleString()} - {new Date(i.endAt).toLocaleString()}
            </div>
            {i.ticketId && <div className="text-xs text-primary">Ticket vinculado: {i.ticketId}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
