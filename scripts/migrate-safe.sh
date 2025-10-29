#!/bin/bash

# Safe migration script that handles already-applied migrations
# This is useful when schema was previously applied with db:push

echo "Running safe database migration..."

# Try to deploy migrations
npx prisma migrate deploy 2>&1 | tee migrate.log

# Check if migration failed due to already existing objects
if grep -q "already exists" migrate.log; then
  echo "⚠️  Migration objects already exist. Marking migration as resolved..."

  # Mark the migration as applied without running it
  npx prisma migrate resolve --applied 20251028200836_add_user_activity_analytics

  echo "✅ Migration marked as resolved"
  rm migrate.log
  exit 0
elif grep -q "error" migrate.log; then
  echo "❌ Migration failed with unexpected error"
  cat migrate.log
  rm migrate.log
  exit 1
else
  echo "✅ Migrations applied successfully"
  rm migrate.log
  exit 0
fi
