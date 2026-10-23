'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface FeedHeaderProps {
  activeTab: 'all' | 'flagged';
  onTabChange: (tab: 'all' | 'flagged') => void;
  totalCount: number;
  flaggedCount: number;
  searchQuery: string;
  onClearSearch: () => void;
}

export default function FeedHeader({
  activeTab,
  onTabChange,
  totalCount,
  flaggedCount,
  searchQuery,
  onClearSearch,
}: FeedHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top title bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Home Feed
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Disinfo Testbed
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            Calibrating disinformation detection markers & narrative spread
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Sim Stream Active
          </span>
        </div>
      </div>

      {/* Search active indicator banner */}
      {searchQuery && (
        <div className="px-4 py-1.5 bg-blue-50/80 border-t border-blue-100 flex items-center justify-between text-xs text-blue-900">
          <span>
            Filtering by: <strong className="font-semibold">&ldquo;{searchQuery}&rdquo;</strong>
          </span>
          <button
            onClick={onClearSearch}
            className="text-blue-700 hover:text-blue-900 font-semibold underline text-[11px] cursor-pointer"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="grid grid-cols-2 text-center text-sm font-semibold border-t border-slate-100">
        <button
          onClick={() => onTabChange('all')}
          className={`py-3 px-4 relative transition-colors cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'all'
              ? 'text-slate-900'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
          }`}
        >
          <span>All Posts</span>
          <span className="text-xs font-normal px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-full">
            {totalCount}
          </span>
          {activeTab === 'all' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900 rounded-full" />
          )}
        </button>

        <button
          onClick={() => onTabChange('flagged')}
          className={`py-3 px-4 relative transition-colors cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'flagged'
              ? 'text-slate-900'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Flagged Posts</span>
          </div>
          <span className="text-xs font-semibold px-2 py-0.2 bg-amber-100 text-amber-800 rounded-full border border-amber-200">
            {flaggedCount}
          </span>
          {activeTab === 'flagged' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-600 rounded-full" />
          )}
        </button>
      </div>
    </header>
  );
}
