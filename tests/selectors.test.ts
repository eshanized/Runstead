import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { seedData } from '../lib/demo/seed-data.ts';
import {
  searchCustomers,
  filterCustomersByStatus,
  sortCustomers,
  paginate,
  totalPages,
  searchProducts,
  filterProductsByType,
  searchOrders,
  filterOrdersByStatus,
  searchServices,
  filterServicesByStatus,
  searchDomains,
  searchInvoices,
  filterInvoicesByStatus,
  searchTickets,
  filterTicketsByStatus,
  filterTicketsByPriority,
  getDashboardStats,
  checkDomainAvailability,
  formatCurrency,
  formatDate,
} from '../lib/demo/selectors.ts';

describe('Demo Selectors and Calculations', () => {
  test('searchCustomers matches name, email, company, or country', () => {
    const byName = searchCustomers(seedData.customers, 'sarah');
    assert.ok(byName.length >= 1, 'Should find customer Sarah');
    assert.ok(byName.some((c) => c.name.toLowerCase().includes('sarah')));

    const byCountry = searchCustomers(seedData.customers, 'germany');
    assert.ok(byCountry.length >= 1, 'Should find customer in Germany');

    const empty = searchCustomers(seedData.customers, 'nonexistentqueryxyz');
    assert.equal(empty.length, 0);
  });

  test('filterCustomersByStatus filters correctly', () => {
    const active = filterCustomersByStatus(seedData.customers, 'active');
    assert.ok(active.every((c) => c.status === 'active'));

    const all = filterCustomersByStatus(seedData.customers, 'all');
    assert.equal(all.length, seedData.customers.length);
  });

  test('sortCustomers orders by field and direction', () => {
    const sortedAsc = sortCustomers(seedData.customers, 'name', true);
    for (let i = 0; i < sortedAsc.length - 1; i++) {
      assert.ok(sortedAsc[i].name.localeCompare(sortedAsc[i + 1].name) <= 0);
    }

    const sortedDesc = sortCustomers(seedData.customers, 'name', false);
    for (let i = 0; i < sortedDesc.length - 1; i++) {
      assert.ok(sortedDesc[i].name.localeCompare(sortedDesc[i + 1].name) >= 0);
    }
  });

  test('paginate and totalPages behave accurately', () => {
    const items = [1, 2, 3, 4, 5, 6, 7];
    const page1 = paginate(items, 1, 3);
    assert.deepEqual(page1, [1, 2, 3]);

    const page2 = paginate(items, 2, 3);
    assert.deepEqual(page2, [4, 5, 6]);

    const page3 = paginate(items, 3, 3);
    assert.deepEqual(page3, [7]);

    assert.equal(totalPages(7, 3), 3);
    assert.equal(totalPages(6, 3), 2);
    assert.equal(totalPages(0, 3), 1);
  });

  test('product search and filter', () => {
    const shared = filterProductsByType(seedData.products, 'shared_hosting');
    assert.ok(shared.every((p) => p.type === 'shared_hosting'));

    const vps = filterProductsByType(seedData.products, 'vps');
    assert.ok(vps.every((p) => p.type === 'vps'));

    const searched = searchProducts(seedData.products, 'Hosting');
    assert.ok(searched.length > 0);
    assert.ok(searched.some((p) => p.name.includes('Hosting')));
  });

  test('order and service filtering', () => {
    const activeServices = filterServicesByStatus(seedData.services, 'active');
    assert.ok(activeServices.every((s) => s.status === 'active'));

    const paidOrders = filterOrdersByStatus(seedData.orders, 'paid');
    assert.ok(paidOrders.every((o) => o.status === 'paid'));
  });

  test('domain search and deterministic availability check', () => {
    const res1 = checkDomainAvailability('mycoolbusiness.com');
    const res2 = checkDomainAvailability('mycoolbusiness.com');
    assert.equal(res1.available, res2.available);
    assert.equal(res1.price, res2.price);
    assert.equal(res1.tld, 'com');
  });

  test('getDashboardStats derives consistent metric figures', () => {
    const stats = getDashboardStats(seedData);
    assert.ok(stats.monthlyRecurringRevenue > 0);
    assert.ok(stats.activeCustomers > 0);
    assert.ok(stats.activeServices > 0);
    assert.equal(typeof stats.pendingOrders, 'number');
    assert.equal(typeof stats.outstandingInvoices, 'number');
  });

  test('formatters format currency and dates accurately', () => {
    assert.equal(formatCurrency(100), '$100.00');
    assert.ok(formatDate('2026-10-14T00:00:00Z').includes('2026'));
  });
});
