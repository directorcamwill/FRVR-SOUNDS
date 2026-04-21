#!/usr/bin/env bash
# One-command offsite backup — tarballs the project + schema snapshot into
# iCloud Drive. Run any time with: bash scripts/backup.sh
# Apple's cloud sync handles the offsite copy automatically.

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="$HOME/Library/Mobile Documents/com~apple~CloudDocs/FRVR-Sounds-Backups"
TS=$(date +%Y%m%d-%H%M%S)

mkdir -p "$BACKUP_DIR"

echo "→ tarballing project (excluding node_modules, .next, build cache)…"
tar -czf "$BACKUP_DIR/frvr-sounds-$TS.tar.gz" \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='tsconfig.tsbuildinfo' \
  --exclude='.playwright-mcp' \
  -C "$(dirname "$PROJECT_DIR")" \
  "$(basename "$PROJECT_DIR")"

echo "→ snapshotting schema (all migrations combined)…"
cat "$PROJECT_DIR"/supabase/migrations/*.sql > "$BACKUP_DIR/schema-$TS.sql"

# Prune backups older than 30 days (keep the last month rolling)
find "$BACKUP_DIR" -name 'frvr-sounds-*.tar.gz' -mtime +30 -delete 2>/dev/null || true
find "$BACKUP_DIR" -name 'schema-*.sql' -mtime +30 -delete 2>/dev/null || true

echo ""
echo "✓ Backup complete:"
ls -lh "$BACKUP_DIR/frvr-sounds-$TS.tar.gz" "$BACKUP_DIR/schema-$TS.sql"
echo ""
echo "iCloud Drive will sync these offsite automatically."
