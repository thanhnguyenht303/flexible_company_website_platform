#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: scripts/restore-db.sh backups/db_YYYYMMDD_HHMMSS.sql"
  exit 1
fi

docker exec -i company_site_postgres psql \
  -U "${DATABASE_USER:-company_user}" \
  "${DATABASE_NAME:-company_website}" < "$1"

echo "Database restore completed."
