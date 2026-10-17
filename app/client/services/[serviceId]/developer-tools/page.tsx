'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useDemo } from '@/lib/demo/store';
import {
  triggerServiceDeployment,
  rollbackServiceDeployment,
  addServiceEnvVar,
  deleteServiceEnvVar,
} from '@/lib/demo/workflows';
import { createDefaultDevData } from '@/lib/demo/service-factories';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  GitBranch,
  Rocket,
  RotateCcw,
  Key,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Terminal,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Code2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ServiceDeveloperToolsPage() {
  const params = useParams();
  const serviceId = params?.serviceId as string;
  const { state, setState } = useDemo();

  const service = state.services.find((s) => s.id === serviceId);
  const dev = service?.devData || (service ? createDefaultDevData(service.domain || 'app.local') : null);

  const [deploying, setDeploying] = useState(false);
  const [revealedEnvIds, setRevealedEnvIds] = useState<Record<string, boolean>>({});

  // Add env var dialog
  const [addEnvOpen, setAddEnvOpen] = useState(false);
  const [envKey, setEnvKey] = useState('');
  const [envValue, setEnvValue] = useState('');
  const [envMasked, setEnvMasked] = useState(true);

  if (!service || !dev) {
    return <div className="p-8 text-center text-slate-500">Service not found.</div>;
  }

  async function handleTriggerDeploy() {
    setDeploying(true);
    toast.info('Triggering build pipeline & edge container release...');

    try {
      const nextState = triggerServiceDeployment(
        state,
        service!.id,
        'Triggered production release via Web Control Center'
      );
      setState(nextState);
      toast.success('Deployed commit successfully to edge containers!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Deployment failed');
    } finally {
      setDeploying(false);
    }
  }

  function handleRollback(deploymentId: string) {
    try {
      const nextState = rollbackServiceDeployment(state, service!.id, deploymentId);
      setState(nextState);
      toast.success('Rolled back release container successfully.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Rollback failed');
    }
  }

  function handleAddEnv() {
    if (!envKey.trim() || !envValue.trim()) {
      toast.error('Please enter key name and value.');
      return;
    }
    try {
      const nextState = addServiceEnvVar(state, service!.id, envKey.trim(), envValue.trim(), envMasked);
      setState(nextState);
      toast.success(`Environment variable ${envKey.trim().toUpperCase()} configured.`);
      setAddEnvOpen(false);
      setEnvKey('');
      setEnvValue('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add environment variable');
    }
  }

  function handleDeleteEnv(envId: string) {
    try {
      const nextState = deleteServiceEnvVar(state, service!.id, envId);
      setState(nextState);
      toast.success('Environment variable removed.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove variable');
    }
  }

  return (
    <div className="space-y-8">
      {/* Git Integration & Deployments */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-indigo-600" />
                  Git Continuous Deployment (CI/CD)
                </CardTitle>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                  Webhook Active
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Automated build and zero-downtime container rollouts on git push.
              </CardDescription>
            </div>

            <Button
              size="sm"
              disabled={deploying}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
              onClick={handleTriggerDeploy}
            >
              <Rocket className={`h-3.5 w-3.5 ${deploying ? 'animate-bounce' : ''}`} />
              {deploying ? 'Deploying Build...' : 'Deploy Latest Commit'}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 text-xs">
          {/* Repo Specs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/60 font-mono">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Repository</span>
              <span className="font-bold text-slate-900 text-xs mt-0.5 block truncate">
                {dev.gitRepo?.url || `https://github.com/organization/${service.domain?.split('.')[0] || 'app'}`}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Branch</span>
              <span className="text-slate-800 text-xs mt-0.5 block font-bold">
                {dev.gitRepo?.branch || 'main'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Runtime Engine</span>
              <span className="text-slate-800 text-xs mt-0.5 block">{dev.runtimeVersion || 'Node.js 20.x'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Auto-Deploy</span>
              <span className="text-emerald-700 font-bold text-xs mt-0.5 block">Enabled on Push</span>
            </div>
          </div>

          {/* Deployments History Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900">Recent Build & Deployment Timeline</h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                    <th className="py-2.5 px-3">Commit</th>
                    <th className="py-2.5 px-3">Commit Message</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {dev.deployments.map((d, idx) => (
                    <tr key={d.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3 font-bold text-indigo-600">
                        {d.commitHash}
                        {idx === 0 && (
                          <Badge variant="secondary" className="ml-2 font-sans text-[10px]">
                            Current
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-800 font-sans">{d.message}</td>
                      <td className="py-3 px-3 text-slate-500 font-sans text-xs">
                        {d.timestamp ? new Date(d.timestamp).toLocaleString() : 'Recent'}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-sans"
                        >
                          {d.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right font-sans">
                        {idx > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs text-slate-700 hover:text-indigo-600"
                            onClick={() => handleRollback(d.id)}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Rollback
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environment Variables & Cron Jobs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Environment Variables Card */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Key className="h-4 w-4 text-emerald-600" />
                  Environment Variables (.env)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Secret keys and runtime configuration injected into container memory.
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => setAddEnvOpen(true)}>
                <Plus className="h-3.5 w-3.5 text-emerald-600" />
                Add Variable
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 text-xs font-mono">
            <div className="overflow-x-auto rounded-xl border border-slate-200 text-[11px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-sans font-semibold text-slate-600">
                    <th className="py-2.5 px-3">Variable Key</th>
                    <th className="py-2.5 px-3">Value</th>
                    <th className="py-2.5 px-3 text-right font-sans">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dev.envVars.map((v) => {
                    const isRevealed = revealedEnvIds[v.id];
                    return (
                      <tr key={v.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 font-bold text-slate-900">{v.key}</td>
                        <td className="py-3 px-3 text-slate-600 font-mono">
                          {v.masked && !isRevealed ? '••••••••••••••••' : v.value}
                        </td>
                        <td className="py-3 px-3 text-right font-sans">
                          <div className="flex items-center justify-end gap-1">
                            {v.masked && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800"
                                onClick={() =>
                                  setRevealedEnvIds((prev) => ({ ...prev, [v.id]: !prev[v.id] }))
                                }
                              >
                                {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-slate-500 hover:text-rose-600"
                              onClick={() => handleDeleteEnv(v.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Cron Job Scheduler Card */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              Automated Cron Job Scheduler
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Recurring crontab tasks executed inside application container.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-xs font-mono text-[11px]">
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1">
                <div className="flex justify-between items-center font-bold text-slate-900">
                  <span>0 0 * * *</span>
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 font-sans">
                    Active
                  </Badge>
                </div>
                <div className="text-slate-700 truncate">php /var/www/artisan queue:flush</div>
                <div className="text-[10px] text-slate-400 font-sans">Last run: 4 hours ago (exit code 0)</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1">
                <div className="flex justify-between items-center font-bold text-slate-900">
                  <span>*/15 * * * *</span>
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 font-sans">
                    Active
                  </Badge>
                </div>
                <div className="text-slate-700 truncate">curl -s https://api.runstead.local/heartbeat</div>
                <div className="text-[10px] text-slate-400 font-sans">Last run: 8 mins ago (exit code 0)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Env Var Dialog */}
      <Dialog open={addEnvOpen} onOpenChange={setAddEnvOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Environment Variable</DialogTitle>
            <DialogDescription className="text-xs">
              Key name will be normalized to uppercase alphanumeric.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Variable Key</label>
              <Input
                placeholder="e.g. STRIPE_API_KEY, REDIS_URL"
                value={envKey}
                onChange={(e) => setEnvKey(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Variable Value</label>
              <Input
                placeholder="e.g. sk_live_••••••••••••"
                value={envValue}
                onChange={(e) => setEnvValue(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-700 font-medium">Mask Value in UI</span>
              <Switch checked={envMasked} onCheckedChange={setEnvMasked} />
            </div>
          </div>

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setAddEnvOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddEnv} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Save Variable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
