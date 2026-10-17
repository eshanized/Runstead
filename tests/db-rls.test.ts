import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient, Prisma } from '@prisma/client';
import pg from 'pg';
import {
  SEED_TENANT_A_ID,
  SEED_TENANT_B_ID,
  SEED_CUSTOMER_A1_ID,
  SEED_CUSTOMER_A2_ID,
  SEED_CUSTOMER_B1_ID,
  SEED_CUSTOMER_B2_ID,
  SEED_PRODUCT_A1_ID,
  SEED_PRODUCT_B1_ID,
  SEED_ORDER_A1_ID,
  SEED_ORDER_B1_ID,
  SEED_INVOICE_A1_ID,
  SEED_INVOICE_B1_ID,
  SEED_SERVICE_A1_ID,
  SEED_SERVICE_B1_ID,
  SEED_DOMAIN_A1_ID,
  SEED_DOMAIN_B1_ID,
  seedDatabase,
} from '../lib/db/seed.ts';
import { withTenantContext } from '../lib/db/client.ts';

const TENANT_OWNED_TABLES = [
  'tenants',
  'tenant_memberships',
  'customers',
  'products',
  'product_pricing',
  'orders',
  'order_items',
  'invoices',
  'invoice_items',
  'payments',
  'services',
  'domains',
  'dns_records',
  'tickets',
  'ticket_messages',
  'provider_credentials',
  'background_jobs',
  'audit_events',
];

describe('PostgreSQL Multi-Tenant Row-Level Security (RLS) Integration Suite', { skip: process.env.SKIP_DB_TESTS === '1' ? 'Skipping DB integration tests due to SKIP_DB_TESTS=1' : false }, () => {
  let adminPrisma: PrismaClient;
  let appPrisma: PrismaClient;
  let appPgPool: pg.Pool;

  const testDbUrl =
    process.env.APP_DATABASE_TEST_URL ||
    process.env.APP_DATABASE_URL ||
    'postgresql://runstead_app:app_secret@127.0.0.1:54329/runstead_test?schema=public';

  const adminDbUrl =
    process.env.DATABASE_TEST_URL ||
    process.env.DATABASE_URL ||
    'postgresql://runstead_admin:admin_secret@127.0.0.1:54329/runstead_test?schema=public';

  before(async () => {
    // Probe database connectivity before initializing suites
    const probePool = new pg.Pool({ connectionString: adminDbUrl, connectionTimeoutMillis: 3000 });
    let isConnected = false;
    try {
      const client = await probePool.connect();
      await client.query('SELECT 1');
      client.release();
      isConnected = true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (process.env.CI) {
        throw new Error(
          `CRITICAL CI FAILURE: PostgreSQL test database is unreachable at ${adminDbUrl}: ${errMsg}. CI database container is mandatory for Phase 2 validation.`
        );
      }
      if (process.env.SKIP_DB_TESTS === '1') {
        console.warn(
          `[SKIP_DB_TESTS=1] Skipping PostgreSQL RLS suite: ${errMsg}. Note: CI strictly requires database tests to pass.`
        );
        return;
      }
      throw new Error(
        `PostgreSQL test database connection failed at ${adminDbUrl}: ${errMsg}.\n` +
          `To run database integration tests locally, ensure PostgreSQL is running and DATABASE_TEST_URL is configured.\n` +
          `To run only offline unit tests locally without database, run with SKIP_DB_TESTS=1.`
      );
    } finally {
      await probePool.end().catch(() => {});
    }

    if (!isConnected) return;

    adminPrisma = new PrismaClient({ datasources: { db: { url: adminDbUrl } } });
    appPrisma = new PrismaClient({ datasources: { db: { url: testDbUrl } } });
    appPgPool = new pg.Pool({ connectionString: testDbUrl });

    // Seed test fixtures into the test database
    await seedDatabase(adminPrisma);
  });

  after(async () => {
    if (appPgPool) await appPgPool.end().catch(() => {});
    if (appPrisma) await appPrisma.$disconnect().catch(() => {});
    if (adminPrisma) await adminPrisma.$disconnect().catch(() => {});
  });

  // ============================================================================
  // 1. Role Privilege & Security Posture Verification
  // ============================================================================
  describe('1. Database Role Privileges & Security Posture', () => {
    test('runstead_app role has NOBYPASSRLS and NOSUPERUSER privileges', async () => {
      const res = await adminPrisma.$queryRaw<Array<{ rolname: string; rolsuper: boolean; rolbypassrls: boolean }>>`
        SELECT rolname, rolsuper, rolbypassrls 
        FROM pg_roles 
        WHERE rolname = 'runstead_app';
      `;

      assert.equal(res.length, 1, 'runstead_app role must exist in PostgreSQL');
      assert.equal(res[0].rolsuper, false, 'runstead_app must NOT be a superuser');
      assert.equal(res[0].rolbypassrls, false, 'runstead_app must NOT have BYPASSRLS privilege');
    });

    test('All tenant-owned tables enforce rowsecurity and forcerowsecurity', async () => {
      const res = await adminPrisma.$queryRaw<Array<{ relname: string; relrowsecurity: boolean; relforcerowsecurity: boolean }>>`
        SELECT relname, relrowsecurity, relforcerowsecurity
        FROM pg_class
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE pg_namespace.nspname = 'public'
          AND relname = ANY(${TENANT_OWNED_TABLES});
      `;

      assert.equal(res.length, TENANT_OWNED_TABLES.length, `All ${TENANT_OWNED_TABLES.length} tables must exist in public schema`);

      for (const row of res) {
        assert.equal(row.relrowsecurity, true, `Table ${row.relname} must have Row-Level Security enabled`);
        assert.equal(row.relforcerowsecurity, true, `Table ${row.relname} must have FORCE ROW LEVEL SECURITY enabled`);
      }
    });

    test('All tenant-owned tables have registered tenant_isolation_policy in pg_policies', async () => {
      const res = await adminPrisma.$queryRaw<Array<{ tablename: string; policyname: string }>>`
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = ANY(${TENANT_OWNED_TABLES});
      `;

      const tablesWithPolicy = new Set(res.map((p) => p.tablename));
      for (const table of TENANT_OWNED_TABLES) {
        assert.ok(tablesWithPolicy.has(table), `Table ${table} must have an active RLS policy defined`);
      }
    });
  });

  // ============================================================================
  // 2. Tenant A Read Isolation & Visibility Checks
  // ============================================================================
  describe('2. Tenant A Read Isolation & Visibility', () => {
    test('Tenant A can read its own customer records', async () => {
      const customers = await withTenantContext(
        SEED_TENANT_A_ID,
        async (tx) => {
          return tx.customer.findMany({ select: { id: true, name: true, tenantId: true } });
        },
        appPrisma
      );

      assert.ok(customers.length >= 2, 'Tenant A should see at least 2 seeded customers');
      for (const c of customers) {
        assert.equal(c.tenantId, SEED_TENANT_A_ID, 'Customer must belong strictly to Tenant A');
      }
      assert.ok(customers.some((c) => c.id === SEED_CUSTOMER_A1_ID));
      assert.ok(customers.some((c) => c.id === SEED_CUSTOMER_A2_ID));
    });

    test('Tenant A CANNOT see Tenant B customers (query without explicit where filter)', async () => {
      const customers = await withTenantContext(
        SEED_TENANT_A_ID,
        async (tx) => {
          return tx.customer.findMany(); // Deliberately omit where: { tenantId } filter!
        },
        appPrisma
      );

      const customerIds = new Set(customers.map((c) => c.id));
      assert.equal(customerIds.has(SEED_CUSTOMER_B1_ID), false, 'Tenant B customer B1 must NOT be visible to Tenant A');
      assert.equal(customerIds.has(SEED_CUSTOMER_B2_ID), false, 'Tenant B customer B2 must NOT be visible to Tenant A');
    });

    test('Tenant A direct lookup for Tenant B customer ID returns null', async () => {
      const customer = await withTenantContext(
        SEED_TENANT_A_ID,
        async (tx) => {
          return tx.customer.findUnique({ where: { id: SEED_CUSTOMER_B1_ID } });
        },
        appPrisma
      );

      assert.equal(customer, null, 'Direct findUnique for Tenant B customer must return null under Tenant A context');
    });

    test('Tenant A aggregates and counts do not leak Tenant B volume', async () => {
      const [countA, countB] = await Promise.all([
        withTenantContext(SEED_TENANT_A_ID, (tx) => tx.customer.count(), appPrisma),
        withTenantContext(SEED_TENANT_B_ID, (tx) => tx.customer.count(), appPrisma),
      ]);

      assert.equal(countA, 2, 'Tenant A customer count must accurately reflect only Tenant A rows');
      assert.equal(countB, 2, 'Tenant B customer count must accurately reflect only Tenant B rows');
    });

    test('Tenant A nested relation queries do NOT expose Tenant B child records', async () => {
      const orders = await withTenantContext(
        SEED_TENANT_A_ID,
        async (tx) => {
          return tx.order.findMany({
            include: {
              customer: true,
              product: true,
              items: true,
            },
          });
        },
        appPrisma
      );

      assert.ok(orders.length >= 1, 'Tenant A should have at least 1 order');
      for (const order of orders) {
        assert.equal(order.tenantId, SEED_TENANT_A_ID);
        assert.equal(order.customer.tenantId, SEED_TENANT_A_ID);
        assert.equal(order.product.tenantId, SEED_TENANT_A_ID);
        assert.notEqual(order.id, SEED_ORDER_B1_ID);
      }
    });

    test('Tenant A cannot read Tenant B domains, services, invoices, or tickets', async () => {
      await withTenantContext(
        SEED_TENANT_A_ID,
        async (tx) => {
          const domainB = await tx.domain.findUnique({ where: { id: SEED_DOMAIN_B1_ID } });
          assert.equal(domainB, null, 'Tenant B domain must be invisible to Tenant A');

          const serviceB = await tx.service.findUnique({ where: { id: SEED_SERVICE_B1_ID } });
          assert.equal(serviceB, null, 'Tenant B service must be invisible to Tenant A');

          const invoiceB = await tx.invoice.findUnique({ where: { id: SEED_INVOICE_B1_ID } });
          assert.equal(invoiceB, null, 'Tenant B invoice must be invisible to Tenant A');

          const products = await tx.product.findMany();
          assert.ok(products.every((p) => p.tenantId === SEED_TENANT_A_ID));
        },
        appPrisma
      );
    });
  });

  // ============================================================================
  // 3. Tenant A Write Isolation (CRUD Protection)
  // ============================================================================
  describe('3. Tenant A Write Isolation (Tampering Prevention)', () => {
    test('Tenant A can insert a valid new customer assigned to itself', async () => {
      const testCustomerId = 'c1111111-9999-9999-9999-000000000001';

      const created = await withTenantContext(
        SEED_TENANT_A_ID,
        async (tx) => {
          return tx.customer.create({
            data: {
              id: testCustomerId,
              tenantId: SEED_TENANT_A_ID,
              name: 'Legitimate Tenant A Client',
              email: 'legit@tenanta-client.test',
              status: 'active',
              country: 'US',
            },
          });
        },
        appPrisma
      );

      assert.equal(created.id, testCustomerId);
      assert.equal(created.tenantId, SEED_TENANT_A_ID);

      // Clean up test customer
      await withTenantContext(
        SEED_TENANT_A_ID,
        async (tx) => {
          await tx.customer.delete({ where: { id: testCustomerId } });
        },
        appPrisma
      );
    });

    test('Tenant A CANNOT insert a customer assigned to Tenant B (RLS WITH CHECK rejection)', async () => {
      const illicitId = 'c2222222-9999-9999-9999-000000000001';

      await assert.rejects(
        async () => {
          await withTenantContext(
            SEED_TENANT_A_ID,
            async (tx) => {
              return tx.customer.create({
                data: {
                  id: illicitId,
                  tenantId: SEED_TENANT_B_ID, // Illicit tenant ID assignment!
                  name: 'Trojan Client Injected by Tenant A',
                  email: 'trojan@injected.test',
                  status: 'active',
                  country: 'US',
                },
              });
            },
            appPrisma
          );
        },
        (err: Error) => {
          // Should fail due to PostgreSQL RLS policy violation
          assert.match(err.message, /violates row-level security policy|P2004/i);
          return true;
        },
        'Inserting a record with a mismatched tenant_id under Tenant A context must be rejected by RLS'
      );
    });

    test('Tenant A updating Tenant B customer affects 0 rows (invisible target)', async () => {
      // In Prisma, trying to update a non-existent row throws RecordNotFound
      await assert.rejects(
        async () => {
          await withTenantContext(
            SEED_TENANT_A_ID,
            async (tx) => {
              return tx.customer.update({
                where: { id: SEED_CUSTOMER_B1_ID },
                data: { name: 'Compromised Name' },
              });
            },
            appPrisma
          );
        },
        (err: Error) => {
          // Record is not found because RLS hides it from Tenant A
          assert.match(err.message, /required but not found|not found for an update|record to update not found|P2025/i);
          return true;
        }
      );

      // Also verify updateMany affects exactly 0 rows
      const updateManyRes = await withTenantContext(
        SEED_TENANT_A_ID,
        async (tx) => {
          return tx.customer.updateMany({
            where: { id: SEED_CUSTOMER_B1_ID },
            data: { name: 'Compromised Name' },
          });
        },
        appPrisma
      );
      assert.equal(updateManyRes.count, 0, 'updateMany targeting Tenant B record must affect 0 rows');
    });

    test('Tenant A CANNOT reassign its own customer to Tenant B (RLS WITH CHECK violation)', async () => {
      await assert.rejects(
        async () => {
          await withTenantContext(
            SEED_TENANT_A_ID,
            async (tx) => {
              // Attempt to transfer Tenant A's customer to Tenant B
              return tx.$executeRaw`
                UPDATE customers 
                SET tenant_id = ${SEED_TENANT_B_ID}::uuid 
                WHERE id = ${SEED_CUSTOMER_A1_ID}::uuid;
              `;
            },
            appPrisma
          );
        },
        (err: Error) => {
          assert.match(err.message, /violates row-level security policy/i);
          return true;
        },
        'Reassigning tenant_id to another tenant must trigger RLS WITH CHECK policy rejection'
      );
    });

    test('Tenant A deleting Tenant B customer affects 0 rows', async () => {
      await assert.rejects(
        async () => {
          await withTenantContext(
            SEED_TENANT_A_ID,
            async (tx) => {
              return tx.customer.delete({ where: { id: SEED_CUSTOMER_B1_ID } });
            },
            appPrisma
          );
        },
        (err: Error) => {
          assert.match(err.message, /required but not found|not found for a delete|record to delete does not exist|P2025/i);
          return true;
        }
      );

      // Also verify deleteMany affects exactly 0 rows
      const deleteManyRes = await withTenantContext(
        SEED_TENANT_A_ID,
        async (tx) => {
          return tx.customer.deleteMany({
            where: { id: SEED_CUSTOMER_B1_ID },
          });
        },
        appPrisma
      );
      assert.equal(deleteManyRes.count, 0, 'deleteMany targeting Tenant B record must affect 0 rows');
    });

    test('Tenant A CANNOT create cross-tenant foreign key relationships', async () => {
      await assert.rejects(
        async () => {
          await withTenantContext(
            SEED_TENANT_A_ID,
            async (tx) => {
              // Attempt to create an Order for Tenant A referencing Tenant B's customer
              return tx.order.create({
                data: {
                  id: 'e1111111-9999-9999-9999-000000000001',
                  tenantId: SEED_TENANT_A_ID,
                  orderNumber: 'ORD-ILLICIT-001',
                  customerId: SEED_CUSTOMER_B1_ID, // Foreign customer belonging to Tenant B!
                  productId: SEED_PRODUCT_A1_ID,
                  status: 'awaiting_payment',
                  amount: 99.0,
                  billingCycle: 'monthly',
                },
              });
            },
            appPrisma
          );
        },
        (err: Error) => {
          // Disallowed by composite foreign key constraint (tenant_id, customer_id)
          assert.match(err.message, /foreign key constraint|violates|P2003/i);
          return true;
        },
        'Creating cross-tenant foreign key links must be rejected by composite foreign key constraints'
      );
    });
  });

  // ============================================================================
  // 4. Tenant B Verification (Data Integrity Guarantee)
  // ============================================================================
  describe('4. Tenant B Integrity Verification after Attempted Breaches', () => {
    test('Tenant B data remains 100% unaltered following Tenant A attack attempts', async () => {
      const customerB1 = await withTenantContext(
        SEED_TENANT_B_ID,
        async (tx) => {
          return tx.customer.findUnique({ where: { id: SEED_CUSTOMER_B1_ID } });
        },
        appPrisma
      );

      assert.ok(customerB1, 'Customer B1 must still exist');
      assert.equal(customerB1.name, 'Oslo Media AS (Tenant B)', 'Customer B1 name must NOT have been changed');
      assert.equal(customerB1.email, 'kontakt@oslomedia.dev', 'Customer B1 email must be intact');
      assert.equal(customerB1.tenantId, SEED_TENANT_B_ID, 'Customer B1 must still belong to Tenant B');
    });

    test('Tenant B can still perform legitimate mutations on its own records', async () => {
      const updated = await withTenantContext(
        SEED_TENANT_B_ID,
        async (tx) => {
          return tx.customer.update({
            where: { id: SEED_CUSTOMER_B1_ID },
            data: { company: 'Oslo Media Group International' },
          });
        },
        appPrisma
      );

      assert.equal(updated.company, 'Oslo Media Group International');

      // Revert change
      await withTenantContext(
        SEED_TENANT_B_ID,
        async (tx) => {
          await tx.customer.update({
            where: { id: SEED_CUSTOMER_B1_ID },
            data: { company: 'Oslo Media Group' },
          });
        },
        appPrisma
      );
    });
  });

  // ============================================================================
  // 5. Missing & Invalid Context Behavior (Fail-Closed Enforcement)
  // ============================================================================
  describe('5. Fail-Closed Tenant Context Enforcement', () => {
    test('Queries without tenant context return 0 rows for all tenant-owned tables', async () => {
      // Direct raw query without any set_config
      const client = await appPgPool.connect();
      try {
        for (const table of TENANT_OWNED_TABLES) {
          const res = await client.query(`SELECT count(*) FROM "${table}";`);
          assert.equal(
            Number(res.rows[0].count),
            0,
            `Table ${table} must return 0 rows when queried without tenant context`
          );
        }
      } finally {
        client.release();
      }
    });

    test('Inserts without valid tenant context are rejected by RLS', async () => {
      const client = await appPgPool.connect();
      try {
        await assert.rejects(
          async () => {
            await client.query(`
              INSERT INTO customers (id, tenant_id, name, email, updated_at) 
              VALUES ('c9999999-0000-0000-0000-000000000001', '${SEED_TENANT_A_ID}', 'No Context Client', 'nocontext@test.com', now());
            `);
          },
          /violates row-level security policy/i,
          'Insert without context must fail RLS policy'
        );
      } finally {
        client.release();
      }
    });

    test('Setting empty string context fails closed and exposes 0 rows', async () => {
      const client = await appPgPool.connect();
      try {
        await client.query('BEGIN');
        await client.query("SELECT set_config('app.current_tenant_id', '', true)");
        const res = await client.query('SELECT count(*) FROM customers');
        assert.equal(Number(res.rows[0].count), 0, 'Empty string context must return 0 rows');
        await client.query('COMMIT');
      } finally {
        client.release();
      }
    });

    test('Setting malformed context fails closed and exposes 0 rows', async () => {
      const client = await appPgPool.connect();
      try {
        await client.query('BEGIN');
        await client.query("SELECT set_config('app.current_tenant_id', 'not-a-valid-uuid-1234', true)");
        const res = await client.query('SELECT count(*) FROM customers');
        assert.equal(Number(res.rows[0].count), 0, 'Malformed context must return 0 rows');
        await client.query('COMMIT');
      } finally {
        client.release();
      }
    });

    test('SQL injection attempt in tenant context is safely handled and exposes 0 rows', async () => {
      const client = await appPgPool.connect();
      try {
        await client.query('BEGIN');
        await client.query("SELECT set_config('app.current_tenant_id', '11111111-1111-1111-1111-111111111111'' OR ''1''=''1', true)");
        const res = await client.query('SELECT count(*) FROM customers');
        assert.equal(Number(res.rows[0].count), 0, 'SQL injection in tenant context must fail closed');
        await client.query('COMMIT');
      } finally {
        client.release();
      }
    });
  });

  // ============================================================================
  // 6. Connection Pool Leakage Safeguards
  // ============================================================================
  describe('6. Connection Pool Isolation & Session Leakage Prevention', () => {
    test('Consecutive operations across the pool never leak tenant state', async () => {
      // Step 1: Operation under Tenant A
      const customersA = await withTenantContext(
        SEED_TENANT_A_ID,
        async (tx) => {
          return tx.customer.findMany({ select: { name: true } });
        },
        appPrisma
      );
      assert.ok(customersA.length > 0, 'Tenant A returned records');

      // Step 2: Immediate un-scoped query over the pool -> Must return 0 rows
      const unScoped1 = await appPrisma.customer.findMany();
      assert.equal(unScoped1.length, 0, 'Connection pool query after Tenant A must NOT retain Tenant A context');

      // Step 3: Operation under Tenant B
      const customersB = await withTenantContext(
        SEED_TENANT_B_ID,
        async (tx) => {
          return tx.customer.findMany({ select: { name: true } });
        },
        appPrisma
      );
      assert.ok(customersB.length > 0, 'Tenant B returned records');

      // Step 4: Immediate un-scoped query over the pool -> Must return 0 rows
      const unScoped2 = await appPrisma.customer.findMany();
      assert.equal(unScoped2.length, 0, 'Connection pool query after Tenant B must NOT retain Tenant B context');
    });
  });

  // ============================================================================
  // 7. Direct Raw SQL Isolation Verification (Unprivileged Role)
  // ============================================================================
  describe('7. Direct Raw SQL Query Isolation under Restricted Role', () => {
    test('Direct unprivileged SQL enforces RLS without ORM assistance', async () => {
      const client = await appPgPool.connect();
      try {
        await client.query('BEGIN');
        await client.query(`SELECT set_config('app.current_tenant_id', '${SEED_TENANT_A_ID}', true);`);

        // Direct SELECT * without WHERE clause
        const res = await client.query('SELECT id, tenant_id, name FROM customers;');
        assert.ok(res.rows.length >= 2, 'Tenant A direct SQL must return its own rows');
        for (const row of res.rows) {
          assert.equal(row.tenant_id, SEED_TENANT_A_ID, 'Row must belong to Tenant A');
          assert.notEqual(row.id, SEED_CUSTOMER_B1_ID, 'Tenant B row must not appear in Tenant A query');
        }

        await client.query('COMMIT');
      } finally {
        client.release();
      }
    });

    test('Direct SQL cross-tenant update affects 0 rows', async () => {
      const client = await appPgPool.connect();
      try {
        await client.query('BEGIN');
        await client.query(`SELECT set_config('app.current_tenant_id', '${SEED_TENANT_A_ID}', true);`);

        const updateRes = await client.query(`
          UPDATE customers 
          SET name = 'Illicit Raw SQL Update' 
          WHERE id = '${SEED_CUSTOMER_B1_ID}';
        `);

        assert.equal(updateRes.rowCount, 0, 'Raw SQL update targeting Tenant B row must affect 0 rows');

        await client.query('COMMIT');
      } finally {
        client.release();
      }
    });
  });
});
