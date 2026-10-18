import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { hashPassword } from '@/lib/security/crypto';
import { checkRateLimitAsync, getRateLimitClientAddress } from '@/lib/security/rate-limit';
import { generateSecureToken, hashToken } from '@/lib/security/crypto';
import { sendTransactionalNotification } from '@/lib/services/notification.service';
import { env } from '@/lib/config/env';
import { createResellerTenant } from '@/lib/services/tenant.service';

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  businessName: z.string().min(2).max(100).optional(),
  tenantSlug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/).optional(),
});

export async function POST(req: Request) {
  const ip = getRateLimitClientAddress(req);
  const rateLimit = await checkRateLimitAsync(`register:${ip}`, { windowMs: 60_000, maxRequests: 5 });

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

  let existingUser: any = null;
  try {
    existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Registration service temporarily unavailable' }, { status: 503 });
  }

  if (existingUser) {
    return NextResponse.json({ error: 'An account with this email address already exists.' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  let user: any = null;
  let tenant: any = null;

  try {
    user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
      },
    });

    if (businessName && tenantSlug) {
      tenant = await createResellerTenant(user.id, {
        name: businessName,
        slug: tenantSlug,
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: `Registration failed: ${msg}` }, { status: 500 });
  }

  // Registration does not create an authenticated session until the address is verified.
  const rawToken = generateSecureToken(32);
  try {
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Account was created, but a verification challenge could not be saved. Request another verification email.' },
      { status: 503 }
    );
  }

  const verificationUrl = new URL('/api/auth/verify-email', env.NEXT_PUBLIC_APP_URL);
  verificationUrl.searchParams.set('token', rawToken);
  const delivery = await sendTransactionalNotification({
    to: user.email,
    subject: 'Verify your Runstead email address',
    template: 'email_verification',
    data: { verificationUrl: verificationUrl.toString() },
  });

  return NextResponse.json({
    success: true,
    verificationRequired: true,
    verificationEmailSent: delivery.accepted,
    message: delivery.accepted
      ? 'Account created. Check your email to verify the address before signing in.'
      : 'Account created, but the verification email could not be sent. Configure email delivery and use the resend-verification endpoint.',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: null,
    },
    tenant: tenant ? { id: tenant.id, name: tenant.name, slug: tenant.slug } : null,
  }, { status: 201 });
}
