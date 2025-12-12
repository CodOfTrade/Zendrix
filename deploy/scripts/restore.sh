#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Uso: $0 arquivo.sql"
  exit 1
fi

FILE=$1
PGUSER=${PGUSER:-zendrix}
PGDATABASE=${PGDATABASE:-zendrix}

psql -U "$PGUSER" "$PGDATABASE" < "$FILE"
echo "Restore concluído"
