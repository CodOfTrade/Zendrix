Integração SIGE Cloud - Exemplo de Configuração
-----------------------------------------------

Campos recomendados (ajustáveis na tela Integrações > SIGE Cloud):
- `baseUrl`: `https://api.sigecloud.com.br`
- `token`: Token de API gerado no SIGE.
- `osEndpoint`: `/orders` (ou rota usada para criar Pedido com flag de OS).
- `osFlagField`: `is_os` (campo booleano que marca pedido como Ordem de Serviço).
- `timeoutMs`: `10000`
- `retryCount`: `3`

Payload enviado ao fechar ticket (padrão):
```json
{
  "customer_id": "<external_id do cliente>",
  "contact_id": "<external_id do contato>",
  "reference": "ZD-<numero_do_ticket>",
  "title": "<titulo>",
  "description": "<descricao>",
  "solution": "<resumo_da_solucao>",
  "opened_at": "2025-01-01T12:00:00Z",
  "closed_at": "2025-01-02T15:00:00Z",
  "service_desk": "<mesa>",
  "service": "<servico>",
  "priority": "<prioridade>",
  "total_minutes": 120,
  "billable_amount": 300.5,
  "billing_notes": "<observacoes>",
  "is_os": true
}
```

Modos:
- `SIGE_MODE=mock`: não chama a API real; gera `mock-os-<ticket>`.
- `strict`: bloqueia fechamento se não conseguir criar OS.
- `flexible`: fecha e enfileira para reprocesso (tabela `sige_queue`).

Jobs de sincronização (clientes/contatos/contratos) são disparados ao acionar `/api/sige/sync` e processados pelo worker interno (`JobQueue`).
