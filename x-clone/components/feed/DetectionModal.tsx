'use client';

import React from 'react';
import Link from 'next/link';
import { X, AlertTriangle, CheckCircle2, Info, Activity, Terminal, SearchCode } from 'lucide-react';
import { Post } from '@/types/feed';

interface DetectionModalProps {
  post: Post | null;
  onClose: () => void;
}

export default function DetectionModal({ post, onClose }: DetectionModalProps) {
  if (!post || !post.detectionFinding) return null;

  const finding = post.detectionFinding;
  const isHigh = finding.severity === 'high';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(91,112,131,0.4)] backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-black rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#2f3336] text-[#e7e9ea]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2f3336] bg-[#16181c]">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isHigh ? 'bg-rose-950/60 text-rose-400 border border-rose-800' : 'bg-amber-950/60 text-amber-400 border border-amber-800'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#e7e9ea] text-base flex items-center gap-2">
                Simulated Detection Finding
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#202327] text-[#71767b] font-semibold tracking-wide uppercase border border-[#2f3336]">
                  DEMO
                </span>
              </h3>
              <p className="text-xs text-[#71767b]">Benchmark classification inspect view</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-full text-[#71767b] hover:text-[#e7e9ea] hover:bg-[#202327] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Post preview snippet */}
          <div className="bg-[#16181c] rounded-xl p-3.5 border border-[#2f3336]">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold text-[#e7e9ea]">{post.authorName}</span>
              <span className="text-xs text-[#71767b]">{post.authorHandle}</span>
            </div>
            <p className="text-xs text-[#71767b] line-clamp-3 italic">
              &ldquo;{post.content}&rdquo;
            </p>
          </div>

          {/* Finding Core Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#16181c] rounded-xl p-3 border border-[#2f3336]">
              <span className="text-[11px] font-medium text-[#71767b] uppercase tracking-wider block">
                Detection Status
              </span>
              <span
                className={`inline-flex items-center gap-1.5 mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isHigh
                    ? 'bg-rose-950/60 text-rose-300 border border-rose-800'
                    : 'bg-amber-950/60 text-amber-300 border border-amber-800'
                }`}
              >
                {finding.badgeLabel}
              </span>
            </div>

            <div className="bg-[#16181c] rounded-xl p-3 border border-[#2f3336]">
              <span className="text-[11px] font-medium text-[#71767b] uppercase tracking-wider block">
                Simulated Confidence
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-base font-bold text-[#e7e9ea]">
                  {Math.round(finding.confidenceScore * 100)}%
                </span>
                <span className="text-[10px] text-[#71767b] font-mono">(Synthetic metric)</span>
              </div>
            </div>
          </div>

          {/* Triggered Rule */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#e7e9ea]">
              <Terminal className="w-3.5 h-3.5 text-[#1d9bf0]" />
              <span>Simulated Rule / Trigger</span>
            </div>
            <div className="bg-[#16181c] text-[#1d9bf0] font-mono text-xs p-3 rounded-xl border border-[#2f3336]">
              {finding.ruleTriggered}
            </div>
          </div>

          {/* Simulated Reason */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#e7e9ea]">
              <Info className="w-3.5 h-3.5 text-[#1d9bf0]" />
              <span>Fictional Reasoning (Test Scenario)</span>
            </div>
            <p className="text-sm text-[#e7e9ea]/90 leading-relaxed bg-[#16181c] p-3.5 rounded-xl border border-[#2f3336]">
              {finding.reason}
            </p>
          </div>

          {/* Detected Signals */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#e7e9ea]">
              <Activity className="w-3.5 h-3.5 text-[#71767b]" />
              <span>Mock Detection Signals Flagged</span>
            </div>
            <ul className="space-y-1.5">
              {finding.detectedSignals.map((signal, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-xs text-[#e7e9ea]/80 bg-[#16181c] p-2.5 rounded-lg border border-[#2f3336]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{signal}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Disclaimer Banner */}
          <div className="p-3 bg-amber-950/40 rounded-xl border border-amber-800/80 text-[11px] text-amber-200 leading-normal flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-amber-300">Notice for Evaluators:</strong>{' '}
              {finding.disclaimer} This explanation was hardcoded into the test harness to calibrate UI triage workflows.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-black border-t border-[#2f3336] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#e7e9ea] bg-[#16181c] border border-[#2f3336] rounded-full hover:bg-[#202327] transition-colors cursor-pointer"
          >
            Close
          </button>
          <Link
            href={`/investigations?signal=${post.id}`}
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-[#1d9bf0] hover:bg-[#1a8cd8] rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <SearchCode className="w-3.5 h-3.5" />
            <span>Investigate in Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
