'use client';

import React, { useState } from 'react';
import { X, ShieldAlert, Sparkles } from 'lucide-react';

export default function SimulatedBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-amber-50/95 border-b border-amber-200/80 text-amber-950 px-4 py-2.5 text-xs sm:text-sm font-medium transition-all sticky top-0 z-40 backdrop-blur-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-bold uppercase tracking-wider text-[10px] shrink-0">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-800" />
            Simulated Platform
          </span>
          <p className="truncate sm:whitespace-normal">
            <strong className="font-semibold text-amber-900">Research Testbed:</strong> All accounts, signals, metrics, and detection alerts are entirely synthetic for disinformation model calibration. No real AI or automated moderation is active.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300/60 font-mono">
            <Sparkles className="w-3 h-3 text-amber-600" /> Engine: Mock Heuristic v0.1
          </span>
          <button
            onClick={() => setIsVisible(false)}
            aria-label="Dismiss banner"
            className="text-amber-700 hover:text-amber-950 p-1 rounded-md hover:bg-amber-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
