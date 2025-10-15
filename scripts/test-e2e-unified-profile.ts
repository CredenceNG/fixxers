/**
 * End-to-End Test for Unified Profile Implementation
 *
 * Tests the complete flow:
 * 1. Register new user with dual roles (CLIENT + FIXER)
 * 2. Login via magic link
 * 3. Complete unified profile
 * 4. Verify both profiles are created with matching shared fields
 * 5. Test old route redirects
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3010';
const TEST_EMAIL = 'fixi-test1@yopmail.com';
const TEST_NAME = 'Fixi Test User';

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

async function cleanup() {
  log('\n=== Cleanup: Removing test user if exists ===');
  const user = await prisma.user.findUnique({
    where: { email: TEST_EMAIL },
  });

  if (user) {
    await prisma.clientProfile.deleteMany({ where: { clientId: user.id } });
    await prisma.fixerProfile.deleteMany({ where: { fixerId: user.id } });
    await prisma.magicLink.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    log('Cleaned up existing test user');
  }
}

async function testRegistration() {
  log('\n=== Test 1: User Registration ===');

  try {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        name: TEST_NAME,
        roles: ['CLIENT', 'FIXER'],
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      addResult('Registration', false, `Failed: ${data.error || 'Unknown error'}`);
      return false;
    }

    const data = await response.json();

    // Verify user was created in database
    const user = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
    });

    if (!user) {
      addResult('Registration', false, 'User not found in database after registration');
      return false;
    }

    if (user.name === TEST_NAME && user.status === 'PENDING') {
      addResult('Registration', true, `User created: ${user.email}, status: ${user.status}`);
      return true;
    } else {
      addResult('Registration', false, `Unexpected user data: name=${user.name}, status=${user.status}`);
      return false;
    }
  } catch (error: any) {
    addResult('Registration', false, `Error: ${error.message}`);
    return false;
  }
}

async function testMagicLinkLogin() {
  log('\n=== Test 2: Magic Link Login ===');

  try {
    // Request login
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL }),
    });

    if (!loginResponse.ok) {
      addResult('Magic Link Request', false, `Login request failed: ${loginResponse.status}`);
      return null;
    }

    // Get magic link from database
    const magicLink = await prisma.magicLink.findFirst({
      where: { user: { email: TEST_EMAIL } },
      orderBy: { createdAt: 'desc' },
    });

    if (!magicLink) {
      addResult('Magic Link Request', false, 'Magic link not found in database');
      return null;
    }

    addResult('Magic Link Request', true, `Magic link created: ${magicLink.token.substring(0, 20)}...`);

    // Verify the magic link
    const verifyResponse = await fetch(`${BASE_URL}/api/auth/verify?token=${magicLink.token}`, {
      redirect: 'manual',
    });

    const cookies = verifyResponse.headers.get('set-cookie');
    if (!cookies) {
      addResult('Magic Link Verification', false, 'No session cookie returned');
      return null;
    }

    // Extract session token
    const sessionMatch = cookies.match(/session=([^;]+)/);
    if (!sessionMatch) {
      addResult('Magic Link Verification', false, 'Session cookie not found');
      return null;
    }

    const sessionToken = sessionMatch[1];
    addResult('Magic Link Verification', true, `Session token obtained: ${sessionToken.substring(0, 30)}...`);

    // Verify user is now ACTIVE
    const user = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
    });

    if (user?.status === 'ACTIVE') {
      addResult('User Activation', true, 'User status changed to ACTIVE');
    } else {
      addResult('User Activation', false, `User status is ${user?.status}`);
    }

    return sessionToken;
  } catch (error: any) {
    addResult('Magic Link Login', false, `Error: ${error.message}`);
    return null;
  }
}

async function testMiddlewareRedirect(sessionToken: string) {
  log('\n=== Test 3: Middleware Redirect to /profile ===');

  try {
    // Try to access dashboard - should redirect to /profile
    const response = await fetch(`${BASE_URL}/client/dashboard`, {
      headers: { Cookie: `session=${sessionToken}` },
      redirect: 'manual',
    });

    if (response.status === 307 || response.status === 308) {
      const location = response.headers.get('location');
      if (location?.includes('/profile')) {
        addResult('Middleware Redirect', true, 'User without profile redirected to /profile');
        return true;
      } else {
        addResult('Middleware Redirect', false, `Redirected to ${location} instead of /profile`);
        return false;
      }
    } else {
      addResult('Middleware Redirect', false, `Expected redirect, got ${response.status}`);
      return false;
    }
  } catch (error: any) {
    addResult('Middleware Redirect', false, `Error: ${error.message}`);
    return false;
  }
}

async function testProfileAPI(sessionToken: string) {
  log('\n=== Test 4: Unified Profile API ===');

  try {
    // Test GET endpoint - should return user name
    const getResponse = await fetch(`${BASE_URL}/api/profile`, {
      headers: { Cookie: `session=${sessionToken}` },
    });

    if (!getResponse.ok) {
      addResult('GET /api/profile', false, `Status: ${getResponse.status}`);
      return false;
    }

    const getData = await getResponse.json();
    if (getData.name === TEST_NAME) {
      addResult('GET /api/profile', true, 'Returns user name for pre-population');
    } else {
      addResult('GET /api/profile', false, `Expected name "${TEST_NAME}", got "${getData.name}"`);
      return false;
    }

    // Get a neighborhood for profile creation
    const neighborhood = await prisma.neighborhood.findFirst();
    if (!neighborhood) {
      addResult('Profile Creation', false, 'No neighborhoods in database');
      return false;
    }

    // Test POST endpoint - save unified profile
    const profileData = {
      name: TEST_NAME,
      primaryPhone: '+2348012345678',
      secondaryPhone: '+2348087654321',
      neighbourhoodId: neighborhood.id,
      streetAddress: '123 Test Street',
      alternateEmail: 'alt@example.com',
      yearsOfService: '5',
      qualifications: 'Professional Fixer with 5 years experience',
      roles: ['CLIENT', 'FIXER'],
    };

    const postResponse = await fetch(`${BASE_URL}/api/profile`, {
      method: 'POST',
      headers: {
        Cookie: `session=${sessionToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    if (!postResponse.ok) {
      const errorData = await postResponse.json();
      addResult('POST /api/profile', false, `Status: ${postResponse.status}, Error: ${errorData.error || 'Unknown'}`);
      return false;
    }

    addResult('POST /api/profile', true, 'Profile saved successfully');

    // Verify both profiles were created
    const user = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
      include: {
        clientProfile: true,
        fixerProfile: true,
      },
    });

    if (!user) {
      addResult('Profile Verification', false, 'User not found');
      return false;
    }

    if (user.clientProfile && user.fixerProfile) {
      addResult('Profile Creation', true, 'Both ClientProfile and FixerProfile created');

      // Verify shared fields match
      const sharedFieldsMatch =
        user.clientProfile.primaryPhone === user.fixerProfile.primaryPhone &&
        user.clientProfile.secondaryPhone === user.fixerProfile.secondaryPhone &&
        user.clientProfile.neighbourhood === user.fixerProfile.neighbourhood &&
        user.clientProfile.city === user.fixerProfile.city &&
        user.clientProfile.state === user.fixerProfile.state &&
        user.clientProfile.streetAddress === user.fixerProfile.streetAddress;

      if (sharedFieldsMatch) {
        addResult('Shared Fields Match', true, 'All shared fields match between profiles');
      } else {
        addResult('Shared Fields Match', false, 'Shared fields do not match');
        log(`  ClientProfile: phone=${user.clientProfile.primaryPhone}, neighbourhood=${user.clientProfile.neighbourhood}`);
        log(`  FixerProfile: phone=${user.fixerProfile.primaryPhone}, neighbourhood=${user.fixerProfile.neighbourhood}`);
      }

      // Verify CLIENT-only field
      if (user.clientProfile.alternateEmail === profileData.alternateEmail) {
        addResult('Client-only Fields', true, 'Client-specific fields saved correctly');
      } else {
        addResult('Client-only Fields', false, 'Alternate email not saved');
      }

      // Verify FIXER-only fields
      if (
        user.fixerProfile.yearsOfService === parseInt(profileData.yearsOfService) &&
        user.fixerProfile.qualifications === profileData.qualifications
      ) {
        addResult('Fixer-only Fields', true, 'Fixer-specific fields saved correctly');
      } else {
        addResult('Fixer-only Fields', false, 'Years of service or qualifications not saved correctly');
      }

      return true;
    } else {
      addResult('Profile Creation', false, `ClientProfile: ${user.clientProfile ? 'exists' : 'missing'}, FixerProfile: ${user.fixerProfile ? 'exists' : 'missing'}`);
      return false;
    }
  } catch (error: any) {
    addResult('Profile API Test', false, `Error: ${error.message}`);
    return false;
  }
}

async function testOldRouteRedirects(sessionToken: string) {
  log('\n=== Test 5: Old Profile Routes Redirect ===');

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
    addResult('Old Route Redirects', false, `Error: ${error.message}`);
  }
}

async function runE2ETest() {
  log('Starting End-to-End Unified Profile Test...\n');
  log(`Test User: ${TEST_EMAIL}`);
  log(`Base URL: ${BASE_URL}\n`);

  try {
    // Cleanup before starting
    await cleanup();

    // Run tests in sequence
    const registrationSuccess = await testRegistration();
    if (!registrationSuccess) {
      log('\n❌ Registration failed, stopping tests');
      return;
    }

    const sessionToken = await testMagicLinkLogin();
    if (!sessionToken) {
      log('\n❌ Login failed, stopping tests');
      return;
    }

    await testMiddlewareRedirect(sessionToken);
    const profileSuccess = await testProfileAPI(sessionToken);

    if (profileSuccess) {
      await testOldRouteRedirects(sessionToken);
    }

    // Summary
    log('\n=== Test Summary ===');
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const percentage = ((passed / total) * 100).toFixed(1);

    log(`\nTotal: ${total} tests`);
    log(`Passed: ${passed} (${percentage}%)`);
    log(`Failed: ${total - passed}`);

    if (passed === total) {
      log('\n🎉 All tests passed! Unified profile implementation working correctly.');
      log('\n✅ Key achievements:');
      log('   • User registration and magic link authentication work');
      log('   • Middleware redirects incomplete profiles to /profile');
      log('   • Unified profile API creates both ClientProfile and FixerProfile');
      log('   • Shared fields match between both profiles');
      log('   • Role-specific fields saved correctly');
      log('   • Old profile routes redirect to unified /profile');
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

    // Cleanup after tests
    log('\n=== Cleanup ===');
    log('Keeping test user for manual verification.');
    log(`You can now login at ${BASE_URL} with email: ${TEST_EMAIL}`);
  } catch (error) {
    log(`\n❌ Test suite error: ${error}`);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the E2E test
runE2ETest();
