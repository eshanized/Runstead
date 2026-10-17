import type {
  HostingProviderAdapter,
  ProviderCapabilities,
  CreateAccountParams,
  ProvisioningResult,
  OperationResult,
  AccountSummary,
  DatabaseInfo,
  BackupInfo,
} from './types';

export class SandboxHostingAdapter implements HostingProviderAdapter {
  name = 'sandbox_cpanel';
  isConfigured = false;

  private accounts = new Map<string, { domain: string; status: string; plan: string }>();
  private databases = new Map<string, string[]>();
  private backups = new Map<string, BackupInfo[]>();

  async testConnection(): Promise<{ connected: boolean; version?: string; error?: string }> {
    return {
      connected: true,
      version: 'Sandbox-cPanel-WHM-v11.118-emulated',
    };
  }

  getCapabilities(): ProviderCapabilities {
    return {
      sharedHosting: true,
      vps: false,
      fileManager: true,
      databaseManager: true,
      sslManagement: true,
      dnsManagement: true,
      emailAccounts: true,
      backups: true,
      terminalAccess: false,
    };
  }

  async createAccount(params: CreateAccountParams): Promise<ProvisioningResult> {
    if (this.accounts.has(params.username)) {
      return {
        success: false,
        username: params.username,
        domain: params.domain,
        ipAddress: '',
        nameservers: [],
        message: `Account with username "${params.username}" already exists in sandbox.`,
      };
    }

    this.accounts.set(params.username, {
      domain: params.domain,
      status: 'active',
      plan: params.plan,
    });

    return {
      success: true,
      accountId: `sandbox-acct-${params.username}`,
      username: params.username,
      domain: params.domain,
      ipAddress: '198.51.100.42',
      nameservers: ['ns1.sandbox.runstead.org', 'ns2.sandbox.runstead.org'],
      message: 'Sandbox account provisioned successfully',
    };
  }

  async suspendAccount(username: string, reason = 'Administrative suspension'): Promise<OperationResult> {
    const acct = this.accounts.get(username);
    if (!acct) {
      return { success: false, message: `Account "${username}" not found.` };
    }
    acct.status = 'suspended';
    return { success: true, message: `Account ${username} suspended: ${reason}` };
  }

  async unsuspendAccount(username: string): Promise<OperationResult> {
    const acct = this.accounts.get(username);
    if (!acct) {
      return { success: false, message: `Account "${username}" not found.` };
    }
    acct.status = 'active';
    return { success: true, message: `Account ${username} unsuspended successfully.` };
  }

  async terminateAccount(username: string): Promise<OperationResult> {
    if (!this.accounts.has(username)) {
      return { success: false, message: `Account "${username}" not found.` };
    }
    this.accounts.delete(username);
    this.databases.delete(username);
    this.backups.delete(username);
    return { success: true, message: `Account ${username} terminated.` };
  }

  async getAccountSummary(username: string): Promise<AccountSummary> {
    const acct = this.accounts.get(username) || { domain: 'example.com', status: 'active', plan: 'standard' };
    return {
      username,
      domain: acct.domain,
      status: acct.status,
      diskUsedMb: 420,
      diskLimitMb: 10240,
      bandwidthUsedMb: 1250,
      bandwidthLimitMb: 102400,
      ipAddress: '198.51.100.42',
      plan: acct.plan,
    };
  }

  async createDatabase(username: string, dbName: string): Promise<OperationResult> {
    const list = this.databases.get(username) || [];
    list.push(dbName);
    this.databases.set(username, list);
    return { success: true, message: `Database ${dbName} created.` };
  }

  async listDatabases(username: string): Promise<DatabaseInfo[]> {
    const list = this.databases.get(username) || ['main_db', 'wordpress_db'];
    return list.map((name) => ({
      name,
      user: `${username}_user`,
      sizeMb: 15,
    }));
  }

  async listBackups(username: string): Promise<BackupInfo[]> {
    const list = this.backups.get(username) || [
      {
        id: 'bak-sandbox-1',
        filename: `backup-${username}-auto.tar.gz`,
        sizeMb: 340,
        createdAt: new Date().toISOString(),
        status: 'available',
      },
    ];
    return list;
  }

  async createBackup(username: string): Promise<OperationResult> {
    const list = this.backups.get(username) || [];
    const newBak: BackupInfo = {
      id: `bak-sandbox-${Date.now()}`,
      filename: `backup-${username}-${Date.now()}.tar.gz`,
      sizeMb: 350,
      createdAt: new Date().toISOString(),
      status: 'available',
    };
    list.push(newBak);
    this.backups.set(username, list);
    return { success: true, message: 'Sandbox backup created successfully.' };
  }

  async restoreBackup(username: string, backupId: string): Promise<OperationResult> {
    return { success: true, message: `Sandbox backup ${backupId} restored.` };
  }
}
