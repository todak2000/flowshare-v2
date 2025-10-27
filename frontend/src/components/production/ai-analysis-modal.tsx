"use client";

import { ProductionEntry } from "@/types/production";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BrainCircuit, AlertTriangle, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cleanHtmlString } from "@/lib/utils";

interface AIAnalysisModalProps {
  entry: ProductionEntry | null;
  open: boolean;
  onClose: () => void;
}

export function AIAnalysisModal({ entry, open, onClose }: AIAnalysisModalProps) {
  if (!entry || !entry.ai_analysis) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <BrainCircuit className="h-6 w-6 text-primary" />
                Analysis - Flagged Entry
              </DialogTitle>
              <DialogDescription className="mt-2 font-mono text-slate-600 dark:text-slate-400">
                Date: {formatDate(entry.measurement_date)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Entry Summary */}
          <div className="p-4 border rounded-lg bg-orange-100/50 dark:bg-orange-950/30 border-orange-300 dark:border-orange-800/50">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-orange-700 dark:text-orange-400" />
              <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-200">
                Entry Flagged for Review
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Gross Volume:</span>
                <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 text-base">
                  {entry.gross_volume.toLocaleString()} BBL
                </div>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">BSW:</span>
                <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 text-base">
                  {entry.bsw_percent.toFixed(1)}%
                </div>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">API Gravity:</span>
                <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 text-base">
                  {entry.api_gravity.toFixed(1)}°
                </div>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Temperature:</span>
                <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 text-base">
                  {entry.temperature.toFixed(1)}°F
                </div>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Pressure:</span>
                <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 text-base">
                  {entry.pressure?.toFixed(1) || "N/A"} psi
                </div>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Anomaly Score:</span>
                <div>
                  <Badge variant="destructive" className="font-mono font-semibold">
                    {entry.anomaly_score?.toFixed(1)}/100
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-slate-300 dark:bg-slate-700" />

          {/* AI Analysis Content */}
          <div className="space-y-3 p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <BrainCircuit className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">FlowShareGPT Powered Analysis</h3>
            </div>

            {/* Render HTML content safely */}
            <div
              className="prose prose-sm dark:prose-invert max-w-none font-mono
                         prose-h3:text-base prose-h3:font-semibold prose-h3:mt-4 prose-h3:mb-2 prose-h3:text-slate-900 dark:prose-h3:text-slate-100
                         prose-h2:text-lg prose-h2:font-bold prose-h2:mt-5 prose-h2:mb-3 prose-h2:text-slate-900 dark:prose-h2:text-slate-100
                         prose-p:my-2 prose-p:text-slate-800 dark:prose-p:text-slate-300
                         prose-ul:my-2 prose-li:my-1 prose-li:text-slate-800 dark:prose-li:text-slate-300
                         prose-strong:text-primary prose-strong:font-bold"
              dangerouslySetInnerHTML={{ __html: cleanHtmlString(entry.ai_analysis) }}
            />
          </div>

          {/* Validation Notes */}
          {entry.validation_notes && (
            <>
              <Separator className="bg-slate-300 dark:bg-slate-700" />
              <div className="space-y-2 p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  Validation Notes
                </h3>
                <p className="text-sm font-mono text-slate-700 dark:text-slate-300">
                  {entry.validation_notes}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
