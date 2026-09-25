'use client';

import { useState } from 'react';
import {
  Settings,
  RotateCcw,
  AlertTriangle,
  Package,
  Layers,
  Calendar,
  CheckCircle2,
  Clock,
  Shield,
} from 'lucide-react';
import type { StorefrontConfig, Product } from '@/lib/demo/types';
import { useDemo } from '@/lib/demo/store';
import { defaultStorefrontConfig } from '@/lib/demo/storefront-presets';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface SettingsPanelProps {
  config: StorefrontConfig;
  onChange: (updated: StorefrontConfig) => void;
  onResetToDefaults: () => void;
  onRevertToPublished: () => void;
}

export function SettingsPanel({
  config,
  onChange,
  onResetToDefaults,
  onRevertToPublished,
}: SettingsPanelProps) {
  const { state } = useDemo();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);

  const displayedProductIds = config.displayedProductIds || [];

  function toggleProductVisibility(productId: string) {
    const isSelected = displayedProductIds.includes(productId);
    const updated = isSelected
      ? displayedProductIds.filter((id) => id !== productId)
      : [...displayedProductIds, productId];

    onChange({
      ...config,
      displayedProductIds: updated,
      isDraftDirty: true,
    });
  }

  function handleConfirmReset() {
    onResetToDefaults();
    setResetDialogOpen(false);
    toast.success('Reset storefront configuration to default template');
  }

  function handleConfirmRevert() {
    onRevertToPublished();
    setRevertDialogOpen(false);
    toast.success('Reverted all draft changes to last published state');
  }

  return (
    <div className="space-y-6">
      {/* Storefront Status Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-900">Storefront Lifecycle Status</span>
          {config.isDraftDirty ? (
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">
              Unpublished Changes
            </Badge>
          ) : (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
              Published & Synchronized
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <Clock className="h-3 w-3" />
          <span>Last Published: {config.publishedAt ? new Date(config.publishedAt).toLocaleString() : 'Not published'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <Shield className="h-3 w-3" />
          <span>Configuration Schema Version: {config.schemaVersion || 2}</span>
        </div>
      </div>

      {/* Product Display Settings */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-slate-500" />
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Product Catalog Display
          </Label>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
          <div className="space-y-0.5 pr-2">
            <span className="text-xs font-semibold text-slate-900">Show Product Pricing</span>
            <p className="text-[11px] text-slate-500">
              When toggled off, pricing cards display &ldquo;Contact for Quote&rdquo; instead of price tags.
            </p>
          </div>
          <Switch
            checked={config.showProductPricing ?? true}
            onCheckedChange={(checked) =>
              onChange({ ...config, showProductPricing: checked, isDraftDirty: true })
            }
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-700">
            Featured Products on Storefront ({displayedProductIds.length} of {state.products.length})
          </Label>
          <div className="space-y-1.5">
            {state.products.map((product) => {
              const isChecked = displayedProductIds.includes(product.id);
              return (
                <div
                  key={product.id}
                  onClick={() => toggleProductVisibility(product.id)}
                  className={`flex items-center justify-between rounded-lg border p-2.5 text-xs cursor-pointer transition-all ${
                    isChecked
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-slate-200 bg-white opacity-75 hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 truncate">{product.name}</span>
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 uppercase">
                        {product.type}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">{product.description}</p>
                  </div>
                  <Switch
                    checked={isChecked}
                    onCheckedChange={() => toggleProductVisibility(product.id)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dangerous Operations */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <Label className="text-xs font-semibold uppercase tracking-wider text-rose-600">
          Reversion & Reset Controls
        </Label>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-xs font-semibold text-slate-900">Revert Unsaved Draft Changes</h4>
              <p className="text-[11px] text-slate-500">
                Discard any edits made in this session and restore the published version.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!config.isDraftDirty}
              onClick={() => setRevertDialogOpen(true)}
              className="text-xs h-8"
            >
              Revert Draft
            </Button>
          </div>

          <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-xs font-semibold text-rose-700">Reset to Default Design</h4>
              <p className="text-[11px] text-slate-500">
                Reset all sections, theme settings, branding, and layouts back to initial demo defaults.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setResetDialogOpen(true)}
              className="text-xs h-8"
            >
              Reset All
            </Button>
          </div>
        </div>
      </div>

      {/* Revert Dialog */}
      <Dialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Revert Unsaved Changes?</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Any changes made to pages, theme tokens, branding, or sections since the last publish will be discarded.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setRevertDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" size="sm" onClick={handleConfirmRevert}>
              Confirm Revert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-700">Reset to Defaults?</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              This will overwrite all sections, pages, theme presets, and branding options with the standard CloudVista template.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmReset}>
              Reset to Defaults
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
