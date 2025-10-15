import { NextRequest, NextResponse } from 'next/server';

async function handleLogout(request: NextRequest) {
  try {
    // Create redirect response
    const response = NextResponse.redirect(new URL('/', request.url));

    // Delete the auth cookie
    response.cookies.delete('auth_token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return handleLogout(request);
}

export async function GET(request: NextRequest) {
  return handleLogout(request);
}
