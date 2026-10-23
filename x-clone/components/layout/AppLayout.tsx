'use client';

import React from 'react';
import LeftNav from './LeftNav';
import RightSidebar from './RightSidebar';
import SimulatedBanner from '../common/SimulatedBanner';

interface AppLayoutProps {
  children?: React.ReactNode;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onSelectTrend?: (tag: string) => void;
  customMain?: React.ReactNode;
}

export default function AppLayout({
  children,
  searchQuery = '',
  onSearchChange = () => {},
  onSelectTrend = () => {},
  customMain,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Simulated Platform Banner */}
      <SimulatedBanner />

      {/* Main 3-column layout */}
      <div className="flex-1 flex justify-center max-w-7xl w-full mx-auto">
        {/* Left Navigation Column */}
        <LeftNav />

        {/* Central Feed / Content Column */}
        <div className="flex-1 max-w-2xl min-h-screen border-r border-slate-200/80 bg-white shadow-2xs">
          {customMain || children}
        </div>

        {/* Right Sidebar Column */}
        <RightSidebar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onSelectTrend={onSelectTrend}
        />
      </div>
    </div>
  );
}
