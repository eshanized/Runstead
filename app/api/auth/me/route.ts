import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/client';

export async function GET(req: Request) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  // Fetch full details with memberships and customer profiles
  const fullUser = await prisma.user.findUnique({
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
    },
    tenants: fullUser.memberships.map((m) => ({
      tenantId: m.tenantId,
      role: m.role,
      name: m.tenant.name,
      slug: m.tenant.slug,
    })),
    customerProfiles: fullUser.customerProfiles.map((c) => ({
      customerId: c.id,
      tenantId: c.tenantId,
      tenantName: c.tenant.name,
      tenantSlug: c.tenant.slug,
    })),
  });
}
