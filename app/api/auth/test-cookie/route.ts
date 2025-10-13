import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token');

  return NextResponse.json({
    hasCookie: !!authToken,
    cookieValue: authToken?.value ? 'exists' : 'none',
    allCookies: request.cookies.getAll().map(c => c.name)
  });
}
