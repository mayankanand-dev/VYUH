'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FlaskConical,
  Activity,
  Layers,
  ChevronDown,
  Sparkles,
  SearchCode,
  Check,
  Cpu
} from 'lucide-react';
import { useAnalysisMode } from '@/context/AnalysisModeContext';

export default function WorkspaceSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { isAnalysisMode, toggleAnalysisMode } = useAnalysisMode();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const workspaces = [
    {
      name: 'X Feed Simulator',
      href: '/',
      description: 'Public timeline testing harness',
      icon: Layers,
      active: pathname === '/',
    },
    {
      name: 'Analyst Dashboard',
      href: '/investigations',
      description: 'Telemetry, clusters & CIB analysis',
      icon: SearchCode,
      active: pathname.startsWith('/investigations'),
    },
    {
      name: 'Scenario Lab',
      href: '/scenarios',
      description: 'Synthetic cascade injector & replay',
      icon: FlaskConical,
      active: pathname.startsWith('/scenarios'),
    },
    {
      name: 'Evaluation Matrix',
      href: '/evaluation',
      description: 'Precision, recall & latency benchmarks',
      icon: Activity,
      active: pathname.startsWith('/evaluation'),
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button in Nav */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 rounded-full hover:bg-[#181818] transition-colors group cursor-pointer text-[#e7e9ea]"
        title="Switch Workspace / Research Tools"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#16181c] border border-[#2f3336] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Cpu className="w-4 h-4 text-[#1d9bf0]" />
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-bold text-[#e7e9ea] flex items-center gap-1.5 leading-tight">
              Research Tools
              {isAnalysisMode && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </span>
            <span className="text-[11px] text-[#71767b]">
              {isAnalysisMode ? 'Analysis Mode ON' : 'X Clone'}
            </span>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[#71767b] hidden xl:block transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-72 sm:w-80 bg-black rounded-2xl shadow-2xl border border-[#2f3336] p-3 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="px-2 py-1.5 border-b border-[#2f3336]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#71767b]">
                Workspace Controls
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#202327] text-[#71767b] font-semibold border border-[#2f3336]">
                DEMO
              </span>
            </div>
            <p className="text-xs text-[#71767b] mt-0.5">
              Switch testing workspaces or toggle the analysis overlay.
            </p>
          </div>

          {/* Analysis Mode Toggle */}
          <div className="p-2.5 my-2 rounded-xl bg-[#16181c] border border-[#2f3336] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles
                  className={`w-4 h-4 ${
                    isAnalysisMode ? 'text-amber-400' : 'text-[#71767b]'
                  }`}
                />
                <div>
                  <div className="text-xs font-bold text-[#e7e9ea]">Analysis Mode</div>
                  <div className="text-[11px] text-[#71767b]">
                    Reveal simulated tags in timeline
                  </div>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isAnalysisMode}
                onClick={toggleAnalysisMode}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  isAnalysisMode ? 'bg-[#1d9bf0]' : 'bg-[#2f3336]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    isAnalysisMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Workspace Links */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#71767b] px-2 block pt-1">
              Testbed Environments
            </span>

            {workspaces.map((ws) => {
              const Icon = ws.icon;
              return (
                <Link
                  key={ws.href}
                  href={ws.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                    ws.active
                      ? 'bg-[#1d9bf0]/15 text-[#1d9bf0] font-semibold'
                      : 'hover:bg-[#181818] text-[#e7e9ea]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <div>
                      <div className="text-xs font-bold leading-tight">{ws.name}</div>
                      <div className="text-[11px] text-[#71767b]">{ws.description}</div>
                    </div>
                  </div>
                  {ws.active && <Check className="w-4 h-4 text-[#1d9bf0] shrink-0" />}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
