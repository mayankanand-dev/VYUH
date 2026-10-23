'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Compass,
  Bell,
  User,
  FlaskConical,
  SearchCode,
  Activity,
  Feather,
  Layers
} from 'lucide-react';

export default function LeftNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Explore', href: '/explore', icon: Compass },
    { label: 'Notifications', href: '/notifications', icon: Bell },
    { label: 'Profile', href: '/profile', icon: User },
    { label: 'Scenario Lab', href: '/scenarios', icon: FlaskConical },
    { label: 'Investigations', href: '/investigations', icon: SearchCode },
    { label: 'Evaluation', href: '/evaluation', icon: Activity },
  ];

  return (
    <aside className="w-16 sm:w-20 xl:w-64 h-screen sticky top-0 flex flex-col justify-between py-4 px-2 sm:px-3 xl:px-4 border-r border-slate-200/80 bg-white select-none shrink-0">
      <div className="space-y-4">
        {/* Branding */}
        <Link
          href="/"
          className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-100 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-950 via-slate-900 to-blue-900 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5 text-blue-400" />
          </div>
          <div className="hidden xl:flex flex-col">
            <span className="font-extrabold text-slate-950 text-base leading-tight tracking-tight">
              Social Signal Lab
            </span>
            <span className="text-[11px] font-mono text-blue-600 font-medium">
              Disinfo Testbed v0.1
            </span>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 p-3 rounded-xl transition-all group ${
                  isActive
                    ? 'text-slate-950 font-bold bg-slate-100/90'
                    : 'text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon
                    className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-108 ${
                      isActive ? 'text-slate-900 stroke-[2.4]' : 'text-slate-600'
                    }`}
                  />
                  {item.label === 'Notifications' && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </div>
                <span className="hidden xl:inline text-sm sm:text-base">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Action Button: Post Scenario Signal */}
        <div className="pt-2">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 p-3 xl:py-3.5 bg-slate-950 hover:bg-slate-800 text-white rounded-full font-bold shadow-xs hover:shadow transition-all group cursor-pointer"
          >
            <Feather className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="hidden xl:inline text-sm">Inject Signal</span>
          </Link>
        </div>
      </div>

      {/* Evaluator user badge at bottom */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              LA
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                Lead Evaluator
              </span>
              <span className="text-[11px] text-slate-500">@lab_analyst_01</span>
            </div>
          </div>
          <div className="hidden xl:flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono text-emerald-800 font-semibold">Active</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
