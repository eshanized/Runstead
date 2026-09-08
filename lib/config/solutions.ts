export interface Solution {
  slug: string;
  icon: string;
  title: string;
  tagline: string;
  description: string;
  benefits: string[];
  features: { title: string; description: string }[];
}

export const solutions: Solution[] = [
  {
    slug: 'freelancers',
    icon: 'Code',
    title: 'Freelancers & Independent Developers',
    tagline: 'Turn client hosting into recurring revenue',
    description:
      'Stop losing hosting revenue to third-party panels you can not brand or control. Manage your clients, billing, and services from a single dashboard that looks like your business, not someone else is.',
    benefits: [
      'Bill clients automatically with recurring invoices',
      'White-label storefront under your own brand',
      'Track every client service in one place',
      'Eliminate manual provisioning steps',
    ],
    features: [
      { title: 'Branded Client Portal', description: 'Your clients log into a portal with your logo, your colors, and your domain.' },
      { title: 'Automated Invoicing', description: 'Generate and send invoices on schedule. Track payments without spreadsheets.' },
      { title: 'Service Dashboard', description: 'See every active service, renewal date, and resource usage at a glance.' },
    ],
  },
  {
    slug: 'agencies',
    icon: 'Building2',
    title: 'Web Design & Development Agencies',
    tagline: 'Operate hosting as a profit center, not overhead',
    description:
      'Your agency builds websites — let the platform handle the business of hosting them. Centralized billing, automated provisioning, and a support system that scales with your client base.',
    benefits: [
      'Manage hundreds of client accounts efficiently',
      'Automate service provisioning on new projects',
      'Built-in support ticketing for client requests',
      'Team roles and permissions for staff members',
    ],
    features: [
      { title: 'Team Collaboration', description: 'Assign staff to tickets, services, and customers with role-based access control.' },
      { title: 'Bulk Operations', description: 'Manage service suspensions, renewals, and notifications across many clients.' },
      { title: 'Client Service History', description: 'Every interaction, invoice, and provisioning event in one timeline per client.' },
    ],
  },
  {
    slug: 'entrepreneurs',
    icon: 'Rocket',
    title: 'New Hosting Entrepreneurs',
    tagline: 'Launch a hosting business without infrastructure',
    description:
      'Start selling hosting today without buying servers or building a billing system. Configure your products, set your prices, launch your storefront, and let the platform handle the operations.',
    benefits: [
      'Go live with a branded storefront in minutes',
      'No upfront infrastructure investment required',
      'Pre-configured product catalogs and pricing',
      'Guided onboarding wizard to set everything up',
    ],
    features: [
      { title: 'Onboarding Wizard', description: 'A step-by-step guide from business profile to storefront launch.' },
      { title: 'Product Templates', description: 'Start with pre-built hosting, domain, and add-on product definitions.' },
      { title: 'Storefront Editor', description: 'Customize your business name, colors, headlines, and displayed products.' },
    ],
  },
  {
    slug: 'existing-hosts',
    icon: 'Server',
    title: 'Existing Hosting Companies',
    tagline: 'Replace fragmented tooling with a unified platform',
    description:
      'If you are running WHMCS alongside separate DNS managers, billing spreadsheets, and support tools, the platform consolidates everything into one system — with a clear migration path.',
    benefits: [
      'Consolidate billing, support, and provisioning in one place',
      'Reduce operational complexity and tool sprawl',
      'Modern API for custom integrations and automation',
      'Advanced reporting and business intelligence',
    ],
    features: [
      { title: 'Migration-Ready Architecture', description: 'Import customers, services, and billing records with typed data structures.' },
      { title: 'Provisioning Connectors', description: 'Connect to cPanel, Plesk, or DirectAdmin for automated account management.' },
      { title: 'Advanced Analytics', description: 'Revenue trends, churn analysis, and service lifecycle reporting out of the box.' },
    ],
  },
  {
    slug: 'infrastructure',
    icon: 'Cloud',
    title: 'Infrastructure & Reseller Businesses',
    tagline: 'Scale operations with automation and visibility',
    description:
      'For resellers and infrastructure-focused operators who need deep automation, monitoring, and multi-tenant management. The roadmap includes owned infrastructure capabilities for vertical integration.',
    benefits: [
      'Automate service lifecycle at scale',
      'Infrastructure monitoring and alerting',
      'Multi-tenant isolation and resource tracking',
      'Roadmap to owned hosting infrastructure',
    ],
    features: [
      { title: 'Service Automation', description: 'Automated provisioning, suspension, restoration, and cancellation workflows.' },
      { title: 'Resource Monitoring', description: 'Track CPU, memory, storage, and bandwidth across all provisioned services.' },
      { title: 'Infrastructure Roadmap', description: 'A planned path from software platform to owned hosting nodes and DNS.' },
    ],
  },
];
