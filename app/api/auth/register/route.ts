import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { hashPassword } from '@/lib/security/crypto';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { createSession, serializeSessionCookie } from '@/lib/auth/session';
import { createResellerTenant } from '@/lib/services/tenant.service';

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  businessName: z.string().min(2).max(100).optional(),
  tenantSlug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/).optional(),
});

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
  const rateLimit = checkRateLimit(`register:${ip}`, { windowMs: 60_000, maxRequests: 5 });

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Please wait a minute.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
  }

  const { name, email, password, businessName, tenantSlug } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return NextResponse.json({ error: 'An account with this email address already exists.' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
    },
  });

  // If business info provided, create initial reseller tenant
  let tenant = null;
  if (businessName && tenantSlug) {
    tenant = await createResellerTenant(user.id, {
      name: businessName,
      slug: tenantSlug,
    });
  }

  // Issue session
  const { rawToken } = await createSession(user.id, {
    ipAddress: ip,
    userAgent: req.headers.get('user-agent') || undefined,
  });

  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isPlatformAdmin: user.isPlatformAdmin,
    },
    tenant: tenant ? { id: tenant.id, name: tenant.name, slug: tenant.slug } : null,
  });

  response.headers.set('Set-Cookie', serializeSessionCookie(rawToken));
  return response;
}
