/**
 * Automated test suite for verification link expiry and resend functionality
 */

const BASE_URL = 'http://localhost:3010';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, message: string, details?: any) {
  results.push({ name, passed, message, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
  if (details) {
    console.log('   Details:', JSON.stringify(details, null, 2));
  }
}

// Test 1: Resend verification with non-existent email
async function test1_ResendNonExistentEmail() {
  console.log('\n=== Test 1: Resend Verification - Non-existent Email ===');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@test.com' }),
    });

    const data = await response.json();

    if (response.status === 404 && data.error?.includes('No account found')) {
      logTest('Resend - Non-existent Email', true, 'Correctly returns 404 for non-existent email');
    } else {
      logTest('Resend - Non-existent Email', false, `Expected 404, got ${response.status}`, data);
    }
  } catch (error: any) {
    logTest('Resend - Non-existent Email', false, `Error: ${error.message}`);
  }
}

// Test 2: Resend verification without email/phone
async function test2_ResendMissingData() {
  console.log('\n=== Test 2: Resend Verification - Missing Email/Phone ===');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const data = await response.json();

    if (response.status === 400 && data.error) {
      logTest('Resend - Missing Data', true, 'Correctly returns 400 for missing email/phone', { error: data.error });
    } else {
      logTest('Resend - Missing Data', false, `Expected 400, got ${response.status}`, data);
    }
  } catch (error: any) {
    logTest('Resend - Missing Data', false, `Error: ${error.message}`);
  }
}

// Test 3: Verify endpoint with invalid token
async function test3_VerifyInvalidToken() {
  console.log('\n=== Test 3: Verify - Invalid Token ===');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/verify?token=invalid-token-12345`, {
      redirect: 'manual',
    });

    if (response.status === 307 || response.status === 302) {
      const location = response.headers.get('location');
      if (location?.includes('message=invalid')) {
        logTest('Verify - Invalid Token', true, 'Correctly redirects with invalid message', { location });
      } else {
        logTest('Verify - Invalid Token', false, `Unexpected redirect location: ${location}`);
      }
    } else {
      logTest('Verify - Invalid Token', false, `Expected redirect, got ${response.status}`);
    }
  } catch (error: any) {
    logTest('Verify - Invalid Token', false, `Error: ${error.message}`);
  }
}

// Test 4: Verify endpoint without token
async function test4_VerifyNoToken() {
  console.log('\n=== Test 4: Verify - No Token ===');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/verify`, {
      redirect: 'manual',
    });

    const data = await response.json();

    if (response.status === 400 && data.error?.includes('Token is required')) {
      logTest('Verify - No Token', true, 'Correctly returns 400 when token is missing');
    } else {
      logTest('Verify - No Token', false, `Expected 400, got ${response.status}`, data);
    }
  } catch (error: any) {
    logTest('Verify - No Token', false, `Error: ${error.message}`);
  }
}

// Test 5: Register new user for testing
async function test5_RegisterTestUser() {
  console.log('\n=== Test 5: Register Test User ===');
  try {
    const testEmail = `test${Date.now()}@verification.test`;
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: testEmail,
        phone: `+234801${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
        password: 'Test123!',
        roles: ['CLIENT'],
      }),
    });

    const data = await response.json();

    if (response.ok) {
      logTest('Register Test User', true, 'User registered successfully', { email: testEmail });
      return testEmail;
    } else {
      logTest('Register Test User', false, data.error || 'Registration failed', data);
      return null;
    }
  } catch (error: any) {
    logTest('Register Test User', false, `Error: ${error.message}`);
    return null;
  }
}

// Test 6: Resend verification for pending user
async function test6_ResendForPendingUser(email: string) {
  console.log('\n=== Test 6: Resend Verification - Pending User ===');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      logTest('Resend - Pending User', true, 'Verification link sent successfully', data);
      return true;
    } else {
      logTest('Resend - Pending User', false, 'Failed to send verification link', data);
      return false;
    }
  } catch (error: any) {
    logTest('Resend - Pending User', false, `Error: ${error.message}`);
    return false;
  }
}

// Test 7: Verify that duplicate registration fails
async function test7_DuplicateRegistration(email: string) {
  console.log('\n=== Test 7: Duplicate Registration Prevention ===');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate User',
        email: email,
        phone: `+234801${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
        password: 'Test123!',
        roles: ['CLIENT'],
      }),
    });

    const data = await response.json();

    if (!response.ok && data.error?.includes('already registered')) {
      logTest('Duplicate Registration', true, 'Correctly prevents duplicate registration', { error: data.error });
    } else {
      logTest('Duplicate Registration', false, 'Should have prevented duplicate registration', data);
    }
  } catch (error: any) {
    logTest('Duplicate Registration', false, `Error: ${error.message}`);
  }
}

// Test 8: Test profile duplication analysis
async function test8_ProfileMigration() {
  console.log('\n=== Test 8: Profile Migration Script Validation ===');
  try {
    const fs = require('fs');
    const scriptExists = fs.existsSync('/Users/itopa/projects/nextjs-fixxers/scripts/migrate-unified-profiles.ts');

    if (scriptExists) {
      const scriptContent = fs.readFileSync('/Users/itopa/projects/nextjs-fixxers/scripts/migrate-unified-profiles.ts', 'utf-8');
      const hasSync = scriptContent.includes('syncProfiles');
      const hasDryRun = scriptContent.includes('dryRun');
      const hasInconsistencies = scriptContent.includes('detectInconsistencies');

      if (hasSync && hasDryRun && hasInconsistencies) {
        logTest('Profile Migration Script', true, 'Migration script has all required functionality');
      } else {
        logTest('Profile Migration Script', false, 'Migration script missing functionality', {
          hasSync,
          hasDryRun,
          hasInconsistencies,
        });
      }
    } else {
      logTest('Profile Migration Script', false, 'Migration script file not found');
    }
  } catch (error: any) {
    logTest('Profile Migration Script', false, `Error: ${error.message}`);
  }
}

// Test 9: Test unified dashboard files
async function test9_UnifiedDashboard() {
  console.log('\n=== Test 9: Unified Dashboard Structure ===');
  try {
    const fs = require('fs');
    const dashboardPageExists = fs.existsSync('/Users/itopa/projects/nextjs-fixxers/app/dashboard/page.tsx');
    const unifiedDashboardExists = fs.existsSync('/Users/itopa/projects/nextjs-fixxers/app/dashboard/UnifiedDashboard.tsx');

    if (dashboardPageExists && unifiedDashboardExists) {
      logTest('Unified Dashboard Files', true, 'Dashboard files exist');

      // Check for dual-role logic
      const dashboardContent = fs.readFileSync('/Users/itopa/projects/nextjs-fixxers/app/dashboard/page.tsx', 'utf-8');
      const hasDualRoleCheck = dashboardContent.includes('roles.length === 1');

      if (hasDualRoleCheck) {
        logTest('Unified Dashboard - Dual Role Logic', true, 'Dashboard has dual-role redirect logic');
      } else {
        logTest('Unified Dashboard - Dual Role Logic', false, 'Missing dual-role redirect logic');
      }
    } else {
      logTest('Unified Dashboard Files', false, 'Dashboard files missing', {
        dashboardPageExists,
        unifiedDashboardExists,
      });
    }
  } catch (error: any) {
    logTest('Unified Dashboard Files', false, `Error: ${error.message}`);
  }
}

// Test 10: Test documentation files
async function test10_Documentation() {
  console.log('\n=== Test 10: Documentation Completeness ===');
  try {
    const fs = require('fs');
    const docs = [
      '/Users/itopa/projects/nextjs-fixxers/UNIFIED-PROFILE-DESIGN.md',
      '/Users/itopa/projects/nextjs-fixxers/PROFILE-FLOW-DIAGRAM.md',
      '/Users/itopa/projects/nextjs-fixxers/PROFILE-DUPLICATION-ANALYSIS.md',
      '/Users/itopa/projects/nextjs-fixxers/TEST-RESULTS.md',
    ];

    const existingDocs = docs.filter(doc => fs.existsSync(doc));

    if (existingDocs.length === docs.length) {
      logTest('Documentation Files', true, `All ${docs.length} documentation files exist`);
    } else {
      logTest('Documentation Files', false, `Only ${existingDocs.length}/${docs.length} documentation files exist`, {
        missing: docs.filter(doc => !fs.existsSync(doc)),
      });
    }
  } catch (error: any) {
    logTest('Documentation Files', false, `Error: ${error.message}`);
  }
}

// Test 11: Middleware dual-role redirect logic
async function test11_MiddlewareLogic() {
  console.log('\n=== Test 11: Middleware Dual-Role Logic ===');
  try {
    const fs = require('fs');
    const middlewareContent = fs.readFileSync('/Users/itopa/projects/nextjs-fixxers/middleware.ts', 'utf-8');

    const hasDualRoleCheck = middlewareContent.includes('roles.length > 1');
    const hasDashboardRedirect = middlewareContent.includes("'/dashboard'");

    if (hasDualRoleCheck && hasDashboardRedirect) {
      logTest('Middleware - Dual-Role Logic', true, 'Middleware has proper dual-role redirect logic');
    } else {
      logTest('Middleware - Dual-Role Logic', false, 'Middleware missing dual-role logic', {
        hasDualRoleCheck,
        hasDashboardRedirect,
      });
    }
  } catch (error: any) {
    logTest('Middleware Logic', false, `Error: ${error.message}`);
  }
}

// Test 12: Resend verification endpoint exists
async function test12_ResendEndpointExists() {
  console.log('\n=== Test 12: Resend Verification Endpoint ===');
  try {
    const fs = require('fs');
    const endpointExists = fs.existsSync('/Users/itopa/projects/nextjs-fixxers/app/api/auth/resend-verification/route.ts');

    if (endpointExists) {
      const endpointContent = fs.readFileSync('/Users/itopa/projects/nextjs-fixxers/app/api/auth/resend-verification/route.ts', 'utf-8');
      const hasEmailCheck = endpointContent.includes('email') || endpointContent.includes('phone');
      const hasTokenGeneration = endpointContent.includes('generateMagicLink');
      const hasEmailSending = endpointContent.includes('sendMagicLinkEmail');

      if (hasEmailCheck && hasTokenGeneration && hasEmailSending) {
        logTest('Resend Endpoint Implementation', true, 'Endpoint has all required functionality');
      } else {
        logTest('Resend Endpoint Implementation', false, 'Endpoint missing functionality', {
          hasEmailCheck,
          hasTokenGeneration,
          hasEmailSending,
        });
      }
    } else {
      logTest('Resend Endpoint', false, 'Endpoint file not found');
    }
  } catch (error: any) {
    logTest('Resend Endpoint', false, `Error: ${error.message}`);
  }
}

// Test 13: Verify endpoint has expiry detection
async function test13_VerifyEndpointExpiry() {
  console.log('\n=== Test 13: Verify Endpoint - Expiry Detection ===');
  try {
    const fs = require('fs');
    const verifyContent = fs.readFileSync('/Users/itopa/projects/nextjs-fixxers/app/api/auth/verify/route.ts', 'utf-8');

    const hasExpiryCheck = verifyContent.includes('isExpired');
    const hasUsedCheck = verifyContent.includes('isUsed');
    const hasRedirectWithMessage = verifyContent.includes('message=expired');

    if (hasExpiryCheck && hasUsedCheck && hasRedirectWithMessage) {
      logTest('Verify - Expiry Detection', true, 'Verify endpoint has proper expiry handling');
    } else {
      logTest('Verify - Expiry Detection', false, 'Verify endpoint missing expiry logic', {
        hasExpiryCheck,
        hasUsedCheck,
        hasRedirectWithMessage,
      });
    }
  } catch (error: any) {
    logTest('Verify Expiry Detection', false, `Error: ${error.message}`);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Comprehensive Automated Tests...\n');
  console.log('Testing against:', BASE_URL);
  console.log('='.repeat(70));

  // Run all tests
  await test1_ResendNonExistentEmail();
  await test2_ResendMissingData();
  await test3_VerifyInvalidToken();
  await test4_VerifyNoToken();

  const testEmail = await test5_RegisterTestUser();
  if (testEmail) {
    await test6_ResendForPendingUser(testEmail);
    await test7_DuplicateRegistration(testEmail);
  }

  await test8_ProfileMigration();
  await test9_UnifiedDashboard();
  await test10_Documentation();
  await test11_MiddlewareLogic();
  await test12_ResendEndpointExists();
  await test13_VerifyEndpointExpiry();

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.message}`);
    });
  } else {
    console.log('\n🎉 All tests passed!');
  }

  console.log('\n' + '='.repeat(70));

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
