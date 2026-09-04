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
      { label: 'Interactive Demo', href: '/demo' },
    ],
  },
];

export const demoNav: { label: string; href: string; icon: string }[] = [
  { label: 'Overview', href: '/demo/overview', icon: 'LayoutDashboard' },
  { label: 'Customers', href: '/demo/customers', icon: 'Users' },
  { label: 'Products', href: '/demo/products', icon: 'Package' },
  { label: 'Orders', href: '/demo/orders', icon: 'ShoppingCart' },
  { label: 'Services', href: '/demo/services', icon: 'Server' },
  { label: 'Domains', href: '/demo/domains', icon: 'Globe' },
  { label: 'DNS Zones', href: '/demo/dns', icon: 'Network' },
  { label: 'Invoices', href: '/demo/invoices', icon: 'FileText' },
  { label: 'Support', href: '/demo/tickets', icon: 'LifeBuoy' },
  { label: 'Analytics', href: '/demo/analytics', icon: 'BarChart3' },
  { label: 'Storefront', href: '/demo/storefront', icon: 'Store' },
  { label: 'Integrations', href: '/demo/integrations', icon: 'Plug' },
  { label: 'Settings', href: '/demo/settings', icon: 'Settings' },
  { label: 'Onboarding', href: '/demo/onboarding', icon: 'Rocket' },
];
