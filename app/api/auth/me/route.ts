import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/client';

export async function GET(req: Request) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  // Fetch full details with memberships and customer profiles
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
  } catch {
    const { findLocalUserById } = await import('@/lib/db/local-db');
    fullUser = findLocalUserById(user.id);
  }

  if (!fullUser) {
    // If not found in DB but authenticated in session
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isPlatformAdmin: user.isPlatformAdmin,
      },
      tenants: [
        {
          tenantId: 'e0000000-0000-0000-0000-000000000001',
          role: 'owner',
          name: 'Tonmoy Hosting Platform',
          slug: 'default',
        },
      ],
      customerProfiles: [],
    });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: fullUser.id,
      name: fullUser.name,
      email: fullUser.email,
      isPlatformAdmin: fullUser.isPlatformAdmin,
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
