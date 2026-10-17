'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import {
  LayoutDashboard,
  FolderTree,
  Database,
  Globe,
  Mail,
  ShieldCheck,
  Archive,
  Terminal,
  Code2,
  FileCode2,
  Activity,
  Settings,
  ChevronRight,
  ExternalLink,
  Copy,
  Server,
  Lock,
  AlertTriangle,
  ArrowLeft,
  LifeBuoy,
} from 'lucide-react';
import { useDemo } from '@/lib/demo/store';
import { ClientPortalLayout } from '@/components/client-portal/client-portal-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { isCapabilityAvailableForService } from '@/lib/demo/capabilities';
import type { CapabilityId } from '@/lib/demo/types';

interface ServiceNavTab {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  capability?: CapabilityId;
  vpsOnly?: boolean;
}

export default function ServiceControlCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const serviceId = params?.serviceId as string;
  const { state } = useDemo();

  const config = state.publishedStorefront || state.storefront;
  const primaryColor = config.primaryColor || '#0f5fff';

  const service = state.services.find((s) => s.id === serviceId);
  const activeCustomerId = state.activeClientCustomerId || state.customers[0]?.id;
  const customer = state.customers.find((c) => c.id === activeCustomerId);
  const customerServices = state.services.filter((s) => s.customerId === customer?.id);
  const product = state.products.find((p) => p.id === service?.productId);

  if (!service) {
    return (
      <ClientPortalLayout>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
          <Server className="h-12 w-12 text-slate-300 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Service Not Found</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            The requested hosting service ID does not exist or does not belong to your account.
          </p>
          <Button asChild size="sm">
            <Link href="/client/services">Back to My Services</Link>
          </Button>
        </div>
      </ClientPortalLayout>
    );
  }

  const isVps = product?.type === 'vps';

  const navTabs: ServiceNavTab[] = [
    {
      id: 'overview',
      label: 'Overview',
      href: `/client/services/${serviceId}`,
      icon: LayoutDashboard,
    },
    {
      id: 'files',
      label: 'File Manager',
      href: `/client/services/${serviceId}/files`,
      icon: FolderTree,
      capability: 'file_manager',
    },
    {
      id: 'databases',
      label: 'Databases',
      href: `/client/services/${serviceId}/databases`,
      icon: Database,
      capability: 'databases',
    },
    {
      id: 'domains',
      label: 'Domains & DNS',
      href: `/client/services/${serviceId}/domains`,
      icon: Globe,
      capability: 'domain_management',
    },
    {
      id: 'email',
      label: 'Email Accounts',
      href: `/client/services/${serviceId}/email`,
      icon: Mail,
      capability: 'email_accounts',
    },
    {
      id: 'ssl',
      label: 'SSL & Security',
      href: `/client/services/${serviceId}/ssl`,
      icon: ShieldCheck,
      capability: 'ssl_certificates',
    },
    {
      id: 'backups',
      label: 'Backups',
      href: `/client/services/${serviceId}/backups`,
      icon: Archive,
      capability: 'backups',
    },
    ...(isVps
      ? [
          {
            id: 'vps',
            label: 'Compute / VPS',
            href: `/client/services/${serviceId}/vps`,
            icon: Terminal,
            capability: 'vps_power' as CapabilityId,
            vpsOnly: true,
          },
        ]
      : []),
    {
      id: 'developer-tools',
      label: 'Developer Tools',
      href: `/client/services/${serviceId}/developer-tools`,
      icon: Code2,
      capability: 'developer_tools',
    },
    {
      id: 'logs',
      label: 'Logs & Metrics',
      href: `/client/services/${serviceId}/logs`,
      icon: Activity,
      capability: 'activity_monitoring',
    },
    {
      id: 'settings',
      label: 'Service Settings',
      href: `/client/services/${serviceId}/settings`,
      icon: Settings,
    },
  ];

  function copyToClipboard(text: string, label: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    }
  }

  // Find active tab info
  const activeTab = navTabs.find((t) =>
    t.href === `/client/services/${serviceId}`
      ? pathname === t.href
      : pathname?.startsWith(t.href)
  ) || navTabs[0];

  // Capability check for current route
  const currentCapabilityAccess = activeTab.capability
    ? isCapabilityAvailableForService(service, activeTab.capability, product)
    : { available: true };

  return (
    <ClientPortalLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Breadcrumb row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-medium">
            <Link
              href="/client/services"
              className="hover:text-slate-900 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" /> My Services
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-semibold text-slate-800">{service.serviceName}</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold">{activeTab.label}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Switch Service Dropdown */}
            {customerServices.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs bg-white">
                    <Server className="h-3 w-3 mr-1.5 text-slate-500" />
                    Switch Service ({customerServices.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 text-xs">
                  <DropdownMenuLabel>Your Services</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {customerServices.map((s) => (
                    <DropdownMenuItem asChild key={s.id} className="cursor-pointer">
                      <Link
                        href={`/client/services/${s.id}`}
                        className={`flex items-center justify-between ${
                          s.id === service.id ? 'font-bold bg-slate-50' : ''
                        }`}
                      >
                        <div className="truncate mr-2">
                          <div>{s.serviceName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{s.package}</div>
                        </div>
                        <Badge
                          variant={s.status === 'active' ? 'default' : 'secondary'}
                          className={`text-[9px] h-4 ${s.status === 'active' ? 'bg-emerald-600' : ''}`}
                        >
                          {s.status}
                        </Badge>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-blue-600 gap-1">
              <Link href="/client/tickets">
                <LifeBuoy className="h-3 w-3" /> Support
              </Link>
            </Button>
          </div>
        </div>

        {/* Service Header Card */}
        <Card className="border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-white font-bold text-sm shadow-xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Server className="h-4 w-4" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
                    {service.serviceName}
                  </h1>
                  <Badge
                    className={
                      service.status === 'active'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : service.status === 'suspended'
                        ? 'bg-amber-600 text-white'
                        : service.status === 'pending'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-400 text-white'
                    }
                  >
                    {service.status.toUpperCase()}
                  </Badge>
                  {service.vpsData && (
                    <Badge variant="outline" className="text-[11px] font-mono">
                      VPS: {service.vpsData.powerState}
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-slate-500">
                  Plan:{' '}
                  <strong className="text-slate-800">{service.package || service.productName}</strong>{' '}
                  &middot; Service ID: <span className="font-mono text-slate-700">{service.id}</span>{' '}
                  &middot; Billing:{' '}
                  <span className="capitalize">{service.billingCycle}</span> ($
                  {service.price.toFixed(2)}) &middot; Renews:{' '}
                  {service.nextRenewalDate
                    ? new Date(service.nextRenewalDate).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>

              {/* Quick info credentials */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                {service.ipAddress && (
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                    <span className="text-slate-500 font-semibold text-[11px]">IP:</span>
                    <span className="font-mono font-bold text-slate-900">{service.ipAddress}</span>
                    <button
                      onClick={() => copyToClipboard(service.ipAddress!, 'IP Address')}
                      className="text-slate-400 hover:text-slate-600 ml-1"
                      title="Copy IP"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {service.domain && (
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                    <span className="text-slate-500 font-semibold text-[11px]">Domain:</span>
                    <span className="font-mono text-slate-800 truncate max-w-[150px]">
                      {service.domain}
                    </span>
                    <a
                      href={`https://${service.domain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-slate-600 ml-0.5"
                      title="Visit URL"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {service.username && (
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg hidden sm:flex">
                    <span className="text-slate-500 font-semibold text-[11px]">User:</span>
                    <span className="font-mono text-slate-800">{service.username}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Suspended alert banner if applicable */}
            {service.status === 'suspended' && (
              <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-center justify-between text-xs text-amber-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Service Suspended:</strong> This account was suspended due to an overdue
                    invoice. Control actions are restricted until reactivated.
                  </span>
                </div>
                <Button asChild size="sm" variant="outline" className="h-7 text-xs border-amber-300">
                  <Link href="/client/invoices">View Overdue Invoices</Link>
                </Button>
              </div>
            )}

            {/* Storage alert if nearing capacity */}
            {service.resourceUsage?.some((r) => r.label === 'Storage' && r.used / r.total >= 0.9) && (
              <div className="mt-4 rounded-lg bg-rose-50 border border-rose-200 p-3 flex items-center justify-between text-xs text-rose-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>
                    <strong>Storage Quota Warning:</strong> You have consumed over 90% of your allocated
                    disk storage. Clean up files or upgrade your package to avoid service interruption.
                  </span>
                </div>
                <Button asChild size="sm" variant="outline" className="h-7 text-xs border-rose-300">
                  <Link href={`/client/services/${serviceId}/settings`}>
                    Upgrade Storage Plan
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Navigation Tab Bar */}
          <div className="border-t border-slate-200 bg-slate-50/60 px-4 flex items-center gap-1 overflow-x-auto text-xs font-medium scrollbar-thin">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive =
                tab.href === `/client/services/${serviceId}`
                  ? pathname === tab.href
                  : pathname?.startsWith(tab.href);

              // Check capability
              const isAllowed = tab.capability
                ? isCapabilityAvailableForService(service, tab.capability, product).available
                : true;

              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`flex items-center gap-1.5 px-3 py-3 border-b-2 whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-600 font-bold bg-white'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  } ${!isAllowed ? 'opacity-70' : ''}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                  {!isAllowed && (
                    <Lock className="h-2.5 w-2.5 text-slate-400 ml-0.5" />
                  )}
                </Link>
              );
            })}
          </div>
        </Card>

        {/* Restricted Capability Interceptor */}
        {!currentCapabilityAccess.available ? (
          <Card className="border border-slate-200 bg-white p-12 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
              <Lock className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">{activeTab.label} Locked</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {currentCapabilityAccess.reason}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button asChild size="sm" className="text-xs">
                <Link href={`/client/services/${serviceId}/settings`}>
                  Request Plan Upgrade
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="text-xs">
                <Link href={`/client/services/${serviceId}`}>
                  Back to Service Overview
                </Link>
              </Button>
            </div>
          </Card>
        ) : (
          <div>{children}</div>
        )}
      </div>
    </ClientPortalLayout>
  );
}
