import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { generateSecureToken, hashToken } from '@/lib/security/crypto';
import { checkRateLimitAsync, getRateLimitClientAddress } from '@/lib/security/rate-limit';
import { sendTransactionalNotification } from '@/lib/services/notification.service';
import { env } from '@/lib/config/env';

const schema = z.object({ email: z.string().email() });
const genericResponse = {
  success: true,
  message: 'If the address belongs to an unverified Runstead account, a verification email will be sent.',
};

export async function POST(req: Request) {
  const ip = getRateLimitClientAddress(req);
  const ipLimit = await checkRateLimitAsync(`resend-verification:ip:${ip}`, { windowMs: 60_000, maxRequests: 5 });
  if (!ipLimit.success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const emailLimit = await checkRateLimitAsync(`resend-verification:email:${email}`, { windowMs: 60 * 60 * 1000, maxRequests: 3 });
  if (!emailLimit.success) {
    // Keep the same generic response to avoid disclosing account existence.
    return NextResponse.json(genericResponse);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, emailVerified: true },
    });

    if (!user || user.emailVerified) {
      return NextResponse.json(genericResponse);
    }

    const now = new Date();
    const rawToken = generateSecureToken(32);
    await prisma.$transaction(async (tx) => {
      await tx.emailVerificationToken.updateMany({
        where: { userId: user.id, consumedAt: null },
        data: { consumedAt: now },
      });
      await tx.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(rawToken),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      });
    });

    const verificationUrl = new URL('/api/auth/verify-email', env.NEXT_PUBLIC_APP_URL);
    verificationUrl.searchParams.set('token', rawToken);
    const result = await sendTransactionalNotification({
      to: user.email,
      subject: 'Verify your Runstead email address',
      template: 'email_verification',
      data: { verificationUrl: verificationUrl.toString() },
    });

    if (!result.accepted) {
      // Token remains single-use and expires shortly; the generic response prevents enumeration.
      console.error('Verification email delivery failed for request', { userId: user.id, error: result.error });
    }
  } catch {
    // Avoid making account existence observable via error details.
  }

  return NextResponse.json(genericResponse);
}
