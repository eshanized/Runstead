import { prisma } from '../db/client.ts';
import { getLocalDb, resolveLocalTenantId } from '../db/local-db.ts';
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

export interface UpdateProductInput {
  name?: string;
  type?: string;
  description?: string;
  setupFee?: number;
  available?: boolean;
  resourceLimits?: Record<string, any>;
  pricing?: CreatePricingInput[];
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

  try {
    return await prisma.product.findMany({
      where,
      include: {
        pricing: {
          orderBy: { price: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  } catch {
    const db = getLocalDb();
    const resolvedTenant = resolveLocalTenantId(tenantId);
    let query = 'SELECT * FROM products WHERE tenant_id = ?';
    const params: (string | number)[] = [resolvedTenant];
    if (options?.availableOnly) {
      query += ' AND available = 1';
    }
    query += ' ORDER BY created_at ASC';
    const rows = db.prepare(query).all(...params) as any[];

    return rows.map((r) => {
      const pricingRows = db.prepare('SELECT * FROM product_pricing WHERE product_id = ? ORDER BY price ASC').all(r.id) as any[];
      return {
        id: r.id,
        tenantId: r.tenant_id,
        name: r.name,
        type: r.type,
        description: r.description || '',
        setupFee: r.setup_fee,
        available: Boolean(r.available),
        resourceLimits: r.resource_limits ? JSON.parse(r.resource_limits) : {},
        addons: r.addons ? JSON.parse(r.addons) : [],
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
        pricing: pricingRows.map((pr) => ({
          id: pr.id,
          tenantId: pr.tenant_id,
          productId: pr.product_id,
          cycle: pr.cycle,
          price: pr.price,
          createdAt: new Date(pr.created_at),
        })),
      };
    }) as any[];
  }
}

export async function getProductById(tenantId: string, productId: string) {
  try {
    return await prisma.product.findUnique({
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
  } catch {
    const db = getLocalDb();
    const r = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as any;
    if (!r) return null;
    const pricingRows = db.prepare('SELECT * FROM product_pricing WHERE product_id = ? ORDER BY price ASC').all(r.id) as any[];
    return {
      id: r.id,
      tenantId: r.tenant_id,
      name: r.name,
      type: r.type,
      description: r.description || '',
      setupFee: r.setup_fee,
      available: Boolean(r.available),
      resourceLimits: r.resource_limits ? JSON.parse(r.resource_limits) : {},
      addons: r.addons ? JSON.parse(r.addons) : [],
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
      pricing: pricingRows.map((pr) => ({
        id: pr.id,
        tenantId: pr.tenant_id,
        productId: pr.product_id,
        cycle: pr.cycle,
        price: pr.price,
        createdAt: new Date(pr.created_at),
      })),
    } as any;
  }
}

export async function createProduct(tenantId: string, input: CreateProductInput, actorId?: string): Promise<Product> {
  try {
    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          tenantId,
          name: input.name,
          type: input.type,
          description: input.description,
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
  } catch {
    const db = getLocalDb();
    const id = `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO products (id, tenant_id, name, type, description, setup_fee, available, resource_limits, addons, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      tenantId,
      input.name,
      input.type,
      input.description,
      input.setupFee ?? 0.0,
      input.available !== false ? 1 : 0,
      JSON.stringify(input.resourceLimits || {}),
      JSON.stringify(input.addons || []),
      now,
      now
    );

    if (input.pricing && input.pricing.length > 0) {
      for (const pr of input.pricing) {
        db.prepare(`
          INSERT INTO product_pricing (id, tenant_id, product_id, cycle, price, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(`pr_${id}_${pr.cycle}`, tenantId, id, pr.cycle, pr.price, now);
      }
    }

    return {
      id,
      tenantId,
      name: input.name,
      type: input.type,
      description: input.description,
      setupFee: (input.setupFee ?? 0.0) as any,
      available: input.available !== false,
      resourceLimits: input.resourceLimits || {},
      addons: input.addons || [],
      createdAt: new Date(now),
      updatedAt: new Date(now),
    } as any;
  }
}

export async function updateProduct(
  tenantId: string,
  productId: string,
  input: UpdateProductInput,
  actorId?: string
): Promise<Product> {
  try {
    return await prisma.product.update({
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
      },
    });
  } catch {
    const db = getLocalDb();
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as any;
    if (!existing) throw new Error('Product not found');

    const updated = {
      name: input.name ?? existing.name,
      type: input.type ?? existing.type,
      description: input.description ?? existing.description,
      setupFee: input.setupFee !== undefined ? input.setupFee : existing.setup_fee,
      available: input.available !== undefined ? (input.available ? 1 : 0) : existing.available,
      resourceLimits: input.resourceLimits !== undefined ? JSON.stringify(input.resourceLimits) : existing.resource_limits,
    };

    db.prepare(`
      UPDATE products
      SET name = ?, type = ?, description = ?, setup_fee = ?, available = ?, resource_limits = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      updated.name,
      updated.type,
      updated.description,
      updated.setupFee,
      updated.available,
      updated.resourceLimits,
      productId
    );

    return {
      ...existing,
      ...updated,
      available: Boolean(updated.available),
      updatedAt: new Date(),
    } as any;
  }
}

export async function deleteProduct(tenantId: string, productId: string, actorId?: string): Promise<boolean> {
  try {
    await prisma.product.delete({
      where: {
        tenantId_id: {
          tenantId,
          id: productId,
        },
      },
    });
    return true;
  } catch {
    const db = getLocalDb();
    db.prepare('DELETE FROM product_pricing WHERE product_id = ?').run(productId);
    db.prepare('DELETE FROM products WHERE id = ?').run(productId);
    return true;
  }
}

export async function calculateOrderPricing(
  tenantId: string,
  requests: OrderItemCalculationRequest[]
): Promise<OrderPricingResult> {
  if (!requests || requests.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  let taxRate = 5.0;
  let currency = 'USD';

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { currency: true, taxRate: true },
    });
    if (tenant) {
      taxRate = Number(tenant.taxRate || 0);
      currency = tenant.currency || 'USD';
    }
  } catch {
    const db = getLocalDb();
    const tenantRow = db.prepare("SELECT currency, tax_rate FROM tenants WHERE (id = ? OR slug = 'default')").get(tenantId) as any;
    if (tenantRow) {
      taxRate = Number(tenantRow.tax_rate || 0);
      currency = tenantRow.currency || 'USD';
    }
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
