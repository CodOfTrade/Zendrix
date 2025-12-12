Credenciais e variáveis de ambiente geradas
-------------------------------------------

Arquivo `.env` pronto para uso (produção no CT; ajuste se mudar host/portas):
```
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://zendrix:zendrix@localhost:5432/zendrix

JWT_SECRET=5e823f1bb2c84c31a44f26d6d4fb2a3f2f3f9c7d8b6a4e19c3d1f7b0a6c9e2f5
JWT_REFRESH_SECRET=71c9e5b4d9f24a0f8c6b3a1d5e7f9024b6c3d5f7a9b1c2d3e4f5a6b7c8d9e0f1
PEPPER=9c4f1d7a3b2e5c8f0a6d9b3c1e4f7a9d2c5b8e1f3a6c9d0b2e4f6a8c1d3b5e7
RATE_LIMIT_MAX=10
RATE_LIMIT_WINDOW=60000

SIGE_MODE=mock
SIGE_BASE_URL=https://api.sigecloud.com.br
SIGE_TOKEN=3f1a7c9e2d5b4a6c8f0d1e3b5c7a9d2f4b6c8e0a2d4f6b8c0e2d4f6a8c1b3d5
SIGE_OS_ENDPOINT=/orders
SIGE_OS_FLAG_FIELD=is_os

EMAIL_FROM=noreply@zendrix.local
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=

FRONTEND_URL=http://localhost:5173
FILE_STORAGE=local
FILE_STORAGE_PATH=./uploads
```

Notas rápidas:
- Ajuste `DATABASE_URL` se o Postgres não estiver em localhost ou se trocar senha do usuário.
- Troque `SIGE_TOKEN` quando for integrar com SIGE real.
- `SIGE_MODE=mock` mantém integração simulada; mude para live quando estiver pronto.
- Segredos (`JWT_*` e `PEPPER`) já são valores fortes; regenerar se expor o arquivo.***
