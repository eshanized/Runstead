export interface NavItem {
  label: string;
  href: string;
  description?: string;
  children?: NavItem[];
}

export const marketingNav: NavItem[] = [
  {
    label: 'Platform',
    href: '/platform',
    description: 'The complete hosting-business operating system',
    children: [
      { label: 'Overview', href: '/platform', description: 'Architecture and ecosystem' },
      { label: 'Billing & Business', href: '/platform/billing', description: 'Customers, invoices, subscriptions' },
      { label: 'Automation', href: '/platform/automation', description: 'Service lifecycle and provisioning' },
      { label: 'Domains', href: '/platform/domains', description: 'Registration, DNS, SSL' },
      { label: 'Hosting', href: '/platform/hosting', description: 'Shared, VPS, control panels' },
    ],
  },
  { label: 'Solutions', href: '/solutions' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Progress', href: '/progress' },
  { label: 'Roadmap', href: '/roadmap' },
  { label: 'Security', href: '/security' },
];

export const footerNav: { title: string; links: NavItem[] }[] = [
  {
    title: 'Platform',
    links: [
      { label: 'Overview', href: '/platform' },
      { label: 'Billing & Business', href: '/platform/billing' },
      { label: 'Automation', href: '/platform/automation' },
      { label: 'Domains & DNS', href: '/platform/domains' },
      { label: 'Hosting', href: '/platform/hosting' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Live Progress', href: '/progress' },
      { label: 'Roadmap', href: '/roadmap' },
      { label: 'Security', href: '/security' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Solutions', href: '/solutions' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Integrations', href: '/integrations' },
      { label: 'Live Progress Dashboard', href: '/progress' },
      { label: 'Platform Console', href: '/dashboard/overview' },
    ],
  },
];

export const dashboardNav: { label: string; href: string; icon: string }[] = [
  { label: 'Overview', href: '/dashboard/overview', icon: 'LayoutDashboard' },
  { label: 'Customers', href: '/dashboard/customers', icon: 'Users' },
  { label: 'Products', href: '/dashboard/products', icon: 'Package' },
  { label: 'Orders', href: '/dashboard/orders', icon: 'ShoppingCart' },
  { label: 'Services', href: '/dashboard/services', icon: 'Server' },
  { label: 'Domains', href: '/dashboard/domains', icon: 'Globe' },
  { label: 'DNS Zones', href: '/dashboard/dns', icon: 'Network' },
  { label: 'Invoices', href: '/dashboard/invoices', icon: 'FileText' },
  { label: 'Support', href: '/dashboard/tickets', icon: 'LifeBuoy' },
  { label: 'Analytics', href: '/dashboard/analytics', icon: 'BarChart3' },
  { label: 'Storefront', href: '/dashboard/storefront', icon: 'Store' },
  { label: 'Integrations', href: '/dashboard/integrations', icon: 'Plug' },
  { label: 'Settings', href: '/dashboard/settings', icon: 'Settings' },
  { label: 'Onboarding', href: '/dashboard/onboarding', icon: 'Rocket' },
];

export const demoNav = dashboardNav;

