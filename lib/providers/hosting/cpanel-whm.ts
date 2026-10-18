import { validateSafeEndpoint } from '../../security/ssrf.ts';
import { redactSensitiveData } from '../../security/redact.ts';
import type {
  HostingProviderAdapter,
  ProviderCapabilities,
  CreateAccountParams,
  ProvisioningResult,
  OperationResult,
  AccountSummary,
  DatabaseInfo,
  BackupInfo,
} from './types.ts';

export interface CpanelWhmConfig {
  host: string;
  user: string;
  apiToken: string;
  useSsl?: boolean;
  port?: number;
}

export class CpanelWhmAdapter implements HostingProviderAdapter {
  name = 'cpanel_whm';
  private config: CpanelWhmConfig;
  private baseUrl: string;

  constructor(config: CpanelWhmConfig) {
    this.config = config;
    const protocol = config.useSsl ?? true ? 'https' : 'http';
    const port = config.port || 2087; // Standard WHM secure port
    const safeHost = validateSafeEndpoint(`${protocol}://${config.host}:${port}`);
    this.baseUrl = safeHost.origin;
  }

  get isConfigured(): boolean {
    return Boolean(this.config.host && this.config.user && this.config.apiToken);
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

  private async callWhmApi(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    const url = new URL(`/json-api/${endpoint}`, this.baseUrl);
    url.searchParams.set('api.version', '1');
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `whm ${this.config.user}:${this.config.apiToken}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(15_000), // 15-second strict timeout
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`WHM API HTTP ${response.status}: ${text}`);
      }

      const json = await response.json();
      return json;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`WHM connection error: ${msg}`);
    }
  }

  async testConnection(): Promise<{ connected: boolean; version?: string; error?: string }> {
    try {
      const data = await this.callWhmApi('version');
      if (data?.data?.version) {
        return { connected: true, version: data.data.version };
      }
      return { connected: false, error: 'Malformed WHM version response' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { connected: false, error: msg };
    }
  }

  async createAccount(params: CreateAccountParams): Promise<ProvisioningResult> {
    try {
      const data = await this.callWhmApi('createacct', {
        username: params.username,
        domain: params.domain,
        plan: params.plan,
        contactemail: params.contactEmail,
        ...(params.password ? { password: params.password } : {}),
      });

      const meta = data?.metadata;
      if (meta?.result === 1) {
        const output = data?.data || {};
        const nameservers: string[] = [];
        if (output.nameserver) nameservers.push(output.nameserver);
        if (output.nameserver2) nameservers.push(output.nameserver2);
        if (output.nameserver3) nameservers.push(output.nameserver3);
        if (output.nameserver4) nameservers.push(output.nameserver4);

        return {
          success: true,
          username: params.username,
          domain: params.domain,
          ipAddress: output.ip || '',
          nameservers,
          message: meta.reason || 'Account provisioned successfully on WHM node',
          rawResponse: redactSensitiveData(output),
        };
      }

      return {
        success: false,
        username: params.username,
        domain: params.domain,
        ipAddress: '',
        nameservers: [],
        message: meta?.reason || 'WHM returned account creation failure',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        username: params.username,
        domain: params.domain,
        ipAddress: '',
        nameservers: [],
        message: msg,
      };
    }
  }

  async suspendAccount(username: string, reason = 'Administrative suspension'): Promise<OperationResult> {
    try {
      const data = await this.callWhmApi('suspendacct', { user: username, reason });
      const meta = data?.metadata;
      return {
        success: meta?.result === 1,
        message: meta?.reason || 'Account suspended',
      };
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : String(err) };
    }
  }

  async unsuspendAccount(username: string): Promise<OperationResult> {
    try {
      const data = await this.callWhmApi('unsuspendacct', { user: username });
      const meta = data?.metadata;
      return {
        success: meta?.result === 1,
        message: meta?.reason || 'Account unsuspended',
      };
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : String(err) };
    }
  }

  async terminateAccount(username: string): Promise<OperationResult> {
    try {
      const data = await this.callWhmApi('removeacct', { user: username });
      const meta = data?.metadata;
      return {
        success: meta?.result === 1,
        message: meta?.reason || 'Account removed',
      };
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : String(err) };
    }
  }

  async getAccountSummary(username: string): Promise<AccountSummary> {
    const data = await this.callWhmApi('accountsummary', { user: username });
    const acct = data?.data?.acct?.[0];
    if (!acct) {
      throw new Error(`Account summary for "${username}" not found on WHM node.`);
    }

    const diskUsed = parseInt(acct.diskused || '0', 10);
    const diskLimit = parseInt(acct.disklimit || '0', 10);
    const bwUsed = parseInt(acct.bandwidthused || '0', 10);
    const bwLimit = parseInt(acct.bandwidthlimit || '0', 10);

    return {
      username,
      domain: acct.domain || '',
      status: acct.suspended ? 'suspended' : 'active',
      diskUsedMb: Math.round(diskUsed),
      diskLimitMb: Math.round(diskLimit),
      bandwidthUsedMb: Math.round(bwUsed),
      bandwidthLimitMb: Math.round(bwLimit),
      ipAddress: acct.ip || '',
      plan: acct.plan || 'standard',
    };
  }

  async createDatabase(username: string, dbName: string): Promise<OperationResult> {
    try {
      const data = await this.callWhmApi('uapi', {
        user: username,
        cpanel_service: 'Mysql',
        cpanel_function: 'create_database',
        name: dbName,
      });
      const res = data?.result;
      return {
        success: res?.status === 1,
        message: res?.errors?.[0] || 'Database created',
      };
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : String(err) };
    }
  }

  async listDatabases(username: string): Promise<DatabaseInfo[]> {
    const data = await this.callWhmApi('uapi', {
      user: username,
      cpanel_service: 'Mysql',
      cpanel_function: 'list_databases',
    });
    if (data?.result?.status !== 1) {
      const err = data?.result?.errors?.[0] || 'Failed to list databases from cPanel';
      throw new Error(`cPanel MySQL error: ${err}`);
    }
    const dbs = data?.result?.data || [];
    return dbs.map((d: any) => ({
      name: d.database || d.name,
      user: d.user || username,
      sizeMb: Math.round((d.size || 0) / (1024 * 1024)),
    }));
  }

  async listBackups(username: string): Promise<BackupInfo[]> {
    const data = await this.callWhmApi('uapi', {
      user: username,
      cpanel_service: 'Backup',
      cpanel_function: 'list_backups',
    });
    if (data?.result?.status !== 1) {
      const err = data?.result?.errors?.[0] || 'Failed to list backups from cPanel';
      throw new Error(`cPanel Backup error: ${err}`);
    }
    const backups = data?.result?.data || [];
    return backups.map((b: any, idx: number) => ({
      id: b.id || `bak-${idx}`,
      filename: b.file || `backup-${b.time}.tar.gz`,
      sizeMb: Math.round((b.size || 0) / (1024 * 1024)),
      createdAt: b.time || new Date().toISOString(),
      status: 'available',
    }));
  }

  async createBackup(username: string): Promise<OperationResult> {
    try {
      const data = await this.callWhmApi('uapi', {
        user: username,
        cpanel_service: 'Backup',
        cpanel_function: 'fullbackup_to_homedir',
      });
      const res = data?.result;
      return {
        success: res?.status === 1,
        message: res?.errors?.[0] || 'Backup initiated on node',
      };
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : String(err) };
    }
  }

  async restoreBackup(username: string, backupId: string): Promise<OperationResult> {
    try {
      const data = await this.callWhmApi('restoreaccount', {
        user: username,
        type: 'daily',
        all: '1',
      });
      const meta = data?.metadata;
      if (meta?.result === 1) {
        return {
          success: true,
          message: meta.reason || `Backup restoration scheduled for account ${username}`,
        };
      }
      return {
        success: false,
        message: meta?.reason || `Backup restoration unsupported or rejected by WHM for ${backupId}`,
      };
    } catch (err: unknown) {
      return {
        success: false,
        message: `Backup restore operation failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  async restartService(serviceName: string = 'httpd'): Promise<OperationResult> {
    try {
      const data = await this.callWhmApi('restartservice', { service: serviceName });
      const meta = data?.metadata;
      return {
        success: meta?.result === 1,
        message: meta?.reason || `Service ${serviceName} restart initiated on node`,
      };
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : String(err) };
    }
  }
}
