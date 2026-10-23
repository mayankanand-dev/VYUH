'use client';

import React from 'react';
import {
  Search,
  X,
  TrendingUp,
  Activity,
  Info
} from 'lucide-react';
import { TRENDING_NARRATIVES, DETECTION_ACTIVITY_EVENTS } from '@/data/mockPosts';

interface RightSidebarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectTrend: (tag: string) => void;
}

export default function RightSidebar({
  searchQuery,
  onSearchChange,
  onSelectTrend,
}: RightSidebarProps) {
  return (
    <aside className="w-80 xl:w-96 p-4 space-y-4 shrink-0 hidden lg:block overflow-y-auto max-h-screen">
      {/* Search Input */}
      <div className="relative sticky top-0 z-20 bg-slate-50 pb-1">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search signals, @handles, #tags..."
            className="w-full bg-slate-100 hover:bg-slate-200/80 focus:bg-white text-slate-900 placeholder-slate-400 pl-10 pr-9 py-2.5 rounded-full text-xs sm:text-sm border border-transparent focus:border-blue-500 focus:outline-hidden transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Detection Activity (DEMO) Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                Detection Activity
                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold font-mono">
                  DEMO
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Telemetry benchmark status</p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            Mock Engine
          </span>
        </div>

        {/* Telemetry quick stats */}
        <div className="grid grid-cols-3 gap-2 text-center py-1 bg-slate-50/80 rounded-xl p-2 border border-slate-100">
          <div>
            <div className="text-xs font-bold text-slate-900">9</div>
            <div className="text-[10px] text-slate-500">Active Signals</div>
          </div>
          <div>
            <div className="text-xs font-bold text-rose-600">5</div>
            <div className="text-[10px] text-slate-500">Flagged Anom</div>
          </div>
          <div>
            <div className="text-xs font-bold text-blue-600">89%</div>
            <div className="text-[10px] text-slate-500">Sim Confidence</div>
          </div>
        </div>

        {/* Recent Cluster Events */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Simulated Clusters Flagged
          </div>
          {DETECTION_ACTIVITY_EVENTS.map((event) => (
            <div
              key={event.id}
              className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-colors text-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 text-[11px]">
                  {event.clusterName}
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                    event.riskSeverity === 'high'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {event.riskSeverity} Risk
                </span>
              </div>
              <p className="text-[11px] text-slate-500">{event.notes}</p>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                <span>{event.patternType}</span>
                <span>{event.timestamp}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Demo Disclaimer Box */}
        <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong className="font-semibold">Simulated Environment:</strong> Findings are statically tagged for calibration benchmarks. No real AI or automated censorship is involved.
          </p>
        </div>
      </div>

      {/* Trending Fictional Narratives */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Trending Narratives
          </h3>
          <span className="text-[10px] font-mono text-slate-400">Simulated</span>
        </div>

        <div className="divide-y divide-slate-100">
          {TRENDING_NARRATIVES.map((trend) => (
            <div
              key={trend.id}
              onClick={() => onSelectTrend(trend.tag)}
              className="py-2.5 px-1 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">{trend.category}</span>
                <span
                  className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full ${
                    trend.simulatedRiskLevel === 'Elevated'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : trend.simulatedRiskLevel === 'Monitored'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {trend.simulatedRiskLevel}
                </span>
              </div>
              <div className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-blue-600 group-hover:underline transition-colors mt-0.5">
                {trend.topic}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">{trend.postCount}</div>
              <div className="text-[10px] text-slate-400 italic mt-0.5 line-clamp-1">
                {trend.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Testbed Footer */}
      <div className="text-[11px] text-slate-400 px-2 space-y-1">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <span className="hover:underline cursor-pointer">Protocol Docs</span>
          <span>·</span>
          <span className="hover:underline cursor-pointer">Benchmark Schema</span>
          <span>·</span>
          <span className="hover:underline cursor-pointer">Telemetry Log</span>
          <span>·</span>
          <span className="hover:underline cursor-pointer">Privacy / Ethics</span>
        </div>
        <p className="text-[10px] text-slate-400 pt-1">
          Social Signal Lab © 2026 · Disinformation Detection Test Platform
        </p>
      </div>
    </aside>
  );
}
