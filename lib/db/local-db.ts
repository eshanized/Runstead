// @ts-ignore
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_DIR = path.resolve(process.cwd(), '.data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'runstead_local.db');

let _dbInstance: DatabaseSync | null = null;

export function resolveLocalTenantId(tenantIdOrSlug?: string): string {
  if (!tenantIdOrSlug || tenantIdOrSlug === 'default') {
    return 'e0000000-0000-0000-0000-000000000001';
  }
  const db = getLocalDb();
  const row = db.prepare('SELECT id FROM tenants WHERE id = ? OR slug = ?').get(tenantIdOrSlug, tenantIdOrSlug) as { id: string } | undefined;
  return row ? row.id : tenantIdOrSlug;
}

export function getLocalDb(): DatabaseSync {
  if (_dbInstance) return _dbInstance;

  const db = new DatabaseSync(DB_PATH);
  _dbInstance = db;

  // Initialize Schema Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      plan_tier TEXT DEFAULT 'Launch',
      currency TEXT DEFAULT 'USD',
      tax_rate REAL DEFAULT 0.00,
      brand_config TEXT,
      business_settings TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT,
      role TEXT DEFAULT 'user',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tenant_memberships (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      user_id TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      status TEXT DEFAULT 'active',
      country TEXT DEFAULT 'US',
      phone TEXT,
      credit_balance REAL DEFAULT 0.00,
      archived INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      setup_fee REAL DEFAULT 0.00,
      available INTEGER DEFAULT 1,
      resource_limits TEXT,
      addons TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    );

    CREATE TABLE IF NOT EXISTS product_pricing (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      cycle TEXT NOT NULL,
      price REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      order_number TEXT NOT NULL,
      product_id TEXT,
      product_name TEXT,
      status TEXT DEFAULT 'awaiting_payment',
      amount REAL NOT NULL,
      billing_cycle TEXT NOT NULL,
      items TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      order_id TEXT,
      invoice_number TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      subtotal REAL NOT NULL,
      tax REAL DEFAULT 0.00,
      total REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      due_date TEXT,
      paid_at TEXT,
      items TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      invoice_id TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      method TEXT NOT NULL,
      reference TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (invoice_id) REFERENCES invoices(id)
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      order_id TEXT,
      service_name TEXT NOT NULL,
      package TEXT NOT NULL,
      domain TEXT,
      billing_cycle TEXT NOT NULL,
      price REAL NOT NULL,
      ip_address TEXT,
      server_hostname TEXT,
      username TEXT,
      status TEXT DEFAULT 'active',
      resource_usage TEXT,
      next_renewal_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS domains (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      domain TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      registered_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT,
      auto_renew INTEGER DEFAULT 1,
      nameservers TEXT,
      dns_zone_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS dns_records (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      domain TEXT NOT NULL,
      type TEXT NOT NULL,
      host TEXT NOT NULL,
      value TEXT NOT NULL,
      ttl INTEGER DEFAULT 3600,
      priority INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      ticket_number TEXT NOT NULL,
      subject TEXT NOT NULL,
      category TEXT NOT NULL,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'open',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS ticket_messages (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      author TEXT NOT NULL,
      author_type TEXT NOT NULL,
      message TEXT NOT NULL,
      is_internal INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id)
    );

    CREATE TABLE IF NOT EXISTS provider_credentials (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      provider_name TEXT NOT NULL,
      status TEXT DEFAULT 'connected',
      encrypted_config TEXT NOT NULL,
      last_verified_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    );

    CREATE TABLE IF NOT EXISTS background_jobs (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      job_type TEXT NOT NULL,
      status TEXT DEFAULT 'queued',
      attempts INTEGER DEFAULT 0,
      max_attempts INTEGER DEFAULT 3,
      payload TEXT NOT NULL,
      error_details TEXT,
      run_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      actor_id TEXT,
      actor_type TEXT DEFAULT 'user',
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      payload TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    );
  `);

  seedInitialData(db);

  return db;
}

function seedInitialData(db: DatabaseSync) {
  const tenantCount = db.prepare('SELECT count(*) as count FROM tenants').get() as { count: number };
  if (tenantCount.count > 0) return;

  const defaultTenantId = 'e0000000-0000-0000-0000-000000000001';
  db.prepare(`
    INSERT INTO tenants (id, name, slug, plan_tier, currency, tax_rate, brand_config, business_settings)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    defaultTenantId,
    'Tonmoy Hosting Platform',
    'default',
    'Enterprise',
    'USD',
    5.0,
    JSON.stringify({ primaryColor: '#2563eb', secondaryColor: '#4f46e5' }),
    JSON.stringify({ supportEmail: 'support@runstead.com', invoicePrefix: 'INV-' })
  );

  // Seed default admin user
  const adminUserId = 'u0000000-0000-0000-0000-000000000001';
  db.prepare(`
    INSERT INTO users (id, email, name, role)
    VALUES (?, ?, ?, ?)
  `).run(
    adminUserId,
    'admin@runstead.com',
    'Platform Administrator',
    'platform_admin'
  );

  db.prepare(`
    INSERT INTO tenant_memberships (id, tenant_id, user_id, role)
    VALUES (?, ?, ?, ?)
  `).run(
    'm0000000-0000-0000-0000-000000000001',
    defaultTenantId,
    adminUserId,
    'owner'
  );

  // Seed default customers
  const customers = [
    { id: 'c0000000-0000-0000-0000-000000000001', name: 'Alex Chen', email: 'alex@chenmedia.io', company: 'Chen Media Group', status: 'active', country: 'US', phone: '+1 415 555 0192' },
    { id: 'c0000000-0000-0000-0000-000000000002', name: 'Sarah Jenkins', email: 'sarah@peakdesign.co', company: 'Peak Design Agency', status: 'active', country: 'CA', phone: '+1 604 555 0831' },
    { id: 'c0000000-0000-0000-0000-000000000003', name: 'Marcus Vance', email: 'marcus@vancetech.de', company: 'Vance Technologies GmbH', status: 'active', country: 'DE', phone: '+49 89 555 0412' },
  ];

  for (const c of customers) {
    db.prepare(`
      INSERT INTO customers (id, tenant_id, name, email, company, status, country, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(c.id, defaultTenantId, c.name, c.email, c.company, c.status, c.country, c.phone);
  }

  // Seed default hosting products
  const products = [
    {
      id: 'p0000000-0000-0000-0000-000000000001',
      name: 'Starter Cloud Hosting',
      type: 'shared',
      description: 'Optimized high-speed NVMe shared hosting for WordPress, blogs, and portfolio websites.',
      setupFee: 0.0,
      pricing: [
        { cycle: 'monthly', price: 9.99 },
        { cycle: 'annual', price: 99.00 },
      ],
      limits: { diskGB: 25, bandwidthGB: 250, databases: 5, mailboxes: 10 },
    },
    {
      id: 'p0000000-0000-0000-0000-000000000002',
      name: 'Business Pro Cloud',
      type: 'shared',
      description: 'Isolated resource cgroups with dedicated Redis caching for WooCommerce and corporate platforms.',
      setupFee: 0.0,
      pricing: [
        { cycle: 'monthly', price: 29.99 },
        { cycle: 'annual', price: 299.00 },
      ],
      limits: { diskGB: 100, bandwidthGB: 1000, databases: 25, mailboxes: 50 },
    },
    {
      id: 'p0000000-0000-0000-0000-000000000003',
      name: 'Managed KVM VPS 4GB',
      type: 'vps',
      description: 'Dedicated 2 vCPU, 4GB RAM, 80GB NVMe storage with full root access and automated daily snapshots.',
      setupFee: 15.0,
      pricing: [
        { cycle: 'monthly', price: 49.99 },
        { cycle: 'annual', price: 499.00 },
      ],
      limits: { vcpu: 2, ramGB: 4, diskGB: 80, bandwidthGB: 2000 },
    },
  ];

  for (const p of products) {
    db.prepare(`
      INSERT INTO products (id, tenant_id, name, type, description, setup_fee, available, resource_limits)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `).run(p.id, defaultTenantId, p.name, p.type, p.description, p.setupFee, JSON.stringify(p.limits));

    for (const pr of p.pricing) {
      db.prepare(`
        INSERT INTO product_pricing (id, tenant_id, product_id, cycle, price)
        VALUES (?, ?, ?, ?, ?)
      `).run(`pr_${p.id}_${pr.cycle}`, defaultTenantId, p.id, pr.cycle, pr.price);
    }
  }

  // Seed sample active services
  db.prepare(`
    INSERT INTO services (id, tenant_id, customer_id, product_id, service_name, package, domain, billing_cycle, price, ip_address, server_hostname, username, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    's0000000-0000-0000-0000-000000000001',
    defaultTenantId,
    customers[0].id,
    products[0].id,
    'Starter Cloud (chenmedia.io)',
    products[0].name,
    'chenmedia.io',
    'monthly',
    9.99,
    '198.51.100.45',
    'srv1.runstead.net',
    'chenmedia',
    'active'
  );

  // Seed sample order and invoice
  db.prepare(`
    INSERT INTO orders (id, tenant_id, customer_id, order_number, product_id, product_name, status, amount, billing_cycle)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'o0000000-0000-0000-0000-000000000001',
    defaultTenantId,
    customers[0].id,
    'ORD-1001',
    products[0].id,
    products[0].name,
    'active',
    9.99,
    'monthly'
  );

  db.prepare(`
    INSERT INTO invoices (id, tenant_id, customer_id, order_id, invoice_number, status, subtotal, tax, total, currency, paid_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(
    'i0000000-0000-0000-0000-000000000001',
    defaultTenantId,
    customers[0].id,
    'o0000000-0000-0000-0000-000000000001',
    'INV-1001',
    'paid',
    9.99,
    0.50,
    10.49,
    'USD'
  );

  // Seed DNS zone & records
  db.prepare(`
    INSERT INTO dns_records (id, tenant_id, domain, type, host, value, ttl, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('dns_001', defaultTenantId, 'chenmedia.io', 'A', '@', '198.51.100.45', 3600, null);

  db.prepare(`
    INSERT INTO dns_records (id, tenant_id, domain, type, host, value, ttl, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('dns_002', defaultTenantId, 'chenmedia.io', 'CNAME', 'www', 'chenmedia.io', 3600, null);

  db.prepare(`
    INSERT INTO dns_records (id, tenant_id, domain, type, host, value, ttl, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('dns_003', defaultTenantId, 'chenmedia.io', 'MX', '@', 'mail.chenmedia.io', 3600, 10);
}

export function findLocalUserByEmail(email: string) {
  const db = getLocalDb();
  const normalized = email.toLowerCase().trim();
  const user = db.prepare('SELECT * FROM users WHERE lower(email) = ?').get(normalized) as any;
  if (!user) return null;

  const memberships = db.prepare(`
    SELECT tm.id, tm.tenant_id as tenantId, tm.role, t.name as tenantName, t.slug as tenantSlug, t.plan_tier as planTier
    FROM tenant_memberships tm
    JOIN tenants t ON tm.tenant_id = t.id
    WHERE tm.user_id = ?
  `).all(user.id) as any[];

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    passwordHash: user.password_hash,
    isPlatformAdmin: user.role === 'platform_admin' || user.role === 'admin',
    emailVerified: true,
    memberships: memberships.map((m) => ({
      id: m.id,
      tenantId: m.tenantId,
      role: m.role,
      tenant: {
        id: m.tenantId,
        name: m.tenantName,
        slug: m.tenantSlug,
        planTier: m.planTier,
      },
    })),
    customerProfiles: [] as any[],
  };
}

export function findLocalUserById(id: string) {
  const db = getLocalDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  if (!user) return null;

  const memberships = db.prepare(`
    SELECT tm.id, tm.tenant_id as tenantId, tm.role, t.name as tenantName, t.slug as tenantSlug, t.plan_tier as planTier
    FROM tenant_memberships tm
    JOIN tenants t ON tm.tenant_id = t.id
    WHERE tm.user_id = ?
  `).all(user.id) as any[];

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    passwordHash: user.password_hash,
    isPlatformAdmin: user.role === 'platform_admin' || user.role === 'admin',
    emailVerified: true,
    memberships: memberships.map((m) => ({
      id: m.id,
      tenantId: m.tenantId,
      role: m.role,
      tenant: {
        id: m.tenantId,
        name: m.tenantName,
        slug: m.tenantSlug,
        planTier: m.planTier,
      },
    })),
    customerProfiles: [] as any[],
  };
}

export function createLocalUser(data: { id: string; email: string; name: string; passwordHash: string; role?: string }) {
  const db = getLocalDb();
  db.prepare(`
    INSERT INTO users (id, email, name, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(data.id, data.email.toLowerCase().trim(), data.name, data.passwordHash, data.role || 'user');

  return {
    id: data.id,
    email: data.email.toLowerCase().trim(),
    name: data.name,
    isPlatformAdmin: data.role === 'platform_admin',
    emailVerified: true,
    memberships: [],
    customerProfiles: [],
  };
}

export function createLocalTenant(data: { id: string; name: string; slug: string }) {
  const db = getLocalDb();
  db.prepare(`
    INSERT INTO tenants (id, name, slug)
    VALUES (?, ?, ?)
  `).run(data.id, data.name, data.slug);
  return data;
}

export function createLocalTenantMembership(data: { id: string; tenantId: string; userId: string; role: string }) {
  const db = getLocalDb();
  db.prepare(`
    INSERT INTO tenant_memberships (id, tenant_id, user_id, role)
    VALUES (?, ?, ?, ?)
  `).run(data.id, data.tenantId, data.userId, data.role);
  return data;
}

