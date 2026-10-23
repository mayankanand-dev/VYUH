'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  Bell,
  Mail,
  Sparkles,
  Bookmark,
  Users,
  BadgeCheck,
  User,
  MoreHorizontal,
  Feather
} from 'lucide-react';
import WorkspaceSwitcher from './WorkspaceSwitcher';

interface XLeftNavProps {
  onOpenComposerModal?: () => void;
}

export default function XLeftNav({ onOpenComposerModal }: XLeftNavProps) {
  const pathname = usePathname();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Explore', href: '/explore', icon: Search },
    { label: 'Notifications', href: '/notifications', icon: Bell, badgeCount: 2 },
    { label: 'Messages', href: '/messages', icon: Mail },
    { label: 'Grok', href: '/grok', icon: Sparkles, tag: 'Sim' },
    { label: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
    { label: 'Communities', href: '/communities', icon: Users },
    { label: 'Premium', href: '/premium', icon: BadgeCheck },
    { label: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <header className="w-[68px] sm:w-[88px] xl:w-[275px] h-screen sticky top-0 select-none shrink-0 border-r border-[#2f3336] bg-black overflow-y-auto overflow-x-hidden z-20">
      <div className="flex flex-col justify-between min-h-full py-2 px-2 xl:px-3">
        {/* Top Section */}
        <div className="space-y-1 flex flex-col items-center xl:items-start">
          {/* X Logo Mark */}
          <Link
            href="/"
            className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-[#181818] transition-colors p-2 text-white"
            aria-label="X"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-7 h-7 fill-white">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </Link>

          {/* Navigation items */}
          <nav className="w-full space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-4 p-3 rounded-full hover:bg-[#181818] transition-colors xl:w-fit ${
                    isActive ? 'font-bold text-[#e7e9ea]' : 'font-normal text-[#e7e9ea]'
                  }`}
                >
                  <div className="relative flex items-center justify-center">
                    <Icon
                      className={`w-6 h-6 transition-transform group-hover:scale-105 ${
                        isActive ? 'stroke-[2.5] text-white' : 'stroke-[1.8] text-[#e7e9ea]'
                      }`}
                    />
                    {item.badgeCount && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#1d9bf0] text-white text-[10px] font-bold flex items-center justify-center">
                        {item.badgeCount}
                      </span>
                    )}
                  </div>
                  <span className="hidden xl:inline text-xl pr-3 leading-none flex items-center gap-1.5 text-[#e7e9ea]">
                    {item.label}
                    {item.tag && (
                      <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-[#202327] text-[#71767b] border border-[#2f3336]">
                        {item.tag}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}

            {/* More Item */}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="group flex items-center gap-4 p-3 rounded-full hover:bg-[#181818] transition-colors xl:w-fit text-[#e7e9ea] cursor-pointer"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <MoreHorizontal className="w-6 h-6 stroke-[1.8] group-hover:scale-105 transition-transform text-[#e7e9ea]" />
                </div>
                <span className="hidden xl:inline text-xl pr-3 leading-none font-normal text-[#e7e9ea]">
                  More
                </span>
              </button>

              {showMoreMenu && (
                <div className="absolute left-0 bottom-full mb-2 w-56 bg-black rounded-2xl shadow-2xl border border-[#2f3336] p-2 z-50 animate-in fade-in">
                  <div className="px-4 py-2.5 rounded-xl hover:bg-[#181818] text-sm font-medium text-[#e7e9ea] transition-colors cursor-pointer">
                    Settings and privacy
                  </div>
                  <div className="px-4 py-2.5 rounded-xl hover:bg-[#181818] text-sm font-medium text-[#e7e9ea] transition-colors cursor-pointer">
                    Display
                  </div>
                  <div className="px-4 py-2.5 rounded-xl hover:bg-[#181818] text-sm font-medium text-[#e7e9ea] transition-colors cursor-pointer">
                    Keyboard shortcuts
                  </div>
                  <div className="my-1 border-t border-[#2f3336]" />
                  <div className="px-4 py-2 text-xs text-[#71767b]">
                    X Clone (Dark Mode)
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Primary Post Button */}
          <div className="w-full pt-3 flex justify-center xl:justify-start">
            <button
              onClick={() => {
                if (onOpenComposerModal) {
                  onOpenComposerModal();
                } else {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="w-12 h-12 xl:w-[90%] xl:h-[52px] bg-[#1d9bf0] hover:bg-[#1a8cd8] active:bg-[#177cc0] text-white font-bold rounded-full transition-all shadow-md flex items-center justify-center cursor-pointer"
            >
              <Feather className="w-5 h-5 xl:hidden" />
              <span className="hidden xl:inline text-[17px]">Post</span>
            </button>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="space-y-2 pt-4 mt-auto">
          {/* User Card */}
          <div className="w-full flex items-center justify-between p-2 rounded-full hover:bg-[#181818] transition-colors cursor-pointer group">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#16181c] border border-[#2f3336] text-white flex items-center justify-center font-bold text-sm shrink-0">
                LA
              </div>
              <div className="hidden xl:flex flex-col text-left truncate">
                <span className="text-[15px] font-bold text-[#e7e9ea] leading-tight truncate">
                  Lead Evaluator
                </span>
                <span className="text-[15px] text-[#71767b] leading-tight truncate">
                  @lab_analyst_01
                </span>
              </div>
            </div>
            <MoreHorizontal className="w-4 h-4 text-[#71767b] hidden xl:block shrink-0 group-hover:text-white" />
          </div>
        </div>
      </div>
    </header>
  );
}
