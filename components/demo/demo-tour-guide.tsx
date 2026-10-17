'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDemo } from '@/lib/demo/store';
import {
  Compass,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Building2,
  User,
  Shield,
  Layers,
  Sparkles,
  Server,
  ShoppingCart,
  Database,
  ExternalLink,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface TourStep {
  step: number;
  title: string;
  role: 'reseller' | 'customer' | 'platform';
  description: string;
  route: string;
  highlights: string[];
}

const TOUR_STEPS: TourStep[] = [
  {
    step: 1,
    title: 'Reseller Business Operations',
    role: 'reseller',
    description:
      'Explore the multi-tenant hosting business dashboard. Inspect real-time MRR telemetry, order pipelines, active customer tenants, and integration health.',
    route: '/dashboard/overview',
    highlights: ['MRR & Revenue Telemetry', 'Customer Growth', 'Operational Alerts'],
  },
  {
    step: 2,
    title: 'Product Catalog & Capabilities',
    role: 'reseller',
    description:
      'Configure hosting packages and toggle exact control center capabilities (File Manager, Databases, SSL, Backups, VPS Power) delivered to end customers.',
    route: '/dashboard/products',
    highlights: ['Capability Toggles', 'Quota Allocations', 'Live Service Cascade'],
  },
  {
    step: 3,
    title: 'White-Label Public Storefront',
    role: 'customer',
    description:
      'Experience the customizable customer-facing storefront featuring dynamic pricing tables, custom branding colors, and domain availability lookup.',
    route: '/storefront',
    highlights: ['Custom Reseller Branding', 'Domain Search', 'Plan Comparison'],
  },
  {
    step: 4,
    title: 'Automated Checkout & Invoicing',
    role: 'customer',
    description:
      'Walk through the end-to-end purchasing workflow with coupon discounts, billing cycle selection, tax calculations, and instant payment settlement.',
    route: '/storefront/checkout?plan=prod_001&billing=monthly',
    highlights: ['Instant Payment Settlement', 'Invoice Generation', 'Client Onboarding'],
  },
  {
    step: 5,
    title: 'Provisioning Engine & Recovery',
    role: 'reseller',
    description:
      'Audit order lifecycle automation. Witness how upstream hypervisor quota exhaustion is flagged (ORD-0158) and retry provisioning with 1 click.',
    route: '/dashboard/orders',
    highlights: ['Hypervisor Queue', 'Error Recovery Automation', 'Automated Retries'],
  },
  {
    step: 6,
    title: 'White-Label Customer Portal',
    role: 'customer',
    description:
      'Log into the customer portal as Alex Chen. Review purchased compute instances, overdue invoices, and launch support tickets.',
    route: '/client/services',
    highlights: ['Service Directory', 'Support Tickets', 'Quick Server Actions'],
  },
  {
    step: 7,
    title: 'Dedicated Hosting Control Center',
    role: 'customer',
    description:
      'Deep dive into the complete service control center: File Manager with code editor, MySQL databases, DNS zone editor, Let\'s Encrypt SSL reissue, and Backups.',
    route: '/client/services/srv_001',
    highlights: ['Interactive File Manager', 'Schema Browser', 'Let\'s Encrypt Reissue'],
  },
  {
    step: 8,
    title: 'Platform Operator & SaaS Admin',
    role: 'platform',
    description:
      'Switch to the Tonmoy Infrastructure platform operator cockpit. Monitor cross-reseller health, global hypervisor compute nodes, and subscription billing tiers.',
    route: '/dashboard/platform-admin',
    highlights: ['Cross-Tenant Health', 'Hypervisor Nodes', 'Global Billing Tiers'],
  },
];

export function DemoTourGuideDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { state, setState, resetDemo } = useDemo();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const currentStep = TOUR_STEPS[activeStepIndex];

  function handleSwitchRole(role: 'reseller' | 'customer' | 'platform') {
    if (role === 'reseller') {
      router.push('/dashboard/overview');
    } else if (role === 'customer') {
      const alex = state.customers[0];
      if (alex) {
        setState((prev) => ({ ...prev, activeClientCustomerId: alex.id }));
      }
      router.push('/client/services/srv_001');
    } else {
      router.push('/dashboard/platform-admin');
    }
    onOpenChange(false);
  }

  function handleNavigateStep(step: TourStep) {
    if (step.role === 'customer') {
      const cust = state.customers[0];
      if (cust) {
        setState((prev) => ({ ...prev, activeClientCustomerId: cust.id }));
      }
    }
    router.push(step.route);
    onOpenChange(false);
  }

  function handleConfirmReset() {
    resetDemo();
    setResetConfirmOpen(false);
    onOpenChange(false);
    toast.success('Platform state reset to initial catalog data.');
    router.push('/demo/overview');
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-6">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                  <Compass className="h-5 w-5" />
                </span>
                <div>
                  <DialogTitle className="text-lg font-extrabold text-slate-900">
                    Runstead Platform Explorer
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Coherent hosting-business operating platform by Tonmoy Infrastructure.
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Persona Switcher Bar */}
          <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Switch Role & Console Perspective
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSwitchRole('reseller')}
                className="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all flex items-center gap-2.5 shadow-2xs"
              >
                <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900">Reseller Business</div>
                  <div className="text-[10px] text-slate-500">Manage Hosting Biz</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchRole('customer')}
                className="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all flex items-center gap-2.5 shadow-2xs"
              >
                <User className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900">End Customer Portal</div>
                  <div className="text-[10px] text-slate-500">Alex Chen (Control Center)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchRole('platform')}
                className="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-purple-500 hover:bg-purple-50/50 text-left transition-all flex items-center gap-2.5 shadow-2xs"
              >
                <Shield className="h-4 w-4 text-purple-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900">Platform Operator</div>
                  <div className="text-[10px] text-slate-500">SaaS Multi-Tenant Ops</div>
                </div>
              </button>
            </div>
          </div>

          {/* Guided Tour Steps List */}
          <div className="flex-1 my-3 overflow-y-auto space-y-2 max-h-[42vh] pr-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Guided 8-Stage Product Walkthrough
            </span>

            <div className="space-y-2">
              {TOUR_STEPS.map((step, idx) => {
                const isActive = activeStepIndex === idx;
                const roleBadge =
                  step.role === 'reseller'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : step.role === 'customer'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-purple-50 text-purple-700 border-purple-200';

                return (
                  <div
                    key={step.step}
                    onClick={() => setActiveStepIndex(idx)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'border-indigo-500 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                            isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {step.step}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{step.title}</span>
                            <Badge variant="outline" className={`text-[10px] font-mono capitalize ${roleBadge}`}>
                              {step.role}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                            {step.description}
                          </p>

                          {/* Highlights */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {step.highlights.map((h) => (
                              <span
                                key={h}
                                className="text-[10px] font-medium bg-white text-slate-600 px-2 py-0.5 rounded border border-slate-200"
                              >
                                ✓ {h}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant={isActive ? 'default' : 'outline'}
                        className="text-xs h-8 shrink-0 gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigateStep(step);
                        }}
                      >
                        Visit <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Controls */}
          <DialogFooter className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 gap-1.5"
              onClick={() => setResetConfirmOpen(true)}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Demo to Clean Seed Data
            </Button>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
                Close Tour
              </Button>
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
                onClick={() => handleNavigateStep(currentStep)}
              >
                Jump to Step {currentStep.step} <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Reset Platform State
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to reset all workspace files, databases, orders, invoices, and customer changes?
              This will restore the pristine catalog, preconfigured scenarios, and control center state.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setResetConfirmOpen(false)}>
              Keep Current State
            </Button>
            <Button size="sm" variant="destructive" onClick={handleConfirmReset}>
              Confirm Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
