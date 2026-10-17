'use client';

import Link from 'next/link';
import {
  DollarSign, Users, Server, ShoppingCart, FileText, RefreshCw,
  TrendingUp, TrendingDown, Activity, ArrowRight,
} from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-helpers';
import { useDemo } from '@/lib/demo/store';
import {
  getDashboardStats, getRevenueChartData, getCustomerGrowthData,
  getRecentOrders, getRecentInvoices, getRecentServices, getSystemStatus,
  formatCurrency, relativeTime,
} from '@/lib/demo/selectors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from '@/components/ui/chart';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  Tooltip, CartesianGrid,
} from 'recharts';
import { Badge } from '@/components/ui/badge';

const chartConfig = {
  revenue: { label: 'Revenue', color: 'hsl(var(--chart-1))' },
  expenses: { label: 'Expenses', color: 'hsl(var(--muted-foreground))' },
  customers: { label: 'Customers', color: 'hsl(var(--chart-2))' },
};

export default function OverviewPage() {
  return (
    <DashboardShell>
      <OverviewContent />
    </DashboardShell>
  );
}

function OverviewContent() {
  const { state } = useDemo();
  const stats = getDashboardStats(state);
  const revenueData = getRevenueChartData(state);
  const customerData = getCustomerGrowthData(state);
  const recentOrders = getRecentOrders(state, 5);
  const recentInvoices = getRecentInvoices(state, 5);
  const recentServices = getRecentServices(state, 5);
  const systemStatus = getSystemStatus(state);

  const statCards = [
    { label: 'MRR', value: formatCurrency(stats.monthlyRecurringRevenue, state.business.currency), icon: DollarSign, change: '+12.5%', trend: 'up' },
    { label: 'Active Customers', value: stats.activeCustomers.toString(), icon: Users, change: '+8 this month', trend: 'up' },
    { label: 'Active Services', value: stats.activeServices.toString(), icon: Server, change: '2 provisioned', trend: 'up' },
    { label: 'Pending Orders', value: stats.pendingOrders.toString(), icon: ShoppingCart, change: 'Awaiting action', trend: 'neutral' },
    { label: 'Outstanding', value: formatCurrency(stats.outstandingTotal, state.business.currency), icon: FileText, change: `${stats.outstandingInvoices} invoices`, trend: 'down' },
    { label: 'Renewals Due', value: stats.renewalsDue.toString(), icon: RefreshCw, change: 'Next 30 days', trend: 'neutral' },
  ];

  return (
    <>
      <DashboardPageHeader
        title="Dashboard Overview"
        description={`Operations and revenue telemetry for ${state.business.businessName}. Powered by PostgreSQL multi-tenant engine.`}
        actions={
          <Badge variant="outline" className="gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Platform
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
                {stat.trend === 'up' && <TrendingUp className="h-4 w-4 text-success" />}
                {stat.trend === 'down' && <TrendingDown className="h-4 w-4 text-destructive" />}
              </div>
              <div className="mt-2 text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
              <div className="mt-1 text-xs text-muted-foreground">{stat.change}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" fill="url(#fillRevenue)" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={customerData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="customers" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link key={order.id} href="/dashboard/orders" className="flex items-center justify-between rounded-lg border p-2.5 hover:bg-muted/30 transition-colors">
                  <div>
                    <div className="text-sm font-medium">{order.orderNumber}</div>
                    <div className="text-xs text-muted-foreground">{order.customerName} - {order.productName}</div>
                  </div>
                  <StatusBadge status={order.status} />
                </Link>
              ))}
            </div>
            <Link href="/dashboard/orders" className="mt-3 inline-flex items-center gap-1 text-sm text-accent hover:underline">
              View all orders <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentInvoices.map((inv) => (
                <Link key={inv.id} href="/dashboard/invoices" className="flex items-center justify-between rounded-lg border p-2.5 hover:bg-muted/30 transition-colors">
                  <div>
                    <div className="text-sm font-medium">{inv.invoiceNumber}</div>
                    <div className="text-xs text-muted-foreground">{inv.customerName} - {formatCurrency(inv.total, inv.currency)}</div>
                  </div>
                  <StatusBadge status={inv.status} />
                </Link>
              ))}
            </div>
            <Link href="/dashboard/invoices" className="mt-3 inline-flex items-center gap-1 text-sm text-accent hover:underline">
              View all invoices <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentServices.map((srv) => (
                <Link key={srv.id} href="/dashboard/services" className="flex items-center justify-between rounded-lg border p-2.5 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{srv.productName}</div>
                    <div className="text-xs text-muted-foreground truncate">{srv.customerName}</div>
                  </div>
                  <StatusBadge status={srv.status} />
                </Link>
              ))}
            </div>
            <Link href="/dashboard/services" className="mt-3 inline-flex items-center gap-1 text-sm text-accent hover:underline">
              View all services <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            System Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {systemStatus.map((s) => (
              <div key={s.service} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">{s.service}</div>
                  <div className="text-xs text-muted-foreground">Uptime: {s.uptime}</div>
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Status indicators are illustrative demo data and do not reflect real service monitoring.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
