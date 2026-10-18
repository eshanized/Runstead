import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { hashToken } from '@/lib/security/crypto';

const schema = z.object({ token: z.string().min(32).max(256) });

/**
 * Consumes a single-use email verification token and marks the account verified.
 * The updateMany condition prevents two concurrent requests from consuming it.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = schema.safeParse({ token: url.searchParams.get('token') || '' });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid or expired verification link.' }, { status: 400 });
  }

  const now = new Date();
  try {
    const challenge = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash: hashToken(parsed.data.token) },
      include: { user: { select: { id: true, emailVerified: true } } },
    });

    if (!challenge || challenge.expiresAt <= now || challenge.consumedAt) {
      return NextResponse.json({ error: 'Invalid or expired verification link.' }, { status: 400 });
    }

    if (challenge.user.emailVerified) {
      return NextResponse.json({ success: true, message: 'Email address is already verified.' });
    }

    await prisma.$transaction(async (tx) => {
      const consumed = await tx.emailVerificationToken.updateMany({
        where: {
          id: challenge.id,
          consumedAt: null,
          expiresAt: { gt: now },
        },
        data: { consumedAt: now },
      });

      if (consumed.count !== 1) {
        throw new Error('Verification link has already been consumed or expired.');
      }

      await tx.user.update({
        where: { id: challenge.user.id },
        data: { emailVerified: now },
      });

      await tx.emailVerificationToken.updateMany({
        where: {
          userId: challenge.user.id,
          id: { not: challenge.id },
          consumedAt: null,
        },
        data: { consumedAt: now },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully. You can now sign in.',
    });
  } catch {
    return NextResponse.json(
      { error: 'Verification could not be completed. Request a new verification email and try again.' },
      { status: 503 }
    );
  }
}
