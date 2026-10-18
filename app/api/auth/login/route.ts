import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { verifyPassword } from '@/lib/security/crypto';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { createSession, serializeSessionCookie } from '@/lib/auth/session';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
  const rateLimit = checkRateLimit(`login:${ip}`, { windowMs: 60_000, maxRequests: 5 });

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many failed login attempts. Please try again in 60 seconds.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  let user: any = null;
  try {
    user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        memberships: {
          include: {
            tenant: { select: { id: true, name: true, slug: true, planTier: true } },
          },
        },
        customerProfiles: {
          include: {
            tenant: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: 'Authentication service temporarily unavailable' }, { status: 503 });
  }

  if (!user) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  // Enforce password verification - fail closed if user has no passwordHash
  if (!user.passwordHash) {
    return NextResponse.json(
      { error: 'Account does not have a password configured. Please use account recovery or set a password.' },
      { status: 401 }
    );
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  // Issue session
  const { rawToken } = await createSession(user.id, {
    ipAddress: ip,
    userAgent: req.headers.get('user-agent') || undefined,
    userObj: {
      id: user.id,
      email: user.email,
      name: user.name,
      isPlatformAdmin: Boolean(user.isPlatformAdmin),
      emailVerified: user.emailVerified,
    },
  });

  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isPlatformAdmin: user.isPlatformAdmin,
    },
    tenants: (user.memberships || []).map((m: any) => ({
      tenantId: m.tenantId,
      role: m.role,
      name: m.tenant?.name || 'Tenant',
      slug: m.tenant?.slug || 'tenant',
    })),
    customerProfiles: (user.customerProfiles || []).map((c: any) => ({
      customerId: c.id,
      tenantId: c.tenantId,
      tenantName: c.tenant?.name || 'Tenant',
      tenantSlug: c.tenant?.slug || 'tenant',
    })),
  });

  response.headers.set('Set-Cookie', serializeSessionCookie(rawToken));
  return response;
}
