import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';

type Asset = { id: string; type: string; serviceTag: string; managed: boolean; status?: string; clientId?: string };

export default function AssetsPage() {
  const api = useApi();
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    api
      .get('/assets')
      .then((res) => setAssets(res.data))
      .catch(() =>
        setAssets([
          { id: 'a1', type: 'Notebook', serviceTag: 'ABC123', managed: true, status: 'Ativo' },
          { id: 'a2', type: 'Monitor', serviceTag: 'XYZ987', managed: false, status: 'Estoque' }
        ])
      );
  }, [api]);

  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xl font-semibold">Recursos/Ativos</div>
          <div className="text-sm text-gray-400">Inventário + limites por contrato</div>
        </div>
        <button className="bg-primary text-black px-4 py-2 rounded-lg">Adicionar recurso</button>
      </div>
      <table className="w-full text-sm">
        <thead className="text-gray-400">
          <tr className="text-left">
            <th className="py-2">Tipo</th>
            <th>Service Tag</th>
            <th>Gerenciado</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((a) => (
            <tr key={a.id} className="border-t border-gray-800 hover:bg-gray-900/60">
              <td className="py-2">{a.type}</td>
              <td>{a.serviceTag}</td>
              <td>{a.managed ? 'SIM' : 'NÃO'}</td>
              <td>{a.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
