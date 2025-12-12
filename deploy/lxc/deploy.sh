#!/usr/bin/env bash
set -euo pipefail

# Deploy do Zendrix em container LXC já provisionado.
# Assume repositório já clonado em /opt/zendrix.

cd /opt/zendrix

if [ ! -f .env ]; then
  cp .env.example .env
fi

cd backend
pnpm install
pnpm prisma migrate deploy
pnpm prisma db seed
pnpm build
pm2 start dist/index.js --name zendrix-api --env production

cd ../frontend
pnpm install
pnpm build

# Servir frontend via pm2 usando vite preview ou nginx (aqui usamos preview para simplicidade)
pm2 start "pnpm preview --host --port 4173" --name zendrix-web

pm2 save
pm2 startup systemd -u root --hp /root

echo "Deploy concluído. API em :4000, frontend em :4173"
