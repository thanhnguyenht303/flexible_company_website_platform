#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

docker exec company_site_postgres pg_dump \
  -U "${DATABASE_USER:-company_user}" \
  "${DATABASE_NAME:-company_website}" > "$BACKUP_DIR/db_$TIMESTAMP.sql"

tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" public/uploads
echo "Backup completed: $TIMESTAMP"
