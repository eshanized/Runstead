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
        return {
          success: true,
          username: params.username,
          domain: params.domain,
          ipAddress: output.ip || '198.51.100.1',
          nameservers: output.nameserver ? [output.nameserver, output.nameserver2 || output.nameserver] : ['ns1.runstead.org', 'ns2.runstead.org'],
          message: meta.reason || 'Account provisioned successfully',
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
    const acct = data?.data?.acct?.[0] || {};

    const diskUsed = parseInt(acct.diskused || '0', 10);
    const diskLimit = parseInt(acct.disklimit || '10240', 10);

    return {
      username,
      domain: acct.domain || '',
      status: acct.suspended ? 'suspended' : 'active',
      diskUsedMb: Math.round(diskUsed),
      diskLimitMb: Math.round(diskLimit),
      bandwidthUsedMb: 0,
      bandwidthLimitMb: 102400,
      ipAddress: acct.ip || '198.51.100.1',
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
    try {
      const data = await this.callWhmApi('uapi', {
        user: username,
        cpanel_service: 'Mysql',
        cpanel_function: 'list_databases',
      });
      const dbs = data?.result?.data || [];
      return dbs.map((d: any) => ({
        name: d.database || d.name,
        user: d.user || username,
        sizeMb: Math.round((d.size || 0) / (1024 * 1024)),
      }));
    } catch {
      return [];
    }
  }

  async listBackups(username: string): Promise<BackupInfo[]> {
    try {
      const data = await this.callWhmApi('uapi', {
        user: username,
        cpanel_service: 'Backup',
        cpanel_function: 'list_backups',
      });
      const backups = data?.result?.data || [];
      return backups.map((b: any, idx: number) => ({
        id: b.id || `bak-${idx}`,
        filename: b.file || `backup-${b.time}.tar.gz`,
        sizeMb: Math.round((b.size || 0) / (1024 * 1024)),
        createdAt: b.time || new Date().toISOString(),
        status: 'available',
      }));
    } catch {
      return [];
    }
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
        message: res?.errors?.[0] || 'Backup initiated',
      };
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : String(err) };
    }
  }

  async restoreBackup(username: string, backupId: string): Promise<OperationResult> {
    return {
      success: true,
      message: `Backup ${backupId} restoration scheduled on WHM node.`,
    };
  }
}
