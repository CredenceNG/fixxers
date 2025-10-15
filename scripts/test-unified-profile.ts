/**
 * Test Unified Profile Implementation
 *
 * Tests:
 * 1. Unified profile API - GET returns name without profile
 * 2. Unified profile API - POST creates both profiles for dual-role users
 * 3. Profile data merge - shared fields match between profiles
 * 4. Old route redirects - /client/profile and /fixer/profile redirect to /profile
 */

import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3010';
const JWT_SECRET = process.env.JWT_SECRET || 'iat%@VlZc51MXXwCfCK2w3&MI3AJwKtO';

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function addResult(test: string, passed: boolean, message: string) {
  results.push({ test, passed, message });
  const icon = passed ? '✅' : '❌';
  log(`${icon} ${test}: ${message}`);
}

function generateSessionToken(userId: string, roles: string[], email: string, hasClientProfile: boolean, hasFixerProfile: boolean): string {
  const payload = {
    userId,
    email,
    role: roles[0], // Primary role
    roles,
    hasClientProfile,
    hasFixerProfile,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
  };
  return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });
}

async function testUnifiedProfileGET() {
  log('\n=== Test 1: GET /api/profile - Returns name without profile ===');

  const testEmail = `test-get-${Date.now()}@example.com`;
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      name: 'Test GET User',
      role: 'CLIENT',
      roles: ['CLIENT'],
      status: 'ACTIVE',
    },
  });

  const sessionToken = generateSessionToken(user.id, ['CLIENT'], testEmail, false, false);

  try {
    const response = await fetch(`${BASE_URL}/api/profile`, {
      headers: { Cookie: `session=${sessionToken}` },
    });

    if (!response.ok) {
      addResult('GET /api/profile', false, `Status: ${response.status}`);
    } else {
      const data = await response.json();
      if (data.name === user.name) {
        addResult('GET /api/profile', true, 'Returns user name without profile');
      } else {
        addResult('GET /api/profile', false, `Expected name "${user.name}", got "${data.name}"`);
      }
    }
  } catch (error: any) {
    addResult('GET /api/profile', false, `Error: ${error.message}`);
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
  }
}

async function testUnifiedProfilePOST() {
  log('\n=== Test 2: POST /api/profile - Creates both profiles for dual-role user ===');

  const testEmail = `test-post-${Date.now()}@example.com`;
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      name: 'Test POST User',
      role: 'CLIENT',
      roles: ['CLIENT', 'FIXER'],
      status: 'ACTIVE',
    },
  });

  const sessionToken = generateSessionToken(user.id, ['CLIENT', 'FIXER'], testEmail, false, false);

  try {
    const neighborhood = await prisma.neighborhood.findFirst();
    if (!neighborhood) {
      addResult('POST /api/profile', false, 'No neighborhoods in database');
      return;
    }

    const profileData = {
      name: 'Updated Name',
      primaryPhone: '+2348012345678',
      secondaryPhone: '+2348087654321',
      neighbourhoodId: neighborhood.id,
      streetAddress: '123 Test Street',
      alternateEmail: 'alternate@example.com',
      yearsOfService: '5',
      qualifications: 'Test qualifications',
      roles: ['CLIENT', 'FIXER'],
    };

    const response = await fetch(`${BASE_URL}/api/profile`, {
      method: 'POST',
      headers: {
        Cookie: `session=${sessionToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      addResult('POST /api/profile', false, `Status: ${response.status}, Error: ${errorData.error || 'Unknown'}`);
    } else {
      // Verify both profiles were created
      const clientProfile = await prisma.clientProfile.findUnique({
        where: { clientId: user.id },
      });

      const fixerProfile = await prisma.fixerProfile.findUnique({
        where: { fixerId: user.id },
      });

      if (clientProfile && fixerProfile) {
        addResult('POST /api/profile - Profile Creation', true, 'Created both ClientProfile and FixerProfile');
      } else {
        addResult('POST /api/profile - Profile Creation', false, `ClientProfile: ${clientProfile ? 'exists' : 'missing'}, FixerProfile: ${fixerProfile ? 'exists' : 'missing'}`);
      }
    }
  } catch (error: any) {
    addResult('POST /api/profile', false, `Error: ${error.message}`);
  } finally {
    await prisma.clientProfile.deleteMany({ where: { clientId: user.id } });
    await prisma.fixerProfile.deleteMany({ where: { fixerId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
}

async function testSharedFieldsMatch() {
  log('\n=== Test 3: Shared fields match between ClientProfile and FixerProfile ===');

  const testEmail = `test-shared-${Date.now()}@example.com`;
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      name: 'Test Shared User',
      role: 'CLIENT',
      roles: ['CLIENT', 'FIXER'],
      status: 'ACTIVE',
    },
  });

  const sessionToken = generateSessionToken(user.id, ['CLIENT', 'FIXER'], testEmail, false, false);

  try {
    const neighborhood = await prisma.neighborhood.findFirst();
    if (!neighborhood) {
      addResult('Shared Fields Test', false, 'No neighborhoods in database');
      return;
    }

    const profileData = {
      name: 'Shared Test User',
      primaryPhone: '+2348012345678',
      secondaryPhone: '+2348087654321',
      neighbourhoodId: neighborhood.id,
      streetAddress: '123 Test Street',
      alternateEmail: 'alternate@example.com',
      yearsOfService: '5',
      qualifications: 'Test qualifications',
      roles: ['CLIENT', 'FIXER'],
    };

    const response = await fetch(`${BASE_URL}/api/profile`, {
      method: 'POST',
      headers: {
        Cookie: `session=${sessionToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      addResult('Shared Fields Test', false, `Failed to save profile: ${response.status}`);
      return;
    }

    // Verify shared fields match
    const clientProfile = await prisma.clientProfile.findUnique({
      where: { clientId: user.id },
    });

    const fixerProfile = await prisma.fixerProfile.findUnique({
      where: { fixerId: user.id },
    });

    if (!clientProfile || !fixerProfile) {
      addResult('Shared Fields Test', false, 'Profiles not created');
      return;
    }

    const sharedFieldsMatch =
      clientProfile.primaryPhone === fixerProfile.primaryPhone &&
      clientProfile.secondaryPhone === fixerProfile.secondaryPhone &&
      clientProfile.neighbourhood === fixerProfile.neighbourhood &&
      clientProfile.city === fixerProfile.city &&
      clientProfile.state === fixerProfile.state &&
      clientProfile.streetAddress === fixerProfile.streetAddress;

    if (sharedFieldsMatch) {
      addResult('Shared Fields Match', true, 'All shared fields match between profiles');
    } else {
      addResult('Shared Fields Match', false, 'Shared fields do not match');
      log(`  ClientProfile: phone=${clientProfile.primaryPhone}, neighbourhood=${clientProfile.neighbourhood}`);
      log(`  FixerProfile: phone=${fixerProfile.primaryPhone}, neighbourhood=${fixerProfile.neighbourhood}`);
    }
  } catch (error: any) {
    addResult('Shared Fields Test', false, `Error: ${error.message}`);
  } finally {
    await prisma.clientProfile.deleteMany({ where: { clientId: user.id } });
    await prisma.fixerProfile.deleteMany({ where: { fixerId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
}

async function testOldRouteRedirects() {
  log('\n=== Test 4: Old profile routes redirect to /profile ===');

  const testEmail = `test-redirect-${Date.now()}@example.com`;
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      name: 'Test Redirect User',
      role: 'CLIENT',
      roles: ['CLIENT', 'FIXER'],
      status: 'ACTIVE',
    },
  });

  const sessionToken = generateSessionToken(user.id, ['CLIENT', 'FIXER'], testEmail, false, false);

  try {
    // Test /client/profile redirect
    const clientResponse = await fetch(`${BASE_URL}/client/profile`, {
      headers: { Cookie: `session=${sessionToken}` },
      redirect: 'manual',
    });

    if (clientResponse.status === 307 || clientResponse.status === 308) {
      const location = clientResponse.headers.get('location');
      if (location?.includes('/profile')) {
        addResult('Client Profile Redirect', true, '/client/profile → /profile');
      } else {
        addResult('Client Profile Redirect', false, `Redirected to ${location}`);
      }
    } else {
      addResult('Client Profile Redirect', false, `Expected redirect, got ${clientResponse.status}`);
    }

    // Test /fixer/profile redirect
    const fixerResponse = await fetch(`${BASE_URL}/fixer/profile`, {
      headers: { Cookie: `session=${sessionToken}` },
      redirect: 'manual',
    });

    if (fixerResponse.status === 307 || fixerResponse.status === 308) {
      const location = fixerResponse.headers.get('location');
      if (location?.includes('/profile')) {
        addResult('Fixer Profile Redirect', true, '/fixer/profile → /profile');
      } else {
        addResult('Fixer Profile Redirect', false, `Redirected to ${location}`);
      }
    } else {
      addResult('Fixer Profile Redirect', false, `Expected redirect, got ${fixerResponse.status}`);
    }
  } catch (error: any) {
    addResult('Old Route Redirect Test', false, `Error: ${error.message}`);
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
  }
}

async function testMiddlewareRedirect() {
  log('\n=== Test 5: Middleware redirects incomplete profiles to /profile ===');

  const testEmail = `test-middleware-${Date.now()}@example.com`;
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      name: 'Test Middleware User',
      role: 'CLIENT',
      status: 'ACTIVE',
    },
  });

  // Generate token without profile flags
  const sessionToken = generateSessionToken(user.id, ['CLIENT'], testEmail, false, false);

  try {
    // Try to access client dashboard - should redirect to /profile
    const response = await fetch(`${BASE_URL}/client/dashboard`, {
      headers: { Cookie: `session=${sessionToken}` },
      redirect: 'manual',
    });

    if (response.status === 307 || response.status === 308) {
      const location = response.headers.get('location');
      if (location?.includes('/profile')) {
        addResult('Middleware Redirect', true, 'Incomplete profile redirected to /profile');
      } else {
        addResult('Middleware Redirect', false, `Redirected to ${location}`);
      }
    } else {
      addResult('Middleware Redirect', false, `Expected redirect, got ${response.status}`);
    }
  } catch (error: any) {
    addResult('Middleware Redirect Test', false, `Error: ${error.message}`);
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
  }
}

async function runTests() {
  log('Starting Unified Profile Tests...\n');

  try {
    await testUnifiedProfileGET();
    await testUnifiedProfilePOST();
    await testSharedFieldsMatch();
    await testOldRouteRedirects();
    await testMiddlewareRedirect();

    // Summary
    log('\n=== Test Summary ===');
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const percentage = ((passed / total) * 100).toFixed(1);

    log(`\nTotal: ${total} tests`);
    log(`Passed: ${passed} (${percentage}%)`);
    log(`Failed: ${total - passed}`);

    if (passed === total) {
      log('\n🎉 All tests passed!');
    } else {
      log('\n⚠️  Some tests failed. Review the results above.');
    }

    // Show failed tests
    const failed = results.filter(r => !r.passed);
    if (failed.length > 0) {
      log('\nFailed tests:');
      failed.forEach(r => {
        log(`  ❌ ${r.test}: ${r.message}`);
      });
    }
  } catch (error) {
    log(`\n❌ Test suite error: ${error}`);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
runTests();
