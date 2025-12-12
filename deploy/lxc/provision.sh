#!/usr/bin/env bash
set -euo pipefail

# Provisiona container LXC (Ubuntu) para rodar Zendrix (backend, frontend e Postgres)
# Execute dentro do container como root.

apt-get update
apt-get install -y curl gnupg ca-certificates git build-essential

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pnpm pm2

# PostgreSQL
apt-get install -y postgresql postgresql-contrib
sudo -u postgres psql -c "CREATE USER zendrix WITH PASSWORD 'zendrix';" || true
sudo -u postgres psql -c "CREATE DATABASE zendrix OWNER zendrix;" || true

mkdir -p /opt/zendrix
adduser --system --group --home /opt/zendrix zendrix || true
chown -R zendrix:zendrix /opt/zendrix

echo "Provisionamento concluído. Clone o repositório em /opt/zendrix e execute deploy.sh."
