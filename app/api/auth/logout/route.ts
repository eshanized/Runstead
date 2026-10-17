import { NextResponse } from 'next/server';
import { extractTokenFromRequest, revokeSessionToken, serializeClearSessionCookie } from '@/lib/auth/session';

export async function POST(req: Request) {
  const token = extractTokenFromRequest(req);
  if (token) {
    await revokeSessionToken(token);
  }

  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.headers.set('Set-Cookie', serializeClearSessionCookie());
  return response;
}
