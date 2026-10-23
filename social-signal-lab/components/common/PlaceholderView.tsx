'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Compass,
  Bell,
  User,
  FlaskConical,
  SearchCode,
  Activity,
  Mail,
  Sparkles,
  Bookmark,
  Users,
  BadgeCheck,
  LucideIcon
} from 'lucide-react';
import XLayout from '@/components/layout/XLayout';

export type PlaceholderIconType =
  | 'explore'
  | 'notifications'
  | 'profile'
  | 'scenarios'
  | 'investigations'
  | 'evaluation'
  | 'messages'
  | 'grok'
  | 'bookmarks'
  | 'communities'
  | 'premium';

const ICON_MAP: Record<PlaceholderIconType, LucideIcon> = {
  explore: Compass,
  notifications: Bell,
  profile: User,
  scenarios: FlaskConical,
  investigations: SearchCode,
  evaluation: Activity,
  messages: Mail,
  grok: Sparkles,
  bookmarks: Bookmark,
  communities: Users,
  premium: BadgeCheck,
};

interface PlaceholderViewProps {
  title: string;
  subtitle: string;
  iconType: PlaceholderIconType;
  plannedFeatures: string[];
}

export default function PlaceholderView({
  title,
  subtitle,
  iconType,
  plannedFeatures,
}: PlaceholderViewProps) {
  const Icon = ICON_MAP[iconType] || Compass;

  return (
    <XLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-[600px] border-x border-[#2f3336] min-h-screen bg-black text-[#e7e9ea]">
        {/* Header link back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#71767b] hover:text-[#e7e9ea] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Home Timeline</span>
        </Link>

        {/* Hero Card */}
        <div className="bg-[#16181c] rounded-2xl p-6 border border-[#2f3336] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-black border border-[#2f3336] flex items-center justify-center text-[#e7e9ea] shadow-2xs">
            <Icon className="w-6 h-6 text-[#1d9bf0]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#e7e9ea]">{title}</h1>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#202327] text-[#71767b] border border-[#2f3336]">
                Simulated Sandbox
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#71767b] mt-1">{subtitle}</p>
          </div>
        </div>

        {/* Planned Capabilities */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#71767b]">
            Module Capabilities
          </h2>
          <div className="grid gap-2.5">
            {plannedFeatures.map((feat, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-[#16181c] border border-[#2f3336] hover:border-[#536471] transition-colors text-xs text-[#e7e9ea]"
              >
                <div className="p-1 rounded-md bg-[#1d9bf0]/15 text-[#1d9bf0] shrink-0 mt-0.5">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick action back to Feed */}
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#eff3f4] hover:bg-[#d7dbdc] text-black text-xs font-bold rounded-full shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Switch to Active Timeline</span>
          </Link>
        </div>
      </div>
    </XLayout>
  );
}
