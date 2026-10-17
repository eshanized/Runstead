import { prisma } from '../db/client.ts';
import { recordAuditEvent } from './audit.service.ts';
import type { Product, Prisma } from '@prisma/client';

export interface CreatePricingInput {
  cycle: string;
  price: number;
}

export interface CreateProductInput {
  name: string;
  type: string; // e.g. 'shared', 'vps', 'dedicated', 'cloud'
  description: string;
  setupFee?: number;
  available?: boolean;
  resourceLimits?: Record<string, any>;
  addons?: any[];
  pricing: CreatePricingInput[];
}

export interface OrderItemCalculationRequest {
  productId: string;
  cycle: string;
  quantity: number;
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

export interface OrderPricingResult {
  items: CalculatedLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
}

export async function listProducts(tenantId: string, options?: { availableOnly?: boolean }) {
  const where: Prisma.ProductWhereInput = {
    tenantId,
    available: options?.availableOnly ? true : undefined,
  };

  return prisma.product.findMany({
    where,
    include: {
      pricing: {
        orderBy: { price: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getProductById(tenantId: string, productId: string) {
  return prisma.product.findUnique({
    where: {
      tenantId_id: {
        tenantId,
        id: productId,
      },
    },
    include: {
      pricing: true,
    },
  });
}

export async function createProduct(tenantId: string, input: CreateProductInput, actorId?: string): Promise<Product> {
  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        tenantId,
        name: input.name,
        type: input.type,
        description: input.description,
        setupFee: input.setupFee ?? 0.00,
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

/**
 * Server-Side Price Calculation Engine.
 * Never trust client-submitted amounts, prices, or discounts.
 * Fetches authoritative database records and calculates totals deterministically.
 */
export async function calculateOrderPricing(
  tenantId: string,
  requests: OrderItemCalculationRequest[]
): Promise<OrderPricingResult> {
  if (!requests || requests.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  // Fetch tenant to get tax rate and currency
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { currency: true, taxRate: true },
  });

  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }

  const taxRate = Number(tenant.taxRate || 0);
  const currency = tenant.currency || 'USD';

  const productIds = requests.map((r) => r.productId);
  const products = await prisma.product.findMany({
    where: {
      tenantId,
      id: { in: productIds },
      available: true,
    },
    include: {
      pricing: true,
    },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));
  const calculatedItems: CalculatedLineItem[] = [];
  let subtotal = 0;

  for (const req of requests) {
    const product = productMap.get(req.productId);
    if (!product) {
      throw new Error(`Product not found or unavailable: ${req.productId}`);
    }

    const pricing = product.pricing.find((p) => p.cycle.toLowerCase() === req.cycle.toLowerCase());
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

  const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

  return {
    items: calculatedItems,
    subtotal: Math.round(subtotal * 100) / 100,
    taxRate,
    taxAmount,
    totalAmount,
    currency,
  };
}
