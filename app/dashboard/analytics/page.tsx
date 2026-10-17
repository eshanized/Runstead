'use client';

import { BarChart3, TrendingUp, Users, DollarSign, RefreshCw, Package } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-helpers';
import { useDemo } from '@/lib/demo/store';
import { getRevenueChartData, getCustomerGrowthData, getSalesByProduct, getServiceDistribution, formatCurrency } from '@/lib/demo/selectors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from 'recharts';

const chartConfig = {
  revenue: { label: 'Revenue', color: 'hsl(var(--chart-1))' },
  expenses: { label: 'Expenses', color: 'hsl(var(--chart-4))' },
  customers: { label: 'Customers', color: 'hsl(var(--chart-2))' },
  renewals: { label: 'Renewals', color: 'hsl(var(--chart-3))' },
};

const pieColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--muted-foreground))'];

export default function AnalyticsPage() {
  return (
    <DashboardShell>
      <AnalyticsContent />
    </DashboardShell>
  );
}

function AnalyticsContent() {
  const { state } = useDemo();
  const revenueData = getRevenueChartData(state);
  const customerData = getCustomerGrowthData(state);
  const salesData = getSalesByProduct(state);
  const serviceDist = getServiceDistribution(state);

  const renewalData = [
    { month: 'May', renewals: 12, churned: 2 },
    { month: 'Jun', renewals: 15, churned: 1 },
    { month: 'Jul', renewals: 18, churned: 3 },
    { month: 'Aug', renewals: 22, churned: 2 },
    { month: 'Sep', renewals: 25, churned: 4 },
    { month: 'Oct', renewals: 28, churned: 1 },
  ];

  const lifecycleData = [
    { name: 'Provisioned', value: 142 },
    { name: 'Renewed', value: 120 },
    { name: 'Suspended', value: 8 },
    { name: 'Canceled', value: 12 },
    { name: 'Upgraded', value: 18 },
  ];

  const marginData = [
    { month: 'May', margin: 42 },
    { month: 'Jun', margin: 44 },
    { month: 'Jul', margin: 45 },
    { month: 'Aug', margin: 47 },
    { month: 'Sep', margin: 46 },
    { month: 'Oct', margin: 48 },
  ];

  const totalRevenue6mo = revenueData.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalCustomers = state.customers.length;

  return (
    <>
      <DashboardPageHeader title="Analytics" description={`Performance telemetry, revenue cohorts, and operational health for ${state.business.businessName}.`} />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Revenue (6mo)', value: formatCurrency(totalRevenue6mo, state.business.currency), icon: DollarSign },
          { label: 'Total Customers', value: totalCustomers.toString(), icon: Users },
          { label: 'Avg Margin', value: '45.3%', icon: TrendingUp },
          { label: 'Renewal Rate', value: '92.1%', icon: RefreshCw },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-6">
              <kpi.icon className="h-5 w-5 text-muted-foreground" />
              <div className="mt-2 text-2xl font-bold">{kpi.value}</div>
              <div className="text-xs text-muted-foreground">{kpi.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="fillRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" fill="url(#fillRev)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Customer Growth</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <LineChart data={customerData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="customers" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Sales by Product</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={salesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={100} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Service Distribution</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie data={serviceDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(entry) => entry.name}>
                  {serviceDist.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Renewals vs Churn</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={renewalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="renewals" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="churned" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Simulated Margin Trend</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart data={marginData}>
                <defs>
                  <linearGradient id="fillMargin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="margin" stroke="hsl(var(--chart-3))" fill="url(#fillMargin)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Service Lifecycle Outcomes</CardTitle></CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart data={lifecycleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground">
        All analytics and financial metrics are calculated across your active customer invoices, subscriptions, and provisioned services.
      </p>
    </>
  );
}
