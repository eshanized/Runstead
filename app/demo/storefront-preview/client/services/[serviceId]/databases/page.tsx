'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useDemo } from '@/lib/demo/store';
import {
  createServiceDatabase,
  deleteServiceDatabase,
  createServiceDatabaseUser,
  deleteServiceDatabaseUser,
} from '@/lib/demo/workflows';
import { ServiceDatabase } from '@/lib/demo/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Database,
  Table as TableIcon,
  Plus,
  Trash2,
  Copy,
  Download,
  ExternalLink,
  Users,
  Key,
  ShieldCheck,
  AlertTriangle,
  Server,
  Terminal,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ServiceDatabasesPage() {
  const params = useParams();
  const serviceId = params?.serviceId as string;
  const { state, setState } = useDemo();

  const service = state.services.find((s) => s.id === serviceId);

  // Modal states
  const [createDbOpen, setCreateDbOpen] = useState(false);
  const [newDbName, setNewDbName] = useState('');
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPrivilege, setNewUserPrivilege] = useState('ALL PRIVILEGES');
  const [selectedDbForSchema, setSelectedDbForSchema] = useState<ServiceDatabase | null>(null);
  const [deleteDbTarget, setDeleteDbTarget] = useState<ServiceDatabase | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState<string | null>(null);

  if (!service) {
    return <div className="p-8 text-center text-slate-500">Service not found.</div>;
  }

  const databases = service.databases || [];
  const databaseUsers = service.databaseUsers || [];
  const maxDatabases = service.planLimits?.databases || 5;
  const dbUsagePercent = Math.min(100, Math.round((databases.length / maxDatabases) * 100));

  function handleCreateDatabase() {
    if (!newDbName.trim()) {
      toast.error('Please enter a database name.');
      return;
    }
    try {
      const nextState = createServiceDatabase(state, service!.id, newDbName.trim());
      setState(nextState);
      toast.success(`Database "${newDbName.trim()}" created successfully.`);
      setCreateDbOpen(false);
      setNewDbName('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error creating database');
    }
  }

  function handleDeleteDatabase() {
    if (!deleteDbTarget) return;
    try {
      const nextState = deleteServiceDatabase(state, service!.id, deleteDbTarget.id);
      setState(nextState);
      toast.success(`Database "${deleteDbTarget.name}" deleted.`);
      setDeleteDbTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error deleting database');
    }
  }

  function handleCreateUser() {
    if (!newUserName.trim()) {
      toast.error('Please enter a username.');
      return;
    }
    try {
      const nextState = createServiceDatabaseUser(state, service!.id, newUserName.trim(), [newUserPrivilege]);
      setState(nextState);
      toast.success(`Database user "${newUserName.trim()}" created.`);
      setCreateUserOpen(false);
      setNewUserName('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error creating user');
    }
  }

  function handleDeleteUser() {
    if (!deleteUserTarget) return;
    try {
      const nextState = deleteServiceDatabaseUser(state, service!.id, deleteUserTarget);
      setState(nextState);
      toast.success('Database user removed.');
      setDeleteUserTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error removing user');
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  }

  function handleExportSql(db: ServiceDatabase) {
    const mockSql = `-- Runstead Hosting Platform MySQL Dump
-- Database: ${db.name}
-- Generation Time: ${new Date().toISOString()}
-- Server: MySQL 8.0.35-TonmoyInfra

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE IF NOT EXISTS \`wp_posts\` (
  \`ID\` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  \`post_author\` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
  \`post_title\` text NOT NULL,
  \`post_status\` varchar(20) NOT NULL DEFAULT 'publish',
  PRIMARY KEY (\`ID\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO \`wp_posts\` (\`ID\`, \`post_author\`, \`post_title\`, \`post_status\`) VALUES
(1, 1, 'Hello World on Runstead Cloud', 'publish'),
(2, 1, 'Sample Production Page', 'publish');
COMMIT;
`;

    const blob = new Blob([mockSql], { type: 'application/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${db.name}_backup.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${db.name}_backup.sql successfully`);
  }

  return (
    <div className="space-y-8">
      {/* Overview & Quota Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Database className="h-5 w-5 text-indigo-600" />
                  Relational Databases (MySQL / MariaDB)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-1">
                  Manage schemas, database users, privileges, and automated SQL exports.
                </CardDescription>
              </div>
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
                disabled={databases.length >= maxDatabases}
                onClick={() => setCreateDbOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Create Database
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 text-xs">
            {/* Quota Progress */}
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">Plan Quota Allocation</span>
                <span className="font-mono text-slate-600">
                  {databases.length} of {maxDatabases} Databases Provisioned ({dbUsagePercent}%)
                </span>
              </div>
              <Progress value={dbUsagePercent} className="h-2" />
            </div>

            {/* Databases Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                    <th className="py-2.5 px-3">Database Name</th>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Collation</th>
                    <th className="py-2.5 px-3">Privileged Users</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {databases.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No databases created yet. Click &quot;Create Database&quot; above.
                      </td>
                    </tr>
                  ) : (
                    databases.map((db) => (
                      <tr key={db.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 flex items-center gap-2">
                          <Database className="h-3.5 w-3.5 text-indigo-500" />
                          {db.name}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">{db.sizeMB} MB</td>
                        <td className="py-3 px-3 text-slate-500 text-[11px] font-mono">{db.collation}</td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {db.users.length === 0 ? (
                              <span className="text-slate-400 italic text-[11px]">None assigned</span>
                            ) : (
                              db.users.map((u) => (
                                <Badge key={u} variant="secondary" className="text-[10px] py-0 font-mono">
                                  {u}
                                </Badge>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                              onClick={() => setSelectedDbForSchema(db)}
                            >
                              <TableIcon className="h-3.5 w-3.5 mr-1" />
                              Tables
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-slate-600 hover:text-emerald-600"
                              title="Export SQL"
                              onClick={() => handleExportSql(db)}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-slate-600 hover:text-rose-600"
                              title="Drop Database"
                              onClick={() => setDeleteDbTarget(db)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Connection Credentials Card */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Server className="h-4 w-4 text-emerald-600" />
              Connection Details
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Credentials for scripts and database clients.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200/60 font-mono">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Internal Host</div>
              <div className="flex justify-between items-center text-slate-900 font-semibold">
                <span>localhost</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard('localhost', 'Host')}
                >
                  <Copy className="h-3 w-3 text-slate-500" />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200/60 font-mono">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Port / Engine</div>
              <div className="text-slate-900 font-semibold">3306 (MySQL 8.0)</div>
            </div>

            <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200/60 font-mono">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Default User</div>
              <div className="flex justify-between items-center text-slate-900 font-semibold">
                <span>{databaseUsers[0]?.username || `${service.username}_db`}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() =>
                    copyToClipboard(databaseUsers[0]?.username || `${service.username}_db`, 'Username')
                  }
                >
                  <Copy className="h-3 w-3 text-slate-500" />
                </Button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1.5 text-slate-700"
                onClick={() => toast.info('Launching phpMyAdmin Web Client (Simulated SSO session initialized)...')}
              >
                <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                Open phpMyAdmin Demo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Database Users Section */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                Database Users & Security Grants
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Manage user authentication and privileges across databases.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1.5"
              onClick={() => setCreateUserOpen(true)}
            >
              <Plus className="h-3.5 w-3.5 text-blue-600" />
              Add Database User
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                  <th className="py-2.5 px-3">Username</th>
                  <th className="py-2.5 px-3">Allowed Host</th>
                  <th className="py-2.5 px-3">Assigned Privileges</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {databaseUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No database users configured.
                    </td>
                  </tr>
                ) : (
                  databaseUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{u.username}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{u.host}</td>
                      <td className="py-3 px-3">
                        <Badge variant="outline" className="font-mono text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                          {u.privileges.join(', ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-slate-600 hover:text-rose-600"
                          onClick={() => setDeleteUserTarget(u.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Table Browser Modal */}
      <Dialog open={Boolean(selectedDbForSchema)} onOpenChange={(open) => !open && setSelectedDbForSchema(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <TableIcon className="h-4 w-4 text-indigo-600" />
              Tables & Schema: {selectedDbForSchema?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Simulated table inventory, storage footprints, and record counts.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-4">
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2 px-3">Table Name</th>
                    <th className="py-2 px-3">Engine</th>
                    <th className="py-2 px-3">Row Count</th>
                    <th className="py-2 px-3">Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-900">wp_posts</td>
                    <td className="py-2.5 px-3 text-slate-500">InnoDB</td>
                    <td className="py-2.5 px-3 text-slate-800">4,281</td>
                    <td className="py-2.5 px-3 text-slate-600">18.4 MB</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-900">wp_options</td>
                    <td className="py-2.5 px-3 text-slate-500">InnoDB</td>
                    <td className="py-2.5 px-3 text-slate-800">892</td>
                    <td className="py-2.5 px-3 text-slate-600">4.1 MB</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-900">wp_users</td>
                    <td className="py-2.5 px-3 text-slate-500">InnoDB</td>
                    <td className="py-2.5 px-3 text-slate-800">142</td>
                    <td className="py-2.5 px-3 text-slate-600">0.8 MB</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-900">wp_comments</td>
                    <td className="py-2.5 px-3 text-slate-500">InnoDB</td>
                    <td className="py-2.5 px-3 text-slate-800">1,029</td>
                    <td className="py-2.5 px-3 text-slate-600">5.2 MB</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setSelectedDbForSchema(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Database Dialog */}
      <Dialog open={createDbOpen} onOpenChange={setCreateDbOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Database</DialogTitle>
            <DialogDescription className="text-xs">
              Provision a new isolated MySQL schema under this hosting account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Database Name</label>
              <Input
                placeholder="e.g. app_prod, store_db"
                value={newDbName}
                onChange={(e) => setNewDbName(e.target.value)}
                className="text-xs font-mono"
              />
              <p className="text-[11px] text-slate-400">
                Alphanumeric characters and underscores only.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setCreateDbOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateDatabase} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Create Database
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Database User</DialogTitle>
            <DialogDescription className="text-xs">
              Grant connection credentials for applications or developers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Username</label>
              <Input
                placeholder="e.g. wp_user"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Privileges</label>
              <Input
                value={newUserPrivilege}
                onChange={(e) => setNewUserPrivilege(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setCreateUserOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateUser} className="bg-blue-600 hover:bg-blue-700 text-white">
              Save User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Database Confirmation */}
      <Dialog open={Boolean(deleteDbTarget)} onOpenChange={(open) => !open && setDeleteDbTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Drop Database
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to drop database <strong className="text-slate-900">{deleteDbTarget?.name}</strong>?
              All tables, records, and stored procedures will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setDeleteDbTarget(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={handleDeleteDatabase}>
              Drop Database
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <Dialog open={Boolean(deleteUserTarget)} onOpenChange={(open) => !open && setDeleteUserTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Remove Database User
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete this database user? Applications using these credentials will immediately lose access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setDeleteUserTarget(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={handleDeleteUser}>
              Remove User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
