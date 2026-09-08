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
      { label: 'Up to 10 demo customers', included: true },
      { label: 'Full interactive demo access', included: true },
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
    q: 'Are these prices finalized?',
    a: 'No. All prices shown here are indicative assumptions for demonstration purposes. Final pricing will be determined before the production launch and may differ from what is shown.',
  },
  {
    q: 'What payment methods will be supported?',
    a: 'The platform is designed to integrate with popular payment gateways. The demo shows simulated payment flows — no real charges are ever processed.',
  },
  {
    q: 'Can I try the platform before paying?',
    a: 'Yes. The interactive demo is fully available without an account, payment method, or API key. The Sandbox tier is designed for free exploration.',
  },
  {
    q: 'Do I need to own hosting infrastructure?',
    a: 'No. The platform starts as a business-management SaaS. You can connect existing hosting providers. Owned infrastructure is a long-term roadmap goal, not a requirement.',
  },
  {
    q: 'What happens to my data in the demo?',
    a: 'The demo stores data locally in your browser. No data is sent to a server. You can reset all demo data at any time from the demo interface.',
  },
];
