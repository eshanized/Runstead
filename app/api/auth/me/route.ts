import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/guards';
import { adminPrisma as prisma } from '@/lib/db/client';

export async function GET(req: Request) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  // Fetch full details with memberships and customer profiles from PostgreSQL
  let fullUser: any = null;
  try {
    fullUser = await prisma.user.findUnique({
      where: { id: user.id },
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
    return NextResponse.json({ error: 'User lookup temporarily unavailable' }, { status: 503 });
  }

  if (!fullUser) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: fullUser.id,
      name: fullUser.name,
      email: fullUser.email,
      isPlatformAdmin: fullUser.isPlatformAdmin,
      emailVerified: fullUser.emailVerified,
    },
    tenants: (fullUser.memberships || []).map((m: any) => ({
      tenantId: m.tenantId,
      role: m.role,
      name: m.tenant?.name || 'Tenant',
      slug: m.tenant?.slug || 'tenant',
    })),
    customerProfiles: (fullUser.customerProfiles || []).map((c: any) => ({
      customerId: c.id,
      tenantId: c.tenantId,
      tenantName: c.tenant?.name || 'Tenant',
      tenantSlug: c.tenant?.slug || 'tenant',
    })),
  });
}
