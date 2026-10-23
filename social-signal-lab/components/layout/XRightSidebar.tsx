'use client';

import React, { useState } from 'react';
import { Search, X, MoreHorizontal, BadgeCheck } from 'lucide-react';
import { X_TRENDS, SUGGESTED_ACCOUNTS } from '@/data/mockPosts';
import { SuggestedAccount, XTrend } from '@/types/feed';

interface XRightSidebarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectTrend: (topic: string) => void;
}

export default function XRightSidebar({
  searchQuery,
  onSearchChange,
  onSelectTrend,
}: XRightSidebarProps) {
  const [accounts, setAccounts] = useState<SuggestedAccount[]>(SUGGESTED_ACCOUNTS);
  const [trends] = useState<XTrend[]>(X_TRENDS);

  const toggleFollow = (accountId: string) => {
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId ? { ...acc, isFollowing: !acc.isFollowing } : acc
      )
    );
  };

  return (
    <aside className="w-[290px] xl:w-[350px] pl-6 py-2 space-y-4 shrink-0 hidden lg:block select-none bg-black h-screen sticky top-0 overflow-y-auto overflow-x-hidden">
      {/* Search Bar - Sticky */}
      <div className="sticky top-0 bg-black pt-1 pb-3 z-20">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#71767b] absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search"
            className="w-full bg-[#202327] focus:bg-black text-[#e7e9ea] placeholder-[#71767b] text-[15px] pl-11 pr-9 py-2.5 rounded-full border border-transparent focus:border-[#1d9bf0] focus:outline-hidden transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-3 p-1 rounded-full text-[#71767b] hover:text-white bg-[#2f3336] hover:bg-[#3e4144] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Subscribe to Premium Card */}
      <div className="rounded-2xl border border-[#2f3336] bg-[#16181c] p-4 space-y-2">
        <h3 className="font-extrabold text-[17px] text-[#e7e9ea] leading-snug">
          Subscribe to Premium
        </h3>
        <p className="text-[13px] text-[#71767b] leading-normal">
          Subscribe to unlock new features and verify your synthetic identity within the testing lab.
        </p>
        <button
          type="button"
          className="mt-1 px-4 py-2 bg-[#eff3f4] hover:bg-[#d7dbdc] text-black font-bold text-sm rounded-full transition-colors cursor-pointer"
        >
          Subscribe
        </button>
      </div>

      {/* What's happening (Trends) */}
      <div className="rounded-2xl border border-[#2f3336] bg-[#16181c] overflow-hidden">
        <h3 className="font-extrabold text-[19px] text-[#e7e9ea] px-4 pt-3 pb-2 leading-tight">
          What&apos;s happening
        </h3>

        <div className="divide-y divide-[#2f3336]/70">
          {trends.map((trend) => (
            <div
              key={trend.id}
              onClick={() => onSelectTrend(trend.topic)}
              className="px-4 py-3 hover:bg-[#1d1f23] transition-colors cursor-pointer group flex items-start justify-between"
            >
              <div className="space-y-0.5">
                <span className="text-[13px] text-[#71767b] block leading-tight">
                  {trend.category}
                </span>
                <span className="font-bold text-[15px] text-[#e7e9ea] block leading-snug group-hover:underline">
                  {trend.topic}
                </span>
                <span className="text-[13px] text-[#71767b] block leading-tight">
                  {trend.postsCount}
                </span>
                {trend.context && (
                  <span className="text-[12px] text-[#71767b] block pt-0.5 opacity-80">
                    {trend.context}
                  </span>
                )}
              </div>
              <button
                type="button"
                aria-label="More"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="p-1.5 rounded-full text-[#71767b] hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="w-full text-left px-4 py-3 text-[14px] text-[#1d9bf0] hover:bg-[#1d1f23] transition-colors cursor-pointer"
        >
          Show more
        </button>
      </div>

      {/* Who to follow */}
      <div className="rounded-2xl border border-[#2f3336] bg-[#16181c] overflow-hidden">
        <h3 className="font-extrabold text-[19px] text-[#e7e9ea] px-4 pt-3 pb-2 leading-tight">
          Who to follow
        </h3>

        <div className="divide-y divide-[#2f3336]/70">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="px-4 py-3 hover:bg-[#1d1f23] transition-colors flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-10 h-10 rounded-full ${acc.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0`}
                >
                  {acc.initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1 leading-tight">
                    <span className="font-bold text-[15px] text-[#e7e9ea] hover:underline cursor-pointer truncate">
                      {acc.name}
                    </span>
                    {acc.isVerified && (
                      <BadgeCheck className="w-4 h-4 text-[#1d9bf0] fill-[#1d9bf0]/20 shrink-0" />
                    )}
                  </div>
                  <span className="text-[13px] text-[#71767b] block truncate leading-tight">
                    {acc.handle}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleFollow(acc.id)}
                className={`px-4 py-1.5 rounded-full font-bold text-xs transition-colors shrink-0 cursor-pointer ${
                  acc.isFollowing
                    ? 'border border-[#536471] text-[#e7e9ea] bg-transparent hover:bg-rose-950/30 hover:text-rose-400 hover:border-rose-800'
                    : 'bg-[#eff3f4] text-[#0f1419] hover:bg-[#d7dbdc]'
                }`}
              >
                {acc.isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="w-full text-left px-4 py-3 text-[14px] text-[#1d9bf0] hover:bg-[#1d1f23] transition-colors cursor-pointer"
        >
          Show more
        </button>
      </div>

      {/* Restrained X Dark Footer */}
      <footer className="px-4 text-[13px] text-[#71767b] space-y-1 leading-normal pb-6">
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <span className="hover:underline cursor-pointer">Terms of Service</span>
          <span>·</span>
          <span className="hover:underline cursor-pointer">Privacy Policy</span>
          <span>·</span>
          <span className="hover:underline cursor-pointer">Cookie Policy</span>
          <span>·</span>
          <span className="hover:underline cursor-pointer">Accessibility</span>
          <span>·</span>
          <span className="hover:underline cursor-pointer">Ads info</span>
          <span>·</span>
          <span className="hover:underline cursor-pointer">More ...</span>
        </div>
        <p className="text-[12px] text-[#71767b]/80 pt-1">
          © 2026 X Corp. (Simulated Environment · Social Signal Lab)
        </p>
      </footer>
    </aside>
  );
}
