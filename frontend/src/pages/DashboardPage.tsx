export default function DashboardPage() {
  const cards = [
    { label: 'Tickets abertos', value: '32', trend: '+4 hoje' },
    { label: 'SLA dentro', value: '91%', trend: '3 alertas' },
    { label: 'CSAT', value: '4.7/5', trend: 'últimos 30 dias' },
    { label: 'Tickets a faturar', value: '12', trend: 'R$ 8.400' }
  ];
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="glass p-4">
          <div className="text-sm text-gray-400">{c.label}</div>
          <div className="text-2xl font-semibold mt-2">{c.value}</div>
          <div className="text-xs text-primary mt-1">{c.trend}</div>
        </div>
      ))}
      <div className="col-span-2 glass p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">SLA (primeira resposta)</div>
          <span className="text-xs text-gray-400">Hoje</span>
        </div>
        <div className="h-36 bg-gradient-to-r from-primary/30 to-emerald-300/20 rounded-lg border border-gray-800" />
      </div>
      <div className="col-span-2 glass p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">Distribuição por mesa</div>
          <span className="text-xs text-gray-400">Real-time</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {['Suporte N1', 'Projetos', 'Field'].map((m) => (
            <div key={m} className="bg-gray-900 rounded-lg p-3">
              <div className="text-sm text-gray-400">{m}</div>
              <div className="text-xl font-semibold mt-1">{Math.floor(Math.random() * 15) + 5}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
