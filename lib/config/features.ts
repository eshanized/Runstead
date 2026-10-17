export interface Feature {
  icon: string;
  title: string;
  description: string;
  status: 'live' | 'available' | 'planned' | 'roadmap';
}

export const platformFeatures: Feature[] = [
  { icon: 'Users', title: 'Client Management', description: 'Centralized customer records with service history, billing context, and communication logs.', status: 'live' },
  { icon: 'CreditCard', title: 'Billing & Invoicing', description: 'Recurring billing, invoice generation, payment tracking, refunds, and credit balances.', status: 'live' },
  { icon: 'Zap', title: 'Provisioning Automation', description: 'Automated service lifecycle from order to activation, with retry handling and failure visibility.', status: 'live' },
  { icon: 'Globe', title: 'Domain Management', description: 'Domain search, registration workflows, DNS management, and renewal tracking.', status: 'live' },
  { icon: 'Server', title: 'Hosting Control', description: 'Shared hosting, VPS management, control panel integration, and resource monitoring.', status: 'live' },
  { icon: 'Store', title: 'White-label Storefront', description: 'Branded customer portals and storefronts with customizable products, pricing, and appearance.', status: 'live' },
  { icon: 'LifeBuoy', title: 'Support System', description: 'Ticket management, priority routing, internal notes, and customer conversation history.', status: 'live' },
  { icon: 'BarChart3', title: 'Analytics & Reporting', description: 'Revenue tracking, customer growth, service distribution, and lifecycle outcome reporting.', status: 'live' },
];

export const infrastructureFeatures: Feature[] = [
  { icon: 'Server', title: 'Shared Hosting', description: 'Multi-tenant hosting with resource isolation and automated account creation.', status: 'roadmap' },
  { icon: 'HardDrive', title: 'VPS Infrastructure', description: 'Virtual machine provisioning, resource scaling, and snapshot management.', status: 'roadmap' },
  { icon: 'PanelTop', title: 'Hosting Control Panel', description: 'Customer-facing server management with file, email, and database controls.', status: 'roadmap' },
  { icon: 'Globe', title: 'Domain Commerce', description: 'Direct domain registration through registrar relationships and accreditation.', status: 'planned' },
  { icon: 'Network', title: 'Authoritative DNS', description: 'Self-operated DNS servers with zone management and record propagation.', status: 'roadmap' },
  { icon: 'ShieldCheck', title: 'SSL Automation', description: 'Certificate provisioning, renewal, and deployment without manual intervention.', status: 'roadmap' },
  { icon: 'Database', title: 'Storage & Backup', description: 'Managed storage volumes, automated backups, and point-in-time recovery.', status: 'roadmap' },
  { icon: 'Activity', title: 'Monitoring & Security', description: 'Infrastructure health monitoring, abuse prevention, and operational alerting.', status: 'roadmap' },
];

export interface RoadmapStage {
  stage: string;
  title: string;
  description: string;
  items: { name: string; status: 'live' | 'available' | 'planned' | 'roadmap' }[];
}

export const roadmapStages: RoadmapStage[] = [
  {
    stage: 'Stage 1',
    title: 'SaaS Foundation',
    description: 'Establish the core business-management platform.',
    items: [
      { name: 'Client management', status: 'live' },
      { name: 'Billing & invoicing', status: 'live' },
      { name: 'Product catalog', status: 'live' },
      { name: 'Dashboard & analytics', status: 'live' },
      { name: 'Storefront editor', status: 'live' },
    ],
  },
  {
    stage: 'Stage 2',
    title: 'WHMCS-Alternative Core',
    description: 'Reach feature parity with established hosting-billing systems.',
    items: [
      { name: 'Order automation', status: 'live' },
      { name: 'Service lifecycle', status: 'live' },
      { name: 'Support ticketing', status: 'live' },
      { name: 'Domain management', status: 'live' },
      { name: 'DNS zone editor', status: 'live' },
    ],
  },
  {
    stage: 'Stage 3',
    title: 'Hosting Automation',
    description: 'Connect and automate real hosting infrastructure.',
    items: [
      { name: 'Provisioning connectors', status: 'planned' },
      { name: 'Control panel integration', status: 'roadmap' },
      { name: 'Service monitoring', status: 'planned' },
      { name: 'Resource management', status: 'roadmap' },
    ],
  },
  {
    stage: 'Stage 4',
    title: 'Domain & DNS Ecosystem',
    description: 'Build domain commerce and authoritative DNS capabilities.',
    items: [
      { name: 'Registrar integrations', status: 'planned' },
      { name: 'Domain registration flow', status: 'planned' },
      { name: 'Authoritative DNS', status: 'roadmap' },
      { name: 'SSL automation', status: 'roadmap' },
    ],
  },
  {
    stage: 'Stage 5',
    title: 'Owned Infrastructure',
    description: 'Operate hosting nodes, storage, and network infrastructure.',
    items: [
      { name: 'Hosting nodes', status: 'roadmap' },
      { name: 'VPS infrastructure', status: 'roadmap' },
      { name: 'Storage & backup', status: 'roadmap' },
      { name: 'Network operations', status: 'roadmap' },
    ],
  },
  {
    stage: 'Stage 6',
    title: 'Developer Ecosystem',
    description: 'Open APIs, integrations, and enterprise capabilities.',
    items: [
      { name: 'Public API', status: 'planned' },
      { name: 'Webhook system', status: 'planned' },
      { name: 'Marketplace integrations', status: 'roadmap' },
      { name: 'Enterprise compliance', status: 'roadmap' },
    ],
  },
];

export interface IntegrationCategory {
  category: string;
  icon: string;
  integrations: {
    name: string;
    description: string;
    status: 'demo' | 'planned' | 'available' | 'unavailable' | 'roadmap';
  }[];
}

export const integrationCategories: IntegrationCategory[] = [
  {
    category: 'Hosting Providers',
    icon: 'Server',
    integrations: [
      { name: 'cPanel / WHM', description: 'Shared hosting account provisioning and management', status: 'planned' },
      { name: 'Plesk', description: 'Multi-platform hosting control panel integration', status: 'planned' },
      { name: 'DirectAdmin', description: 'Lightweight hosting panel for account management', status: 'planned' },
      { name: 'Virtualmin', description: 'Open-source hosting panel on top of Webmin', status: 'roadmap' },
    ],
  },
  {
    category: 'Domain Registrars',
    icon: 'Globe',
    integrations: [
      { name: 'ResellerClub', description: 'Domain registration and transfer via reseller API', status: 'planned' },
      { name: 'Enom', description: 'Domain registration, transfer, and DNS management', status: 'planned' },
      { name: 'Namecheap', description: 'Domain registration via partner API', status: 'roadmap' },
      { name: 'OpenSRS', description: 'Wholesale domain registration and DNS services', status: 'roadmap' },
    ],
  },
  {
    category: 'Payment Gateways',
    icon: 'CreditCard',
    integrations: [
      { name: 'Stripe', description: 'Card payments, subscriptions, and automated billing', status: 'planned' },
      { name: 'PayPal', description: 'PayPal checkout and recurring payment agreements', status: 'planned' },
      { name: 'Bank Transfer', description: 'Manual payment confirmation and bank reconciliation', status: 'available' },
      { name: 'Razorpay', description: 'Indian market payment gateway with UPI support', status: 'roadmap' },
    ],
  },
  {
    category: 'DNS Providers',
    icon: 'Network',
    integrations: [
      { name: 'Cloudflare', description: 'DNS management and CDN integration', status: 'planned' },
      { name: 'Route 53', description: 'AWS DNS service with health checks and routing', status: 'planned' },
      { name: 'Self-operated DNS', description: 'Our own authoritative DNS servers (roadmap)', status: 'roadmap' },
      { name: 'DigitalOcean DNS', description: 'DigitalOcean networking DNS management', status: 'roadmap' },
    ],
  },
  {
    category: 'Email Services',
    icon: 'Mail',
    integrations: [
      { name: 'SMTP Relay', description: 'Outgoing email through configurable SMTP servers', status: 'planned' },
      { name: 'SendGrid', description: 'Transactional email delivery and templates', status: 'planned' },
      { name: 'Mailgun', description: 'Email routing, validation, and delivery analytics', status: 'roadmap' },
      { name: 'Postmark', description: 'High-deliverability transactional email', status: 'roadmap' },
    ],
  },
  {
    category: 'Monitoring',
    icon: 'Activity',
    integrations: [
      { name: 'Uptime Checks', description: 'Built-in service availability monitoring', status: 'planned' },
      { name: 'Grafana', description: 'Infrastructure metrics visualization and alerting', status: 'roadmap' },
      { name: 'PagerDuty', description: 'Incident escalation and on-call alerting', status: 'roadmap' },
      { name: 'Status Pages', description: 'Public and private service status communication', status: 'planned' },
    ],
  },
  {
    category: 'Backup Services',
    icon: 'DatabaseBackup',
    integrations: [
      { name: 'Local Backups', description: 'On-platform data backup and export', status: 'available' },
      { name: 'S3-compatible Storage', description: 'Backup to AWS S3, MinIO, or compatible stores', status: 'planned' },
      { name: 'BorgBackup', description: 'Deduplicating encrypted backup integration', status: 'roadmap' },
      { name: 'Restic', description: 'Fast, secure, and efficient backup tool integration', status: 'roadmap' },
    ],
  },
  {
    category: 'Developer Integrations',
    icon: 'Code',
    integrations: [
      { name: 'REST API', description: 'Full programmatic access to platform resources', status: 'planned' },
      { name: 'Webhooks', description: 'Event-driven notifications for external systems', status: 'planned' },
      { name: 'CLI Tools', description: 'Command-line interface for automation scripts', status: 'roadmap' },
      { name: 'Terraform Provider', description: 'Infrastructure-as-code for platform resources', status: 'roadmap' },
    ],
  },
];
