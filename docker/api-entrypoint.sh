#!/bin/sh
# Applica le migrazioni prima di avviare il servizio.
# Il comando e' idempotente: Drizzle tiene traccia di cosa e' gia' stato applicato,
# quindi il riavvio di un container non rompe nulla.
set -e

echo "Applico le migrazioni del database..."
node --experimental-strip-types apps/api/src/db/migrate.ts

echo "Avvio del servizio."
exec "$@"
