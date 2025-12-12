#!/usr/bin/env bash
set -euo pipefail

DATE=$(date +"%Y%m%d-%H%M%S")
OUT="zendrix-backup-$DATE.sql"

PGUSER=${PGUSER:-zendrix}
PGDATABASE=${PGDATABASE:-zendrix}

pg_dump -U "$PGUSER" "$PGDATABASE" > "$OUT"
echo "Backup salvo em $OUT"
