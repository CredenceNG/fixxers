#!/bin/bash

# Fix all test files in the tests directory

cd /Users/itopa/projects/nextjs-fixxers

# Find all test files and process them
for file in tests/**/*.test.ts; do
  echo "Fixing $file..."

  # Remove duplicate import line and fix syntax errors
  sed -i '' '/^import { prismaMock } from "\.\/setup";$/d' "$file"

  # Fix broken vi.fn( to vi.fn()
  sed -i '' 's/vi\.fn\(/vi.fn()/g' "$file"

  # Fix relative import path
  if [[ "$file" == tests/*/* ]]; then
    # File is in a subdirectory, use ../setup
    sed -i '' 's|from "./setup"|from "../setup"|g' "$file"
  else
    # File is directly in tests, use ./setup
    sed -i '' 's|from "../setup"|from "./setup"|g' "$file"
  fi

  # Add prisma import if not present
  if ! grep -q "import { prisma }" "$file"; then
    sed -i '' "/import { prismaMock }/i\\
import { prisma } from '@/lib/prisma';\\
" "$file"
  fi

  # Fix dispute test
  sed -i '' 's/(prisma\.dispute as any)\.create\.mockResolvedValue/prismaMock.dispute.create.mockResolvedValue/g' "$file"
  sed -i '' 's/(prisma\.dispute as any)\.create(/prismaMock.dispute.create(/g' "$file"
done

echo "Done!"
