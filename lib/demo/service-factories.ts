import type {
  ServiceFileSystem,
  ServiceDatabase,
  ServiceDatabaseUser,
  ServiceEmailAccount,
  ServiceEmailForwarder,
  ServiceSslCertificate,
  ServiceBackup,
  ServiceVpsData,
  ServiceDeveloperData,
  ServiceLog,
  CapabilityId,
  ProductType,
} from './types.ts';
import { getDefaultCapabilitiesForProductType } from './capabilities.ts';

export function createDefaultFileSystem(domain: string): ServiceFileSystem {
  const cleanDomain = domain.toLowerCase();
  const dateStr = new Date().toISOString();

  return {
    files: [
      {
        path: '/',
        name: '/',
        isDir: true,
        size: 4096,
        modifiedAt: dateStr,
        permissions: '0755',
      },
      {
        path: '/public_html',
        name: 'public_html',
        isDir: true,
        size: 4096,
        modifiedAt: dateStr,
        permissions: '0755',
      },
      {
        path: '/public_html/index.html',
        name: 'index.html',
        isDir: false,
        size: 1420,
        modifiedAt: dateStr,
        permissions: '0644',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${cleanDomain}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="container">
    <div class="card">
      <span class="badge">Runstead Cloud</span>
      <h1>${cleanDomain}</h1>
      <p class="subtitle">High-performance hosting powered by Tonmoy Infrastructure & Vision.</p>
      <div class="status-box">
        <span class="dot"></span> Service Status: <strong>Operational</strong>
      </div>
    </div>
  </main>
  <script src="app.js"></script>
</body>
</html>`,
      },
      {
        path: '/public_html/style.css',
        name: 'style.css',
        isDir: false,
        size: 840,
        modifiedAt: dateStr,
        permissions: '0644',
        content: `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background: #090d16;
  color: #f1f5f9;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.container { width: 100%; max-width: 600px; padding: 24px; }
.card {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
}
.badge {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(15, 95, 255, 0.15);
  color: #60a5fa;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 16px;
}
h1 { font-size: 28px; font-weight: 800; margin-bottom: 12px; }
.subtitle { color: #94a3b8; font-size: 14px; margin-bottom: 28px; line-height: 1.5; }
.status-box {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #1f2937;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
}
.dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; }`,
      },
      {
        path: '/public_html/app.js',
        name: 'app.js',
        isDir: false,
        size: 420,
        modifiedAt: dateStr,
        permissions: '0644',
        content: `console.log("Welcome to ${cleanDomain} - Hosting Control Panel Active");
window.addEventListener("DOMContentLoaded", () => {
  console.log("Telemetry check: OK");
});`,
      },
      {
        path: '/public_html/.htaccess',
        name: '.htaccess',
        isDir: false,
        size: 260,
        modifiedAt: dateStr,
        permissions: '0644',
        content: `# Runstead Apache Configuration
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Prevent directory listings
Options -Indexes`,
      },
      {
        path: '/config',
        name: 'config',
        isDir: true,
        size: 4096,
        modifiedAt: dateStr,
        permissions: '0700',
      },
      {
        path: '/config/app.json',
        name: 'app.json',
        isDir: false,
        size: 180,
        modifiedAt: dateStr,
        permissions: '0600',
        content: `{\n  "environment": "production",\n  "domain": "${cleanDomain}",\n  "debug": false,\n  "timezone": "UTC"\n}`,
      },
      {
        path: '/ssl',
        name: 'ssl',
        isDir: true,
        size: 4096,
        modifiedAt: dateStr,
        permissions: '0700',
      },
      {
        path: '/ssl/certificate.crt',
        name: 'certificate.crt',
        isDir: false,
        size: 1980,
        modifiedAt: dateStr,
        permissions: '0600',
        content: `-----BEGIN CERTIFICATE-----\nMIIDXTCCAkWgAwIBAgIJAO/simulated_runstead_cert_${cleanDomain}\n-----END CERTIFICATE-----`,
      },
      {
        path: '/logs',
        name: 'logs',
        isDir: true,
        size: 4096,
        modifiedAt: dateStr,
        permissions: '0750',
      },
      {
        path: '/logs/access.log',
        name: 'access.log',
        isDir: false,
        size: 3240,
        modifiedAt: dateStr,
        permissions: '0640',
        content: `198.51.100.14 - - [${dateStr}] "GET / HTTP/2.0" 200 1420 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"\n198.51.100.14 - - [${dateStr}] "GET /style.css HTTP/2.0" 200 840 "https://${cleanDomain}/" "Mozilla/5.0"`,
      },
      {
        path: '/logs/error.log',
        name: 'error.log',
        isDir: false,
        size: 0,
        modifiedAt: dateStr,
        permissions: '0640',
        content: '',
      },
    ],
  };
}

export function createDefaultDatabases(
  domain: string,
  username: string = 'app_user'
): { databases: ServiceDatabase[]; databaseUsers: ServiceDatabaseUser[] } {
  const prefix = domain.split('.')[0].replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 8);
  const dbName = `${prefix}_db`;
  const dbUser = `${prefix}_usr`;

  return {
    databases: [
      {
        id: `db_${Math.random().toString(36).substring(2, 8)}`,
        name: dbName,
        sizeMB: 36.4,
        collation: 'utf8mb4_unicode_ci',
        charset: 'utf8mb4',
        users: [dbUser],
        createdAt: '2025-06-01T12:00:00Z',
        tables: [
          {
            name: 'app_options',
            rowCount: 85,
            sizeKB: 140,
            columns: ['option_id', 'option_name', 'option_value', 'autoload'],
            sampleRows: [
              { option_id: 1, option_name: 'siteurl', option_value: `https://${domain}`, autoload: 'yes' },
              { option_id: 2, option_name: 'admin_email', option_value: `admin@${domain}`, autoload: 'yes' },
              { option_id: 3, option_name: 'site_title', option_value: `${domain} Portal`, autoload: 'yes' },
            ],
          },
          {
            name: 'app_users',
            rowCount: 4,
            sizeKB: 64,
            columns: ['id', 'username', 'email', 'role', 'status'],
            sampleRows: [
              { id: 1, username: 'admin', email: `admin@${domain}`, role: 'administrator', status: 'active' },
              { id: 2, username: 'editor', email: `editor@${domain}`, role: 'content_manager', status: 'active' },
            ],
          },
          {
            name: 'app_content',
            rowCount: 19,
            sizeKB: 420,
            columns: ['id', 'title', 'slug', 'status', 'published_at'],
            sampleRows: [
              { id: 101, title: 'Welcome to Our New Website', slug: 'welcome', status: 'published', published_at: '2026-09-01' },
              { id: 102, title: 'Services & Infrastructure', slug: 'services', status: 'published', published_at: '2026-09-15' },
            ],
          },
        ],
      },
    ],
    databaseUsers: [
      {
        id: `dbu_${Math.random().toString(36).substring(2, 8)}`,
        username: dbUser,
        host: 'localhost',
        privileges: ['ALL PRIVILEGES'],
      },
    ],
  };
}

export function createDefaultEmail(
  domain: string,
  customerEmail: string
): { emailAccounts: ServiceEmailAccount[]; emailForwarders: ServiceEmailForwarder[] } {
  return {
    emailAccounts: [
      {
        id: `em_${Math.random().toString(36).substring(2, 8)}`,
        address: `admin@${domain}`,
        quotaMB: 2048,
        usedMB: 340,
        status: 'active',
        createdAt: '2025-05-10T10:00:00Z',
      },
      {
        id: `em_${Math.random().toString(36).substring(2, 8)}`,
        address: `info@${domain}`,
        quotaMB: 1024,
        usedMB: 95,
        status: 'active',
        createdAt: '2025-06-15T14:30:00Z',
      },
    ],
    emailForwarders: [
      {
        id: `ef_${Math.random().toString(36).substring(2, 8)}`,
        source: `contact@${domain}`,
        destination: customerEmail,
        createdAt: '2025-05-10T10:30:00Z',
      },
    ],
  };
}

export function createDefaultSsl(domain: string): ServiceSslCertificate {
  return {
    status: 'active',
    issuer: "Let's Encrypt Authority X3",
    coveredDomains: [domain, `www.${domain}`],
    issueDate: '2026-08-10T00:00:00Z',
    expiryDate: '2026-11-10T00:00:00Z',
    autoRenew: true,
    forceHttps: true,
    hsts: true,
    minTlsVersion: '1.3',
  };
}

export function createDefaultBackups(domain: string): ServiceBackup[] {
  return [
    {
      id: `bk_${Math.random().toString(36).substring(2, 8)}`,
      filename: `backup-${domain}-2026-10-14.tar.gz`,
      sizeMB: 340,
      type: 'automated',
      scope: 'full',
      status: 'completed',
      createdAt: '2026-10-14T03:00:00Z',
      retentionDays: 14,
    },
    {
      id: `bk_${Math.random().toString(36).substring(2, 8)}`,
      filename: `backup-${domain}-2026-10-07.tar.gz`,
      sizeMB: 335,
      type: 'automated',
      scope: 'full',
      status: 'completed',
      createdAt: '2026-10-07T03:00:00Z',
      retentionDays: 14,
    },
  ];
}

export function createDefaultVpsData(hostname: string, ipAddress: string): ServiceVpsData {
  return {
    powerState: 'running',
    osName: 'Ubuntu',
    osVersion: '24.04 LTS (Noble Numbat)',
    kernel: 'Linux 6.8.0-40-generic x86_64',
    uptimeSeconds: 1542890,
    ipAddress,
    reverseDns: hostname,
    sshKeys: [
      {
        id: 'k1',
        name: 'Primary Workstation Key (ed25519)',
        publicKey: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOm6L45eXj9YQ8Z1vA9w2e3r4t5y6u7i8o9p0a1s2d3 admin@runstead',
        createdAt: '2025-01-08T12:05:00Z',
      },
    ],
    firewallRules: [
      { id: 'fr1', portRange: '22', protocol: 'TCP', source: '0.0.0.0/0', action: 'ALLOW', description: 'SSH Secure Shell' },
      { id: 'fr2', portRange: '80', protocol: 'TCP', source: '0.0.0.0/0', action: 'ALLOW', description: 'HTTP Web Traffic' },
      { id: 'fr3', portRange: '443', protocol: 'TCP', source: '0.0.0.0/0', action: 'ALLOW', description: 'HTTPS Encrypted Web' },
      { id: 'fr4', portRange: '3306', protocol: 'TCP', source: '10.0.0.0/8', action: 'ALLOW', description: 'Internal MySQL VPC' },
    ],
    snapshots: [
      { id: 'snap_1', name: 'pre-system-update-snapshot', sizeGB: 18.4, createdAt: '2026-09-15T07:55:00Z' },
    ],
    rescueMode: false,
  };
}

export function createDefaultDevData(domain?: string): ServiceDeveloperData {
  return {
    gitRepo: {
      url: `https://github.com/organization/${domain ? domain.split('.')[0] : 'app'}-repo`,
      branch: 'main',
      autoDeploy: true,
      lastCommit: '7f9a2b1',
    },
    deployments: [
      {
        id: 'dep_1',
        commitHash: '7f9a2b1',
        message: 'Optimize database queries and update static headers',
        branch: 'main',
        status: 'success',
        timestamp: '2026-10-12T16:20:00Z',
        durationSec: 24,
      },
    ],
    envVars: [
      { id: 'ev_1', key: 'APP_ENV', value: 'production', masked: false },
      { id: 'ev_2', key: 'DB_PASSWORD', value: 's3cur3_p@ss_wp', masked: true },
      { id: 'ev_3', key: 'SESSION_SECRET', value: 'a89c7d1e2f3g4h5i6j7k8l9m0n1o2p3', masked: true },
    ],
    runtimeVersion: 'PHP 8.2',
    extensions: ['opcache', 'pdo_mysql', 'curl', 'mbstring', 'imagick'],
    cronJobs: [
      {
        id: 'cj_1',
        schedule: '0 0 * * *',
        command: 'php /var/www/html/artisan schedule:run',
        description: 'Nightly maintenance and cache warmup',
        enabled: true,
        lastRun: '2026-10-14T00:00:00Z',
      },
    ],
    stagingEnvironment: {
      active: true,
      url: `https://staging.${domain || 'mysite.com'}`,
      lastSynced: '2026-10-13T18:00:00Z',
    },
  };
}

export function createDefaultServiceLogs(domain: string): ServiceLog[] {
  const now = new Date().toISOString();
  return [
    {
      id: `lg_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: now,
      severity: 'info',
      category: 'web',
      message: `HTTPS GET / HTTP/2.0 - 200 OK (Client: 198.51.100.12)`,
    },
    {
      id: `lg_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: '2026-10-14T03:00:00Z',
      severity: 'info',
      category: 'system',
      message: `Nightly automated backup completed successfully (340 MB compressed).`,
    },
    {
      id: `lg_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: '2026-10-13T14:22:00Z',
      severity: 'info',
      category: 'auth',
      message: `Client portal session authenticated from IP 198.51.100.12.`,
    },
    {
      id: `lg_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: '2026-10-12T08:15:00Z',
      severity: 'info',
      category: 'database',
      message: `Database query telemetry: 0 slow queries detected in observation window.`,
    },
  ];
}
