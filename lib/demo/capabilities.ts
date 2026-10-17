import type {
  CapabilityId,
  CapabilityDefinition,
  ProductType,
  Product,
  Service,
} from './types.ts';

export const CAPABILITY_REGISTRY: Record<CapabilityId, CapabilityDefinition> = {
  file_manager: {
    id: 'file_manager',
    name: 'File Manager & Web Editor',
    description: 'Browse, edit, upload, download, and manage directory trees and web files directly in the browser.',
    category: 'storage',
    supportedTypes: ['shared_hosting', 'managed_service'],
    defaultEnabled: true,
    dependencies: [],
  },
  databases: {
    id: 'databases',
    name: 'Database Management',
    description: 'Create and drop MySQL/MariaDB databases, manage users, configure privileges, and inspect table schemas.',
    category: 'storage',
    supportedTypes: ['shared_hosting', 'managed_service', 'vps'],
    defaultEnabled: true,
    dependencies: [],
  },
  domain_management: {
    id: 'domain_management',
    name: 'Domain Routing & Aliases',
    description: 'Assign primary domains, subdomains, parked aliases, and document roots to hosting instances.',
    category: 'network',
    supportedTypes: ['shared_hosting', 'managed_service', 'vps', 'domain_registration', 'dns_management'],
    defaultEnabled: true,
    dependencies: [],
  },
  dns_zone: {
    id: 'dns_zone',
    name: 'DNS Zone Editor',
    description: 'Configure and validate A, AAAA, CNAME, MX, TXT, CAA, and SRV records with propagation monitoring.',
    category: 'network',
    supportedTypes: ['shared_hosting', 'managed_service', 'vps', 'domain_registration', 'dns_management'],
    defaultEnabled: true,
    dependencies: [],
  },
  email_accounts: {
    id: 'email_accounts',
    name: 'Email & Mailbox Accounts',
    description: 'Provision branded mailboxes, assign storage quotas, configure forwarders, and review delivery logs.',
    category: 'core',
    supportedTypes: ['shared_hosting', 'managed_service'],
    defaultEnabled: true,
    dependencies: [],
  },
  ssl_certificates: {
    id: 'ssl_certificates',
    name: 'SSL / TLS Security Certificates',
    description: 'Automated Let’s Encrypt issuance, 1-click renewal, HTTPS redirects, and TLS security posture verification.',
    category: 'security',
    supportedTypes: ['shared_hosting', 'managed_service', 'vps'],
    defaultEnabled: true,
    dependencies: [],
  },
  backups: {
    id: 'backups',
    name: 'Backups & Snapshot Restores',
    description: 'Automated retention snapshots, manual on-demand backups, and 1-click rollbacks for files and databases.',
    category: 'storage',
    supportedTypes: ['shared_hosting', 'managed_service', 'vps'],
    defaultEnabled: true,
    dependencies: [],
  },
  vps_power: {
    id: 'vps_power',
    name: 'Compute Lifecycle & Power Controls',
    description: 'Start, stop, reboot, force shutdown, and live CPU/RAM metrics for virtual private server instances.',
    category: 'compute',
    supportedTypes: ['vps'],
    defaultEnabled: true,
    dependencies: [],
  },
  vps_firewall: {
    id: 'vps_firewall',
    name: 'Cloud Network Firewall',
    description: 'Manage ingress port filters, protocol rules, and source IP allowlists on server instances.',
    category: 'security',
    supportedTypes: ['vps'],
    defaultEnabled: true,
    dependencies: ['vps_power'],
  },
  ssh_access: {
    id: 'ssh_access',
    name: 'SSH Key Management & Terminal',
    description: 'Register public SSH keys, configure root login settings, and launch simulated in-browser terminal sessions.',
    category: 'compute',
    supportedTypes: ['vps'],
    defaultEnabled: true,
    dependencies: ['vps_power'],
  },
  developer_tools: {
    id: 'developer_tools',
    name: 'Developer Tools & Git Deployments',
    description: 'Simulated Git repository webhooks, deployment rollback logs, masked environment variables, and cron tasks.',
    category: 'development',
    supportedTypes: ['shared_hosting', 'managed_service', 'vps'],
    defaultEnabled: false,
    dependencies: [],
  },
  activity_monitoring: {
    id: 'activity_monitoring',
    name: 'Activity Logs & Resource Telemetry',
    description: 'Audit trails, access logs, error logs, and historical usage tracking across services.',
    category: 'core',
    supportedTypes: ['shared_hosting', 'managed_service', 'vps', 'domain_registration', 'dns_management'],
    defaultEnabled: true,
    dependencies: [],
  },
  staging_environment: {
    id: 'staging_environment',
    name: 'Staging & Sandbox Clone',
    description: 'One-click staging environment creation with isolated files, preview URLs, and push-to-production workflows.',
    category: 'development',
    supportedTypes: ['managed_service'],
    defaultEnabled: false,
    dependencies: ['developer_tools'],
  },
};

export const ALL_CAPABILITY_IDS = Object.keys(CAPABILITY_REGISTRY) as CapabilityId[];

export function getAllCapabilities(): CapabilityDefinition[] {
  return Object.values(CAPABILITY_REGISTRY);
}

export function getCapabilitiesForProductType(type: ProductType): CapabilityDefinition[] {
  return Object.values(CAPABILITY_REGISTRY).filter((c) => c.supportedTypes.includes(type));
}

export function getDefaultCapabilitiesForProductType(type: ProductType): CapabilityId[] {
  return Object.values(CAPABILITY_REGISTRY)
    .filter((c) => c.supportedTypes.includes(type) && c.defaultEnabled)
    .map((c) => c.id);
}

export function validateCapabilityDependencies(enabledCaps: CapabilityId[]): {
  valid: boolean;
  missingDependencies: { capability: CapabilityId; requires: CapabilityId }[];
} {
  const missing: { capability: CapabilityId; requires: CapabilityId }[] = [];
  const set = new Set(enabledCaps);

  for (const capId of enabledCaps) {
    const def = CAPABILITY_REGISTRY[capId];
    if (def && def.dependencies) {
      for (const req of def.dependencies) {
        if (!set.has(req)) {
          missing.push({ capability: capId, requires: req });
        }
      }
    }
  }

  return {
    valid: missing.length === 0,
    missingDependencies: missing,
  };
}

export function isCapabilityAvailableForService(
  service: Service,
  capId: CapabilityId,
  parentProduct?: Product
): { available: boolean; reason?: string } {
  const def = CAPABILITY_REGISTRY[capId];
  if (!def) {
    return { available: false, reason: `Unknown capability ${capId}` };
  }

  // Suspended service blocks management capabilities except billing/overview/logs
  if (service.status === 'suspended' && capId !== 'activity_monitoring') {
    return {
      available: false,
      reason: 'This service is currently suspended due to an overdue invoice or policy action. Service controls are disabled until reactivated.',
    };
  }

  // Pending service blocks management
  if (service.status === 'pending' && capId !== 'activity_monitoring') {
    return {
      available: false,
      reason: 'This service is currently being provisioned. Management controls will be unlocked once active.',
    };
  }

  // Check service explicit capabilities or fallback to product capabilities
  let serviceCaps = service.capabilities;
  if (!serviceCaps && parentProduct?.capabilities) {
    serviceCaps = parentProduct.capabilities;
  }
  if (!serviceCaps) {
    // Default fallback based on product type
    const prodType = parentProduct?.type || 'shared_hosting';
    serviceCaps = getDefaultCapabilitiesForProductType(prodType);
  }

  if (!serviceCaps.includes(capId)) {
    return {
      available: false,
      reason: `The "${def.name}" feature is not enabled for this service package (${service.package || service.productName}). Resellers can enable it in product plan settings.`,
    };
  }

  // Check dependencies
  if (def.dependencies.length > 0) {
    for (const dep of def.dependencies) {
      if (!serviceCaps.includes(dep)) {
        const depDef = CAPABILITY_REGISTRY[dep];
        return {
          available: false,
          reason: `Requires "${depDef?.name || dep}" to be enabled first.`,
        };
      }
    }
  }

  return { available: true };
}
