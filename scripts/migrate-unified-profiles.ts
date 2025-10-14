/**
 * Migration Script: Sync Profiles for Dual-Role Users
 *
 * This script ensures data consistency for users with both CLIENT and FIXER roles by:
 * 1. Finding all dual-role users
 * 2. Syncing shared fields between ClientProfile and FixerProfile
 * 3. Creating missing profiles where needed
 * 4. Reporting on data inconsistencies
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SyncResult {
  userId: string;
  userName: string | null;
  userEmail: string | null;
  action: 'synced' | 'created_client' | 'created_fixer' | 'no_action' | 'error';
  details: string;
  inconsistencies?: string[];
}

async function findDualRoleUsers() {
  console.log('\n🔍 Finding users with both CLIENT and FIXER roles...\n');

  const users = await prisma.user.findMany({
    where: {
      roles: {
        hasEvery: ['CLIENT', 'FIXER']
      }
    },
    include: {
      clientProfile: true,
      fixerProfile: true
    }
  });

  console.log(`Found ${users.length} dual-role users\n`);
  return users;
}

async function findSingleRoleUsers() {
  console.log('\n🔍 Finding single-role users for statistics...\n');

  const clientOnly = await prisma.user.count({
    where: {
      roles: { has: 'CLIENT' },
      NOT: { roles: { has: 'FIXER' } }
    }
  });

  const fixerOnly = await prisma.user.count({
    where: {
      roles: { has: 'FIXER' },
      NOT: { roles: { has: 'CLIENT' } }
    }
  });

  console.log(`CLIENT-only users: ${clientOnly}`);
  console.log(`FIXER-only users: ${fixerOnly}\n`);

  return { clientOnly, fixerOnly };
}

function detectInconsistencies(clientProfile: any, fixerProfile: any): string[] {
  const inconsistencies: string[] = [];

  // Check shared fields for mismatches
  const sharedFields = [
    'primaryPhone',
    'secondaryPhone',
    'neighbourhood',
    'city',
    'state',
    'country',
    'streetAddress'
  ];

  for (const field of sharedFields) {
    const clientValue = clientProfile[field];
    const fixerValue = fixerProfile[field];

    // Skip if both are null/undefined
    if (!clientValue && !fixerValue) continue;

    // Report if values differ
    if (clientValue !== fixerValue) {
      inconsistencies.push(
        `${field}: Client="${clientValue}" vs Fixer="${fixerValue}"`
      );
    }
  }

  return inconsistencies;
}

async function syncProfiles(user: any, dryRun: boolean = false): Promise<SyncResult> {
  const result: SyncResult = {
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    action: 'no_action',
    details: '',
    inconsistencies: []
  };

  try {
    const { clientProfile, fixerProfile } = user;

    // Case 1: Both profiles exist - sync shared fields
    if (clientProfile && fixerProfile) {
      const inconsistencies = detectInconsistencies(clientProfile, fixerProfile);

      if (inconsistencies.length > 0) {
        result.inconsistencies = inconsistencies;

        // Use fixer profile as source of truth (usually more complete)
        if (!dryRun) {
          await prisma.clientProfile.update({
            where: { id: clientProfile.id },
            data: {
              primaryPhone: fixerProfile.primaryPhone,
              secondaryPhone: fixerProfile.secondaryPhone,
              neighbourhood: fixerProfile.neighbourhood,
              city: fixerProfile.city,
              state: fixerProfile.state,
              country: fixerProfile.country,
              streetAddress: fixerProfile.streetAddress,
            }
          });
        }

        result.action = 'synced';
        result.details = `Synced ${inconsistencies.length} fields from FixerProfile to ClientProfile`;
      } else {
        result.action = 'no_action';
        result.details = 'Profiles already in sync';
      }
    }
    // Case 2: Only fixer profile exists - create client profile
    else if (fixerProfile && !clientProfile) {
      if (!dryRun) {
        await prisma.clientProfile.create({
          data: {
            clientId: user.id,
            primaryPhone: fixerProfile.primaryPhone,
            secondaryPhone: fixerProfile.secondaryPhone,
            neighbourhood: fixerProfile.neighbourhood,
            city: fixerProfile.city,
            state: fixerProfile.state,
            country: fixerProfile.country,
            streetAddress: fixerProfile.streetAddress,
            alternateEmail: null,
          }
        });
      }

      result.action = 'created_client';
      result.details = 'Created ClientProfile from FixerProfile data';
    }
    // Case 3: Only client profile exists - create fixer profile
    else if (clientProfile && !fixerProfile) {
      if (!dryRun) {
        await prisma.fixerProfile.create({
          data: {
            fixerId: user.id,
            primaryPhone: clientProfile.primaryPhone,
            secondaryPhone: clientProfile.secondaryPhone,
            neighbourhood: clientProfile.neighbourhood,
            city: clientProfile.city,
            state: clientProfile.state,
            country: clientProfile.country,
            streetAddress: clientProfile.streetAddress,
            yearsOfService: 0, // Default - admin will need to verify
            qualifications: [],
            pendingChanges: true,
          }
        });
      }

      result.action = 'created_fixer';
      result.details = 'Created FixerProfile from ClientProfile data (needs admin verification)';
    }
    // Case 4: Neither profile exists
    else {
      result.action = 'no_action';
      result.details = 'No profiles to sync (user has not completed any profile)';
    }

  } catch (error: any) {
    result.action = 'error';
    result.details = `Error: ${error.message}`;
  }

  return result;
}

async function runMigration(dryRun: boolean = true) {
  console.log('═'.repeat(70));
  console.log('  PROFILE MIGRATION SCRIPT');
  console.log('═'.repeat(70));
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN (no changes will be made)' : '⚡ LIVE MODE (changes will be applied)'}`);
  console.log('═'.repeat(70));

  // Get statistics
  const { clientOnly, fixerOnly } = await findSingleRoleUsers();
  const dualRoleUsers = await findDualRoleUsers();

  if (dualRoleUsers.length === 0) {
    console.log('✅ No dual-role users found. No migration needed.\n');
    return;
  }

  // Process each dual-role user
  console.log('📋 Processing dual-role users...\n');
  const results: SyncResult[] = [];

  for (const user of dualRoleUsers) {
    const result = await syncProfiles(user, dryRun);
    results.push(result);

    // Print result
    const icon = result.action === 'error' ? '❌' :
                 result.action === 'no_action' ? '⚪' : '✅';

    console.log(`${icon} ${user.name || user.email || user.id}`);
    console.log(`   Action: ${result.action}`);
    console.log(`   Details: ${result.details}`);

    if (result.inconsistencies && result.inconsistencies.length > 0) {
      console.log(`   Inconsistencies found:`);
      result.inconsistencies.forEach(inc => {
        console.log(`     - ${inc}`);
      });
    }
    console.log('');
  }

  // Summary
  console.log('═'.repeat(70));
  console.log('  MIGRATION SUMMARY');
  console.log('═'.repeat(70));

  const summary = {
    total: results.length,
    synced: results.filter(r => r.action === 'synced').length,
    createdClient: results.filter(r => r.action === 'created_client').length,
    createdFixer: results.filter(r => r.action === 'created_fixer').length,
    noAction: results.filter(r => r.action === 'no_action').length,
    errors: results.filter(r => r.action === 'error').length,
  };

  console.log(`Total dual-role users: ${summary.total}`);
  console.log(`Profiles synced: ${summary.synced}`);
  console.log(`ClientProfiles created: ${summary.createdClient}`);
  console.log(`FixerProfiles created: ${summary.createdFixer}`);
  console.log(`No action needed: ${summary.noAction}`);
  console.log(`Errors: ${summary.errors}`);
  console.log('');

  if (dryRun) {
    console.log('💡 This was a dry run. Run with --live flag to apply changes.');
  } else {
    console.log('✅ Migration completed successfully!');
  }

  console.log('═'.repeat(70));
}

// CLI execution
const args = process.argv.slice(2);
const isLiveMode = args.includes('--live');

runMigration(!isLiveMode)
  .then(() => {
    console.log('\n✨ Script completed\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
