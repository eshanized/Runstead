import { NextResponse } from 'next/server';
import { adminPrisma as prisma } from '@/lib/db/client';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'slug parameter is required' }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: slug.toLowerCase() },
    select: {
      id: true,
      name: true,
      slug: true,
      currency: true,
      taxRate: true,
      brandConfig: true,
      products: {
        where: { available: true },
        include: {
          pricing: { orderBy: { price: 'asc' } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!tenant) {
    return NextResponse.json({ error: 'Storefront tenant not found' }, { status: 404 });
  }

  return NextResponse.json({
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      currency: tenant.currency,
      taxRate: tenant.taxRate,
      brandConfig: tenant.brandConfig,
    },
    products: tenant.products,
  });
}
