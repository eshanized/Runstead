export interface PricingPlan {
  name: string;
  description: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  highlighted?: boolean;
  suitableFor: string;
  features: { label: string; included: boolean }[];
  limits: { label: string; value: string }[];
}

export const pricingPlans: PricingPlan[] = [
  {
    name: 'Sandbox',
    description: 'Explore the platform with no commitment.',
    monthlyPrice: 0,
    annualPrice: 0,
    suitableFor: 'Evaluators and solo founders exploring the platform',
    features: [
      { label: 'Up to 10 active customers', included: true },
      { label: 'Full platform console access', included: true },
      { label: 'Storefront customization preview', included: true },
      { label: 'Community support', included: true },
      { label: 'Real provider connections', included: false },
      { label: 'Team collaboration', included: false },
    ],
    limits: [
      { label: 'Customers', value: '10' },
      { label: 'Products', value: '5' },
      { label: 'Team members', value: '1' },
    ],
  },
  {
    name: 'Launch',
    description: 'Everything to start billing and managing clients.',
    monthlyPrice: 49,
    annualPrice: 39,
    suitableFor: 'Freelancers and new hosting entrepreneurs',
    features: [
      { label: 'Up to 500 customers', included: true },
      { label: 'Billing, invoicing, and subscriptions', included: true },
      { label: 'White-label storefront', included: true },
      { label: 'Order and provisioning automation', included: true },
      { label: 'Email support', included: true },
      { label: '1 payment gateway connection', included: true },
      { label: 'Team collaboration', included: false },
      { label: 'Custom integrations', included: false },
    ],
    limits: [
      { label: 'Customers', value: '500' },
      { label: 'Products', value: 'Unlimited' },
      { label: 'Team members', value: '1' },
    ],
  },
  {
    name: 'Growth',
    description: 'Scale operations with automation and support tools.',
    monthlyPrice: 149,
    annualPrice: 119,
    highlighted: true,
    suitableFor: 'Agencies and growing hosting companies',
    features: [
      { label: 'Up to 5,000 customers', included: true },
      { label: 'Everything in Launch', included: true },
      { label: 'Support ticket system', included: true },
      { label: 'Domain management & DNS', included: true },
      { label: '5 team members', included: true },
      { label: '3 payment gateway connections', included: true },
      { label: 'Advanced reporting', included: true },
      { label: 'API access', included: true },
    ],
    limits: [
      { label: 'Customers', value: '5,000' },
      { label: 'Products', value: 'Unlimited' },
      { label: 'Team members', value: '5' },
    ],
  },
  {
    name: 'Scale',
    description: 'Advanced automation for established hosting providers.',
    monthlyPrice: 399,
    annualPrice: 319,
    suitableFor: 'Established hosting companies with automation needs',
    features: [
      { label: 'Up to 25,000 customers', included: true },
      { label: 'Everything in Growth', included: true },
      { label: 'Hosting service automation', included: true },
      { label: '15 team members', included: true },
      { label: 'Unlimited payment gateways', included: true },
      { label: 'Custom roles & permissions', included: true },
      { label: 'Priority support', included: true },
      { label: 'Webhook integrations', included: true },
    ],
    limits: [
      { label: 'Customers', value: '25,000' },
      { label: 'Products', value: 'Unlimited' },
      { label: 'Team members', value: '15' },
    ],
  },
  {
    name: 'Enterprise',
    description: 'Custom infrastructure and dedicated support.',
    monthlyPrice: null,
    annualPrice: null,
    suitableFor: 'Large hosting operations and infrastructure partners',
    features: [
      { label: 'Unlimited customers', included: true },
      { label: 'Everything in Scale', included: true },
      { label: 'Dedicated infrastructure', included: true },
      { label: 'Unlimited team members', included: true },
      { label: 'Custom SLA', included: true },
      { label: 'Dedicated support engineer', included: true },
      { label: 'On-premise deployment option', included: true },
      { label: 'Compliance consulting', included: true },
    ],
    limits: [
      { label: 'Customers', value: 'Unlimited' },
      { label: 'Products', value: 'Unlimited' },
      { label: 'Team members', value: 'Unlimited' },
    ],
  },
];

export const pricingFaq = [
  {
    q: 'How does billing work?',
    a: 'Subscriptions are billed on a monthly or annual cadence. Annual plans include a 20% discount. You can upgrade, downgrade, or cancel your subscription at any time from your account settings.',
  },
  {
    q: 'What payment methods are supported?',
    a: 'Runstead supports credit and debit cards (Visa, Mastercard, American Express), automated ACH/SEPA debit, bank wire transfers, and localized payment rails via integrated Stripe and PayPal processors.',
  },
  {
    q: 'Can I start with the Sandbox plan?',
    a: 'Yes. The Sandbox plan gives you full access to configure storefronts, test provisioning workflows, and explore the complete hosting console with up to 10 customers without requiring a credit card.',
  },
  {
    q: 'Do I need to own hosting infrastructure?',
    a: 'No. The platform operates as a complete business-management SaaS. You can seamlessly connect existing cPanel/WHM, Plesk, DirectAdmin, or VPS servers. Owned infrastructure is optional as your business scales.',
  },
  {
    q: 'How is data secured and isolated?',
    a: 'All customer data is persisted in dedicated PostgreSQL schemas protected by fail-closed Row-Level Security (RLS). External credentials and keys are encrypted at rest with AES-256-GCM authenticated encryption.',
  },
];
