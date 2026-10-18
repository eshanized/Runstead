import { withTenantContext } from '../db/client.ts';
import { recordAuditEvent } from './audit.service.ts';
import type { Product, Prisma } from '@prisma/client';

export interface ProductPricingInput {
  cycle: string;
  price: number;
}

export interface CreateProductInput {
  name: string;
  type: string;
  description?: string;
  setupFee?: number;
  available?: boolean;
  resourceLimits?: Record<string, any>;
  addons?: any[];
  pricing?: ProductPricingInput[];
}

export interface UpdateProductInput {
  name?: string;
  type?: string;
  description?: string;
  setupFee?: number;
  available?: boolean;
  resourceLimits?: Record<string, any>;
  addons?: any[];
  pricing?: ProductPricingInput[];
}

export interface OrderItemCalculationRequest {
  productId: string;
  cycle: string;
  quantity?: number;
}

export interface CalculatedLineItem {
  productId: string;
  productName: string;
  cycle: string;
  quantity: number;
  unitPrice: number;
  setupFee: number;
  totalAmount: number;
}

export interface CalculatedOrderPricing {
  items: CalculatedLineItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  taxRatePercent: number;
}

export async function listProducts(
  tenantId: string,
  options: { availableOnly?: boolean; type?: string } = {}
) {
  const where: Prisma.ProductWhereInput = {
    tenantId,
    available: options.availableOnly ? true : undefined,
    type: options.type ? options.type : undefined,
  };

  return withTenantContext(tenantId, (tx) => tx.product.findMany({
    where,
    include: {
      pricing: {
        orderBy: { price: 'asc' },
      },
      _count: {
        select: {
          services: true,
          orders: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  }));;
}

export async function getProductById(tenantId: string, productId: string) {
  return withTenantContext(tenantId, (tx) => tx.product.findUnique({
    where: {
      tenantId_id: {
        tenantId,
        id: productId,
      },
    },
    include: {
      pricing: true,
    },
  }));;
}

export async function createProduct(tenantId: string, input: CreateProductInput, actorId?: string): Promise<Product> {
  const product = await withTenantContext(tenantId, async (tx) => {
    const created = await tx.product.create({
      data: {
        tenantId,
        name: input.name,
        type: input.type,
        description: input.description || '',
        setupFee: input.setupFee ?? 0.0,
        available: input.available ?? true,
        resourceLimits: input.resourceLimits,
        addons: input.addons,
      },
    });

    if (input.pricing && input.pricing.length > 0) {
      await tx.productPricing.createMany({
        data: input.pricing.map((p) => ({
          tenantId,
          productId: created.id,
          cycle: p.cycle,
          price: p.price,
        })),
      });
    }

    return created;
  });

  await recordAuditEvent(tenantId, {
    actorId,
    action: 'product.created',
    resourceType: 'product',
    resourceId: product.id,
    payload: { name: product.name, type: product.type },
  });

  return product;
}

export async function updateProduct(
  tenantId: string,
  productId: string,
  input: UpdateProductInput,
  actorId?: string
): Promise<Product> {
  const product = await withTenantContext(tenantId, async (tx) => {
    const updated = await tx.product.update({
      where: {
        tenantId_id: {
          tenantId,
          id: productId,
        },
      },
      data: {
        name: input.name,
        type: input.type,
        description: input.description,
        setupFee: input.setupFee,
        available: input.available,
        resourceLimits: input.resourceLimits,
        addons: input.addons,
      },
    });

    if (input.pricing) {
      await tx.productPricing.deleteMany({
        where: { tenantId, productId },
      });

      if (input.pricing.length > 0) {
        await tx.productPricing.createMany({
          data: input.pricing.map((p) => ({
            tenantId,
            productId,
            cycle: p.cycle,
            price: p.price,
          })),
        });
      }
    }

    return updated;
  });

  await recordAuditEvent(tenantId, {
    actorId,
    action: 'product.updated',
    resourceType: 'product',
    resourceId: product.id,
    payload: input,
  });

  return product;
}

export async function deleteProduct(tenantId: string, productId: string, actorId?: string): Promise<boolean> {
  await withTenantContext(tenantId, (tx) => tx.product.delete({
    where: {
      tenantId_id: {
        tenantId,
        id: productId,
      },
    },
  }));;

  await recordAuditEvent(tenantId, {
    actorId,
    action: 'product.deleted',
    resourceType: 'product',
    resourceId: productId,
  });

  return true;
}

export async function calculateOrderPricing(
  tenantId: string,
  requests: OrderItemCalculationRequest[]
): Promise<CalculatedOrderPricing> {
  if (!requests || requests.length === 0) {
    throw new Error('Order calculation requires at least one product item');
  }

  let taxRate = 0;
  let currency = 'USD';

  const tenant = await withTenantContext(tenantId, (tx) => tx.tenant.findUnique({
    where: { id: tenantId },
    select: { currency: true, taxRate: true },
  }));;

  if (tenant) {
    taxRate = Number(tenant.taxRate || 0);
    currency = tenant.currency || 'USD';
  }

  const products = await listProducts(tenantId);
  const productMap = new Map(products.map((p) => [p.id, p]));
  const calculatedItems: CalculatedLineItem[] = [];
  let subtotal = 0;

  for (const req of requests) {
    const product = productMap.get(req.productId);
    if (!product) {
      throw new Error(`Product not found or unavailable: ${req.productId}`);
    }

    const pricing = product.pricing?.find((p: any) => p.cycle.toLowerCase() === req.cycle.toLowerCase()) || product.pricing?.[0];
    if (!pricing) {
      throw new Error(`Invalid billing cycle "${req.cycle}" for product "${product.name}"`);
    }

    const qty = Math.max(1, req.quantity || 1);
    const unitPrice = Number(pricing.price);
    const setupFee = Number(product.setupFee || 0);
    const itemTotal = unitPrice * qty + setupFee;

    subtotal += itemTotal;

    calculatedItems.push({
      productId: product.id,
      productName: product.name,
      cycle: pricing.cycle,
      quantity: qty,
      unitPrice,
      setupFee,
      totalAmount: Math.round(itemTotal * 100) / 100,
    });
  }

  const taxAmount = Math.round(((subtotal * taxRate) / 100) * 100) / 100;
  const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

  return {
    items: calculatedItems,
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount,
    totalAmount,
    currency,
    taxRatePercent: taxRate,
  };
}
