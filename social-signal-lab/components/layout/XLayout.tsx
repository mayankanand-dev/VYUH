'use client';

import React from 'react';
import XLeftNav from './XLeftNav';
import XRightSidebar from './XRightSidebar';

interface XLayoutProps {
  children?: React.ReactNode;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onSelectTrend?: (tag: string) => void;
  customMain?: React.ReactNode;
  onOpenComposerModal?: () => void;
}

export default function XLayout({
  children,
  searchQuery = '',
  onSearchChange = () => {},
  onSelectTrend = () => {},
  customMain,
  onOpenComposerModal,
}: XLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-[#e7e9ea] flex justify-center selection:bg-[#1d9bf0]/30 selection:text-white">
      <div className="flex w-full max-w-[1265px] justify-center items-start">
        {/* Left Navigation Rail (250-275px desktop, compact on tablet/mobile) */}
        <XLeftNav onOpenComposerModal={onOpenComposerModal} />

        {/* Center Timeline Column (~600px) */}
        <div className="w-full max-w-[600px] min-h-screen border-x border-[#2f3336] bg-black">
          {customMain || children}
        </div>

        {/* Right Discovery Column (320-350px) */}
        <XRightSidebar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onSelectTrend={onSelectTrend}
        />
      </div>
    </div>
  );
}
