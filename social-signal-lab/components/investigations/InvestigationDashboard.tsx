'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  SearchCode,
  Users,
  Clock,
  ArrowLeft,
  Terminal,
  CheckCircle2,
  Info,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { INITIAL_POSTS, DETECTION_ACTIVITY_EVENTS } from '@/data/mockPosts';
import { useAnalysisMode } from '@/context/AnalysisModeContext';

export default function InvestigationDashboard() {
  const searchParams = useSearchParams();
  const signalParam = searchParams.get('signal');
  const { isAnalysisMode, toggleAnalysisMode } = useAnalysisMode();

  const [tabOverride, setTabOverride] = useState<'clusters' | 'accounts' | 'timeline' | 'inspector' | null>(null);
  const [selectedClusterId, setSelectedClusterId] = useState<string>(
    DETECTION_ACTIVITY_EVENTS[0].clusterId
  );
  const [selectedPostIdOverride, setSelectedPostIdOverride] = useState<string | null>(null);

  const activeTab = tabOverride ?? (signalParam ? 'inspector' : 'clusters');
  const selectedPostId = selectedPostIdOverride ?? (signalParam || 'post-1');

  const selectedPost = INITIAL_POSTS.find((p) => p.id === selectedPostId) || INITIAL_POSTS[0];
  const selectedCluster =
    DETECTION_ACTIVITY_EVENTS.find((c) => c.clusterId === selectedClusterId) ||
    DETECTION_ACTIVITY_EVENTS[0];

  const flaggedPosts = INITIAL_POSTS.filter((p) => p.detectionFinding !== undefined);

  // Synthetic account coordination data
  const monitoredAccounts = [
    {
      handle: '@metro_pulse_alert',
      name: 'Metro Grid Watcher',
      role: 'Coordinated Alert Node',
      accountAge: '3 days',
      velocity: '48 posts/hr',
      lexicalOverlap: '98%',
      riskSeverity: 'high',
      cluster: 'Cluster #TX-882'
    },
    {
      handle: '@g_truth_dispatch99',
      name: 'Global Truth Dispatch',
      role: 'Astroturf Disseminator',
      accountAge: '2 days',
      velocity: '140 posts/hr',
      lexicalOverlap: '94%',
      riskSeverity: 'high',
      cluster: 'Cluster #AST-704'
    },
    {
      handle: '@apex_alpha_leak',
      name: 'Apex Capital Insider',
      role: 'Panic Injection Trigger',
      accountAge: '5 days',
      velocity: '24 posts/hr',
      lexicalOverlap: '89%',
      riskSeverity: 'high',
      cluster: 'Cluster #FIN-401'
    },
    {
      handle: '@vital_frequency_now',
      name: 'Pure Health Paradigm',
      role: 'Pseudo-Medical Vector',
      accountAge: '12 days',
      velocity: '18 posts/hr',
      lexicalOverlap: '84%',
      riskSeverity: 'medium',
      cluster: 'Cluster #MED-109'
    },
    {
      handle: '@lens_unfiltered',
      name: 'Citizen Lens Unfiltered',
      role: 'Synthetic Media Vector',
      accountAge: '14 days',
      velocity: '12 posts/hr',
      lexicalOverlap: '77%',
      riskSeverity: 'medium',
      cluster: 'Cluster #CIV-225'
    },
    {
      handle: '@evance_computational',
      name: 'Dr. Elena Vance',
      role: 'Verified Academic (Control)',
      accountAge: '4 years',
      velocity: '1.2 posts/day',
      lexicalOverlap: '4%',
      riskSeverity: 'low',
      cluster: 'None (Clean Baseline)'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-[#e7e9ea] flex flex-col font-sans selection:bg-[#1d9bf0]/30 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="border-b border-[#2f3336] bg-black/90 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs font-bold text-[#71767b] hover:text-white bg-[#16181c] hover:bg-[#202327] px-3 py-1.5 rounded-full border border-[#2f3336] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to X Simulator</span>
            </Link>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#1d9bf0] flex items-center justify-center text-white shadow-xs">
                <SearchCode className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-base font-bold text-[#e7e9ea] flex items-center gap-2">
                  Forensic Analyst Dashboard
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#16181c] text-[#1d9bf0] border border-[#2f3336] font-semibold">
                    DISINFO BENCHMARK
                  </span>
                </h1>
                <p className="text-xs text-[#71767b]">
                  Telemetry, heuristic verification &amp; coordinated inauthentic behavior analytics
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Analysis Mode Toggle in Dashboard */}
            <div className="flex items-center gap-2 bg-[#16181c] border border-[#2f3336] px-3 py-1.5 rounded-full text-xs">
              <span className="text-[#71767b]">Timeline Overlay:</span>
              <button
                type="button"
                onClick={toggleAnalysisMode}
                className={`font-semibold px-2.5 py-0.5 rounded-full transition-colors cursor-pointer ${
                  isAnalysisMode
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-[#202327] text-[#71767b] hover:text-[#e7e9ea]'
                }`}
              >
                {isAnalysisMode ? 'Analysis Mode: ON' : 'Analysis Mode: OFF'}
              </button>
            </div>

            <div className="hidden md:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-800/60 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Mock Heuristic Engine Active
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Synthetic Platform Notice */}
        <div className="p-3.5 bg-amber-950/30 border border-amber-800/60 rounded-2xl flex items-start gap-3 text-xs text-amber-200">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-amber-300">
              Simulated Research Environment:
            </strong>{' '}
            All metrics, accounts, anomaly clusters, and lexical coordination scores are synthetically generated for model evaluation. No live social media scraping or real-world classification is active.
          </div>
        </div>

        {/* Telemetry Metric KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#16181c] rounded-2xl p-4 border border-[#2f3336] space-y-1">
            <span className="text-xs font-medium text-[#71767b] uppercase tracking-wider block">
              Monitored Signals
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">9</span>
              <span className="text-xs text-[#71767b] font-mono">in active stream</span>
            </div>
            <div className="text-[11px] text-[#71767b] pt-1 flex items-center gap-1">
              <Activity className="w-3 h-3 text-[#1d9bf0]" />
              <span>Full stream calibration</span>
            </div>
          </div>

          <div className="bg-[#16181c] rounded-2xl p-4 border border-[#2f3336] space-y-1">
            <span className="text-xs font-medium text-[#71767b] uppercase tracking-wider block">
              Flagged Anomalies
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-rose-400">5</span>
              <span className="text-xs text-rose-300 font-mono">clusters detected</span>
            </div>
            <div className="text-[11px] text-[#71767b] pt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>55.5% anomaly ratio</span>
            </div>
          </div>

          <div className="bg-[#16181c] rounded-2xl p-4 border border-[#2f3336] space-y-1">
            <span className="text-xs font-medium text-[#71767b] uppercase tracking-wider block">
              Mean Coordination Index
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-300">89%</span>
              <span className="text-xs text-[#71767b] font-mono">temporal overlap</span>
            </div>
            <div className="text-[11px] text-[#71767b] pt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-amber-400" />
              <span>Burst window &lt;90s</span>
            </div>
          </div>

          <div className="bg-[#16181c] rounded-2xl p-4 border border-[#2f3336] space-y-1">
            <span className="text-xs font-medium text-[#71767b] uppercase tracking-wider block">
              Heuristics Triggered
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#1d9bf0]">5</span>
              <span className="text-xs text-[#71767b] font-mono">active mock rules</span>
            </div>
            <div className="text-[11px] text-[#71767b] pt-1 flex items-center gap-1">
              <Terminal className="w-3 h-3 text-[#1d9bf0]" />
              <span>Rules: T-402, A-704, F-88...</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#2f3336] pb-2">
          <button
            onClick={() => setTabOverride('clusters')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'clusters'
                ? 'bg-[#1d9bf0] text-white'
                : 'text-[#71767b] hover:text-white hover:bg-[#16181c]'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Suspicious Clusters ({DETECTION_ACTIVITY_EVENTS.length})</span>
          </button>

          <button
            onClick={() => setTabOverride('accounts')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'accounts'
                ? 'bg-[#1d9bf0] text-white'
                : 'text-[#71767b] hover:text-white hover:bg-[#16181c]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Account Linkage &amp; CIB</span>
          </button>

          <button
            onClick={() => setTabOverride('timeline')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-[#1d9bf0] text-white'
                : 'text-[#71767b] hover:text-white hover:bg-[#16181c]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Campaign Timelines</span>
          </button>

          <button
            onClick={() => setTabOverride('inspector')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'inspector'
                ? 'bg-[#1d9bf0] text-white'
                : 'text-[#71767b] hover:text-white hover:bg-[#16181c]'
            }`}
          >
            <SearchCode className="w-4 h-4" />
            <span>Signal Inspector</span>
          </button>
        </div>

        {/* Tab 1: Suspicious Clusters */}
        {activeTab === 'clusters' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Clusters List */}
            <div className="lg:col-span-1 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#71767b] block px-1">
                Detected Scenario Clusters
              </span>
              <div className="space-y-2">
                {DETECTION_ACTIVITY_EVENTS.map((event) => {
                  const isSelected = event.clusterId === selectedClusterId;
                  return (
                    <div
                      key={event.id}
                      onClick={() => {
                        setSelectedClusterId(event.clusterId);
                        if (event.associatedPostIds.length > 0) {
                          setSelectedPostIdOverride(event.associatedPostIds[0]);
                        }
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#16181c] border-[#1d9bf0] shadow-md ring-1 ring-[#1d9bf0]/50'
                          : 'bg-[#16181c]/70 border-[#2f3336] hover:bg-[#202327]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#e7e9ea]">
                          {event.clusterName}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                            event.riskSeverity === 'high'
                              ? 'bg-rose-950/60 text-rose-300 border border-rose-800'
                              : 'bg-amber-950/60 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {event.riskSeverity} Risk
                        </span>
                      </div>
                      <p className="text-xs text-[#71767b] mt-1 line-clamp-2">
                        {event.notes}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-[#71767b] font-mono mt-2 pt-2 border-t border-[#2f3336]/60">
                        <span>Coord: {Math.round(event.coordinationScore * 100)}%</span>
                        <span>{event.timestamp}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Cluster Deep Breakdown */}
            <div className="lg:col-span-2 bg-[#16181c] rounded-2xl border border-[#2f3336] p-6 space-y-5">
              <div className="flex items-start justify-between pb-4 border-b border-[#2f3336]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#1d9bf0] uppercase">
                      Cluster Analysis
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#202327] text-[#71767b] font-semibold uppercase border border-[#2f3336]">
                      {selectedCluster.patternType}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-[#e7e9ea] mt-1">
                    {selectedCluster.clusterName}
                  </h2>
                  <p className="text-xs text-[#71767b] mt-0.5">
                    Coordinated temporal burst identified across {selectedCluster.matchedCount} synthetic accounts
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {Math.round(selectedCluster.coordinationScore * 100)}%
                  </div>
                  <div className="text-[11px] text-[#71767b] font-mono">
                    Coordination Metric
                  </div>
                </div>
              </div>

              {/* Signals and Summary */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#71767b]">
                  Cluster Forensic Summary
                </h3>
                <p className="text-sm text-[#e7e9ea]/90 leading-relaxed bg-black/60 p-4 rounded-xl border border-[#2f3336]">
                  {selectedCluster.notes}
                </p>
              </div>

              {/* Constituent Posts in this Cluster */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#71767b]">
                  Constituent Signal in Feed
                </h3>
                {selectedCluster.associatedPostIds.map((pId) => {
                  const post = INITIAL_POSTS.find((p) => p.id === pId);
                  if (!post) return null;
                  return (
                    <div
                      key={pId}
                      className="p-4 rounded-xl bg-black/80 border border-[#2f3336] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#e7e9ea]">
                            {post.authorName}
                          </span>
                          <span className="text-xs text-[#71767b]">
                            {post.authorHandle}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedPostIdOverride(post.id);
                            setTabOverride('inspector');
                          }}
                          className="text-xs text-[#1d9bf0] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <span>Inspect Full Telemetry</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-[#e7e9ea]/90 italic">
                        &ldquo;{post.content}&rdquo;
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Action */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <Link
                  href="/"
                  className="px-4 py-2 bg-[#202327] hover:bg-[#2f3336] text-[#e7e9ea] rounded-xl text-xs font-semibold transition-colors border border-[#2f3336]"
                >
                  Locate in X Feed Timeline
                </Link>
                <button
                  onClick={() => {
                    if (selectedCluster.associatedPostIds.length > 0) {
                      setSelectedPostIdOverride(selectedCluster.associatedPostIds[0]);
                      setTabOverride('inspector');
                    }
                  }}
                  className="px-4 py-2 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Inspect Signals &amp; Evidence →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Account Linkage & CIB Matrix */}
        {activeTab === 'accounts' && (
          <div className="bg-[#16181c] rounded-2xl border border-[#2f3336] overflow-hidden">
            <div className="p-4 border-b border-[#2f3336]">
              <h2 className="text-base font-bold text-[#e7e9ea]">
                Coordinated Inauthentic Behavior (CIB) Actor Matrix
              </h2>
              <p className="text-xs text-[#71767b]">
                Synthetic account telemetry tracking account age, burst velocity, and lexical duplication scores.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black text-[#71767b] uppercase tracking-wider text-[11px] border-b border-[#2f3336]">
                  <tr>
                    <th className="py-3 px-4">Account / Handle</th>
                    <th className="py-3 px-4">Assigned Role</th>
                    <th className="py-3 px-4">Account Age</th>
                    <th className="py-3 px-4">Post Velocity</th>
                    <th className="py-3 px-4">Lexical Overlap</th>
                    <th className="py-3 px-4">Associated Cluster</th>
                    <th className="py-3 px-4">Heuristic Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2f3336]/60">
                  {monitoredAccounts.map((acc, index) => (
                    <tr key={index} className="hover:bg-[#202327]/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#e7e9ea]">{acc.name}</div>
                        <div className="text-[11px] text-[#71767b] font-mono">
                          {acc.handle}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#e7e9ea]/90">{acc.role}</td>
                      <td className="py-3.5 px-4 text-[#71767b] font-mono">
                        {acc.accountAge}
                      </td>
                      <td className="py-3.5 px-4 text-[#71767b] font-mono">
                        {acc.velocity}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-300">
                        {acc.lexicalOverlap}
                      </td>
                      <td className="py-3.5 px-4 text-[#71767b]">{acc.cluster}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            acc.riskSeverity === 'high'
                              ? 'bg-rose-950/60 text-rose-300 border border-rose-800'
                              : acc.riskSeverity === 'medium'
                              ? 'bg-amber-950/60 text-amber-300 border border-amber-800'
                              : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                          }`}
                        >
                          {acc.riskSeverity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Campaign Timelines */}
        {activeTab === 'timeline' && (
          <div className="bg-[#16181c] rounded-2xl border border-[#2f3336] p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-[#e7e9ea]">
                Campaign Dissemination Timeline
              </h2>
              <p className="text-xs text-[#71767b]">
                Visualizing temporal bursts and detection latency across synthetic scenario injections.
              </p>
            </div>

            <div className="relative pl-6 border-l-2 border-[#2f3336] space-y-8 my-4">
              {DETECTION_ACTIVITY_EVENTS.map((event) => (
                <div key={event.id} className="relative group">
                  <div
                    className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-black ${
                      event.riskSeverity === 'high' ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                  />
                  <div className="bg-black/80 p-4 rounded-xl border border-[#2f3336] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#e7e9ea]">
                        {event.clusterName}
                      </span>
                      <span className="text-[11px] text-[#71767b] font-mono">
                        {event.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-[#71767b]">{event.notes}</p>
                    <div className="flex items-center gap-4 text-[11px] text-[#71767b] font-mono pt-1">
                      <span>Pattern: {event.patternType}</span>
                      <span>·</span>
                      <span>Coordination: {Math.round(event.coordinationScore * 100)}%</span>
                      <span>·</span>
                      <span>Flagged: {event.matchedCount} signals</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Signal Inspector */}
        {activeTab === 'inspector' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Signals Picker */}
            <div className="lg:col-span-1 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#71767b] block px-1">
                Signals Flagged for Review ({flaggedPosts.length})
              </span>
              <div className="space-y-2">
                {flaggedPosts.map((p) => {
                  const isSelected = p.id === selectedPostId;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPostIdOverride(p.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#16181c] border-[#1d9bf0] shadow-md ring-1 ring-[#1d9bf0]/50'
                          : 'bg-[#16181c]/70 border-[#2f3336] hover:bg-[#202327]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#e7e9ea]">
                          {p.authorName}
                        </span>
                        <span className="text-[10px] text-[#71767b]">{p.timestamp}</span>
                      </div>
                      <p className="text-xs text-[#71767b] mt-1 line-clamp-2">
                        {p.content}
                      </p>
                      {p.detectionFinding && (
                        <div className="text-[10px] text-amber-300 font-mono mt-1.5 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          <span>
                            {p.detectionFinding.badgeLabel} (
                            {Math.round(p.detectionFinding.confidenceScore * 100)}%)
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Signal Forensic Evidence Breakdown */}
            <div className="lg:col-span-2 bg-[#16181c] rounded-2xl border border-[#2f3336] p-6 space-y-5">
              <div className="flex items-start justify-between pb-4 border-b border-[#2f3336]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#1d9bf0] uppercase">
                      Signal Forensic Inspector
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#202327] text-[#71767b] font-mono border border-[#2f3336]">
                      ID: {selectedPost.id}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-[#e7e9ea] mt-1">
                    {selectedPost.authorName} ({selectedPost.authorHandle})
                  </h2>
                </div>

                {selectedPost.detectionFinding && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {Math.round(selectedPost.detectionFinding.confidenceScore * 100)}%
                    </div>
                    <div className="text-[11px] text-[#71767b] font-mono">
                      Synthetic Metric
                    </div>
                  </div>
                )}
              </div>

              {/* Raw Post Text */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#71767b]">
                  Raw Signal Text
                </span>
                <div className="p-4 rounded-xl bg-black border border-[#2f3336] text-sm text-[#e7e9ea] leading-relaxed font-sans whitespace-pre-line">
                  {selectedPost.content}
                </div>
              </div>

              {/* Finding Reasoning */}
              {selectedPost.detectionFinding ? (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#71767b] uppercase tracking-wider">
                      <Terminal className="w-3.5 h-3.5 text-[#1d9bf0]" />
                      <span>Heuristic Rule Triggered</span>
                    </div>
                    <div className="bg-black text-[#1d9bf0] font-mono text-xs p-3 rounded-xl border border-[#2f3336]">
                      {selectedPost.detectionFinding.ruleTriggered}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#71767b]">
                      Fictional Detection Rationale
                    </span>
                    <p className="text-sm text-[#e7e9ea]/90 leading-relaxed bg-[#202327]/40 p-3.5 rounded-xl border border-[#2f3336]">
                      {selectedPost.detectionFinding.reason}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#71767b]">
                      Telemetry Signals Flagged
                    </span>
                    <ul className="space-y-1.5">
                      {selectedPost.detectionFinding.detectedSignals.map((sig, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-xs text-[#e7e9ea]/80 bg-black/60 p-2.5 rounded-lg border border-[#2f3336]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{sig}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-amber-950/30 border border-amber-800/80 rounded-xl text-xs text-amber-200 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      {selectedPost.detectionFinding.disclaimer} This explanation was statically encoded to validate UI triage responsiveness.
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-6 bg-black rounded-xl border border-[#2f3336] text-center text-xs text-[#71767b]">
                  This signal is a control baseline with no anomaly markers triggered.
                </div>
              )}

              {/* Action */}
              <div className="pt-2 flex items-center justify-end">
                <Link
                  href="/"
                  className="px-5 py-2.5 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Social Feed Timeline</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
