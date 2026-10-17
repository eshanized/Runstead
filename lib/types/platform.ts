export type CustomerStatus = 'active' | 'inactive' | 'suspended';
export type OrderStatus = 'awaiting_payment' | 'paid' | 'provisioning' | 'active' | 'failed' | 'canceled';
export type ServiceStatus = 'pending' | 'active' | 'suspended' | 'canceled';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void' | 'refunded';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ProductType = 'shared_hosting' | 'vps' | 'domain_registration' | 'dns_management' | 'managed_service' | 'add_on';
export type BillingCycle = 'monthly' | 'quarterly' | 'semi_annually' | 'annually' | 'one_time';
export type IntegrationStatus = 'connected' | 'disconnected' | 'degraded' | 'unavailable';
export type DnsRecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'CAA' | 'SRV';

export interface Customer {
  id: string;
  name: string;
  email: string;
  company: string | null;
  status: CustomerStatus;
  country: string;
  createdAt: string;
  phone: string | null;
  creditBalance: number;
  servicesCount: number;
  invoicesCount: number;
  totalRevenue: number;
  lastActivity: string;
  activity: { id: string; type: string; description: string; timestamp: string }[];
  archived?: boolean;
}

export type CapabilityId =
  | 'file_manager'
  | 'databases'
  | 'domain_management'
  | 'dns_zone'
  | 'email_accounts'
  | 'ssl_certificates'
  | 'backups'
  | 'vps_power'
  | 'vps_firewall'
  | 'ssh_access'
  | 'developer_tools'
  | 'activity_monitoring'
  | 'staging_environment';

export interface CapabilityDefinition {
  id: CapabilityId;
  name: string;
  description: string;
  category: 'core' | 'storage' | 'network' | 'security' | 'compute' | 'development';
  supportedTypes: ProductType[];
  defaultEnabled: boolean;
  dependencies: CapabilityId[];
}

export interface PlanLimits {
  diskSpaceGB?: number;
  storageGB?: number;
  bandwidthGB?: number;
  databases?: number;
  emailAccounts?: number;
  domains?: number;
  subdomains?: number;
  backups?: number;
  cronJobs?: number;
  stagingEnvironments?: number;
  sshAccess?: boolean;
}

export interface ServiceFile {
  path: string;
  name: string;
  isDir: boolean;
  isDirectory?: boolean;
  size: number;
  modifiedAt: string;
  permissions: string;
  content?: string;
}

export interface ServiceFileSystem {
  files: ServiceFile[];
}

export interface ServiceDbTable {
  name: string;
  rowCount: number;
  sizeKB: number;
  columns: string[];
  sampleRows: Record<string, any>[];
}

export interface ServiceDatabase {
  id: string;
  name: string;
  sizeMB: number;
  collation: string;
  charset: string;
  users: string[];
  tables: ServiceDbTable[];
  createdAt: string;
}

export interface ServiceDatabaseUser {
  id: string;
  username: string;
  host: string;
  privileges: string[];
}

export interface ServiceEmailAccount {
  id: string;
  address: string;
  quotaMB: number;
  usedMB: number;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface ServiceEmailForwarder {
  id: string;
  source: string;
  destination: string;
  createdAt: string;
}

export interface ServiceEmailLog {
  id: string;
  timestamp: string;
  sender: string;
  recipient: string;
  subject: string;
  status: 'delivered' | 'bounced' | 'queued';
}

export interface ServiceSslCertificate {
  status: 'active' | 'renewing' | 'expired' | 'missing';
  issuer: string;
  coveredDomains: string[];
  issueDate: string;
  expiryDate: string;
  autoRenew: boolean;
  forceHttps: boolean;
  hsts: boolean;
  minTlsVersion: '1.2' | '1.3';
  lastOperationLog?: string;
}

export interface ServiceBackup {
  id: string;
  filename: string;
  sizeMB: number;
  type: 'automated' | 'manual';
  scope: 'full' | 'database' | 'files';
  status: 'completed' | 'restoring' | 'failed';
  createdAt: string;
  retentionDays: number;
}

export interface ServiceVpsSshKey {
  id: string;
  name: string;
  publicKey: string;
  createdAt: string;
}

export interface ServiceVpsFirewallRule {
  id: string;
  portRange: string;
  protocol: 'TCP' | 'UDP' | 'TCP/UDP';
  source: string;
  action: 'ALLOW' | 'DENY';
  description: string;
}

export interface ServiceVpsSnapshot {
  id: string;
  name: string;
  sizeGB: number;
  createdAt: string;
}

export interface ServiceVpsData {
  powerState: 'running' | 'stopped' | 'restarting' | 'error';
  osName: string;
  osVersion: string;
  kernel: string;
  uptimeSeconds: number;
  ipAddress: string;
  reverseDns: string;
  sshKeys: ServiceVpsSshKey[];
  firewallRules: ServiceVpsFirewallRule[];
  snapshots: ServiceVpsSnapshot[];
  rescueMode: boolean;
  os?: string;
  cpuCores?: number;
  memoryGB?: number;
  storageGB?: number;
}

export interface ServiceGitRepo {
  url: string;
  branch: string;
  autoDeploy: boolean;
  lastCommit: string;
}

export interface ServiceDeployment {
  id: string;
  commitHash: string;
  message: string;
  branch: string;
  status: 'success' | 'failed' | 'deploying';
  timestamp: string;
  durationSec: number;
}

export interface ServiceEnvVar {
  id: string;
  key: string;
  value: string;
  masked: boolean;
}

export interface ServiceCronJob {
  id: string;
  schedule: string;
  command: string;
  description: string;
  enabled: boolean;
  lastRun?: string;
}

export interface ServiceDeveloperData {
  gitRepo?: ServiceGitRepo;
  deployments: ServiceDeployment[];
  envVars: ServiceEnvVar[];
  runtimeVersion: string;
  extensions: string[];
  cronJobs: ServiceCronJob[];
  stagingEnvironment?: {
    active: boolean;
    url: string;
    lastSynced: string;
  };
}

export interface ServiceLog {
  id: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error';
  category: 'system' | 'web' | 'auth' | 'database' | 'mail';
  message: string;
  details?: string;
}

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  description: string;
  pricing: { cycle: BillingCycle; price: number }[];
  priceMonthly?: number;
  setupFee: number;
  resourceLimits: { label: string; value: string }[];
  available: boolean;
  addons: { name: string; price: number }[];
  capabilities?: CapabilityId[];
  planLimits?: PlanLimits;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  status: OrderStatus;
  amount: number;
  billingCycle: BillingCycle;
  createdAt: string;
  updatedAt: string;
  events: { id: string; status: OrderStatus; description: string; timestamp: string }[];
  invoiceId?: string;
  serviceId?: string;
  domainId?: string;
}

export interface Service {
  id: string;
  serviceName: string;
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  status: ServiceStatus;
  package: string;
  domain: string | null;
  createdAt: string;
  nextRenewalDate: string;
  billingCycle: BillingCycle;
  price: number;
  resourceUsage: { label: string; used: number; total: number; unit: string; type?: string }[];
  timeline: { id: string; event: string; description: string; timestamp: string }[];
  orderId?: string;
  invoiceId?: string;
  ipAddress?: string;
  serverHostname?: string;
  username?: string;
  provisioningError?: string | null;
  // Service Control Center properties
  capabilities?: CapabilityId[];
  planLimits?: PlanLimits;
  fileSystem?: ServiceFileSystem;
  databases?: ServiceDatabase[];
  databaseUsers?: ServiceDatabaseUser[];
  emailAccounts?: ServiceEmailAccount[];
  emailForwarders?: ServiceEmailForwarder[];
  emailLogs?: ServiceEmailLog[];
  sslCertificate?: ServiceSslCertificate;
  backups?: ServiceBackup[];
  vpsData?: ServiceVpsData;
  devData?: ServiceDeveloperData;
  logs?: ServiceLog[];
  phpVersion?: string;
  nodeVersion?: string;
}

export interface Domain {
  id: string;
  domain: string;
  customerId: string;
  customerName: string;
  registrar: string;
  status: 'active' | 'expired' | 'pending_transfer' | 'pending_registration';
  registeredDate: string;
  expiryDate: string;
  autoRenew: boolean;
  nameservers: string[];
  dnsZoneId: string | null;
  domainType?: 'registered' | 'external';
  price?: number;
  invoiceId?: string;
}

export interface DnsRecord {
  id: string;
  zoneId: string;
  type: DnsRecordType;
  host: string;
  value: string;
  ttl: number;
  priority: number | null;
}

export interface DnsZone {
  id: string;
  domain: string;
  records: DnsRecord[];
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidDate: string | null;
  currency: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  payments: { id: string; method: string; amount: number; date: string }[];
  orderId?: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  customerId: string;
  customerName: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  category: string;
  messages: { id: string; author: string; authorType: 'customer' | 'staff'; message: string; timestamp: string; internal?: boolean }[];
}

export interface StorefrontSettings {
  businessName: string;
  tagline: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  email: string;
  phone: string;
  logoText: string;
  headline: string;
  displayedProductIds: string[];
  showProductPricing: boolean;
}

export interface Integration {
  id: string;
  name: string;
  category: string;
  status: IntegrationStatus;
  description: string;
  capabilities: string[];
  lastTested: string | null;
  config: { key: string; label: string; value: string; masked: boolean }[];
}

export interface BusinessSettings {
  businessName: string;
  legalName: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
  timezone: string;
  taxRate: number;
  taxId: string;
  category?: string;
  notificationPrefs: {
    newOrders: boolean;
    paymentReceived: boolean;
    ticketCreated: boolean;
    serviceSuspended: boolean;
    renewalReminders: boolean;
  };
  teamMembers: { id: string; name: string; email: string; role: string; status: 'active' | 'invited' }[];
  currentPlan: string;
}

export type TenantStatus = 'active' | 'suspended' | 'trial';

export interface PlatformTenant {
  id: string;
  businessName: string;
  slug: string;
  category: string;
  plan: string;
  status: TenantStatus;
  billingInterval: 'monthly' | 'annually';
  mrr: number;
  customerCount: number;
  customerLimit: number | 'Unlimited';
  serviceCount: number;
  onboardingCompleted: boolean;
  createdAt: string;
  lastActiveAt: string;
  contactEmail: string;
  customDomain?: string;
}

export interface PlatformOperatorEvent {
  id: string;
  tenantId: string;
  tenantName: string;
  type: string;
  description: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface PlatformIntegrationStatus {
  id: string;
  name: string;
  type: string;
  status: 'operational' | 'degraded' | 'maintenance';
  connectedTenantsCount: number;
  latencyMs: number;
}

export interface PlatformOperatorState {
  tenants: PlatformTenant[];
  events: PlatformOperatorEvent[];
  integrations: PlatformIntegrationStatus[];
}

import type { StorefrontConfig, CartItem } from './storefront.ts';
export * from './storefront.ts';

export interface PlatformState {
  customers: Customer[];
  products: Product[];
  orders: Order[];
  services: Service[];
  domains: Domain[];
  dnsZones: DnsZone[];
  invoices: Invoice[];
  tickets: Ticket[];
  storefront: StorefrontConfig;
  publishedStorefront?: StorefrontConfig;
  cart?: CartItem[];
  activeClientCustomerId?: string | null;
  integrations: Integration[];
  business: BusinessSettings;
  notifications: { id: string; title: string; description: string; read: boolean; timestamp: string; type: string }[];
  platformOperator: PlatformOperatorState;
}

export type ResellerState = PlatformState;
export type DemoState = PlatformState;

