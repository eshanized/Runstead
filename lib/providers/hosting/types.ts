export interface ProviderCapabilities {
  sharedHosting: boolean;
  vps: boolean;
  fileManager: boolean;
  databaseManager: boolean;
  sslManagement: boolean;
  dnsManagement: boolean;
  emailAccounts: boolean;
  backups: boolean;
  terminalAccess: boolean;
}

export interface CreateAccountParams {
  domain: string;
  username: string;
  password?: string;
  plan: string;
  contactEmail: string;
}

export interface ProvisioningResult {
  success: boolean;
  accountId?: string;
  username: string;
  domain: string;
  ipAddress: string;
  nameservers: string[];
  message?: string;
  rawResponse?: any;
}

export interface OperationResult {
  success: boolean;
  message: string;
  rawResponse?: any;
}

export interface AccountSummary {
  username: string;
  domain: string;
  status: string;
  diskUsedMb: number;
  diskLimitMb: number;
  bandwidthUsedMb: number;
  bandwidthLimitMb: number;
  ipAddress: string;
  plan: string;
}

export interface DatabaseInfo {
  name: string;
  user: string;
  sizeMb?: number;
}

export interface BackupInfo {
  id: string;
  filename: string;
  sizeMb: number;
  createdAt: string;
  status: 'available' | 'in_progress' | 'failed';
}

export interface HostingProviderAdapter {
  name: string;
  isConfigured: boolean;
  testConnection(): Promise<{ connected: boolean; version?: string; error?: string }>;
  getCapabilities(): ProviderCapabilities;
  createAccount(params: CreateAccountParams): Promise<ProvisioningResult>;
  suspendAccount(username: string, reason?: string): Promise<OperationResult>;
  unsuspendAccount(username: string): Promise<OperationResult>;
  terminateAccount(username: string): Promise<OperationResult>;
  getAccountSummary(username: string): Promise<AccountSummary>;
  createDatabase(username: string, dbName: string, dbUser?: string, password?: string): Promise<OperationResult>;
  listDatabases(username: string): Promise<DatabaseInfo[]>;
  listBackups(username: string): Promise<BackupInfo[]>;
  createBackup(username: string): Promise<OperationResult>;
  restoreBackup(username: string, backupId: string): Promise<OperationResult>;
}
