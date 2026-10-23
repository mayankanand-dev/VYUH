'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MessageCircle,
  Repeat2,
  Heart,
  BarChart2,
  Bookmark,
  Share,
  MoreHorizontal,
  BadgeCheck,
  AlertTriangle,
  SearchCode,
  Copy,
  UserX,
  Flag
} from 'lucide-react';
import { Post } from '@/types/feed';
import { useAnalysisMode } from '@/context/AnalysisModeContext';

interface XPostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onRepost: (postId: string) => void;
  onBookmark: (postId: string) => void;
  onOpenDetail: (post: Post) => void;
  onOpenDetection: (post: Post) => void;
  onTagClick?: (tag: string) => void;
}

export default function XPostCard({
  post,
  onLike,
  onRepost,
  onBookmark,
  onOpenDetail,
  onOpenDetection,
  onTagClick,
}: XPostCardProps) {
  const { isAnalysisMode } = useAnalysisMode();
  const [showMenu, setShowMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isLiked = post.userInteractions.isLiked;
  const isReposted = post.userInteractions.isReposted;
  const isBookmarked = post.userInteractions.isBookmarked;
  const finding = post.detectionFinding;

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input')) {
      return;
    }
    onOpenDetail(post);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCopiedLink(true);
    setTimeout(() => {
      setCopiedLink(false);
      setShowMenu(false);
    }, 1500);
  };

  return (
    <article
      onClick={handleCardClick}
      className="border-b border-[#2f3336] px-4 py-3 hover:bg-[rgba(255,255,255,0.03)] transition-colors cursor-pointer bg-black group select-none relative"
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="shrink-0">
          <div
            className={`w-10 h-10 rounded-full ${post.authorAvatarBg} flex items-center justify-center text-white font-bold text-sm`}
          >
            {post.authorInitials}
          </div>
        </div>

        {/* Post Content Column */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2 relative">
            <div className="flex items-center gap-1 min-w-0 flex-wrap text-[15px] leading-snug">
              <span className="font-bold text-[#e7e9ea] hover:underline truncate cursor-pointer">
                {post.authorName}
              </span>
              {post.isVerified && (
                <BadgeCheck className="w-4 h-4 text-[#1d9bf0] fill-[#1d9bf0]/20 shrink-0" />
              )}
              <span className="text-[#71767b] truncate cursor-pointer">
                {post.authorHandle}
              </span>
              <span className="text-[#71767b]">·</span>
              <span className="text-[#71767b] hover:underline cursor-pointer">
                {post.timestamp}
              </span>
              {((post as any).sourceDataset || (post as any).dataMode === 'historical') && (
                <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded font-mono bg-[#16181c] text-[#71767b] border border-[#2f3336] uppercase tracking-wider">
                  {(post as any).sourceDataset === 'russian_ira_tweets'
                    ? 'IRA Troll'
                    : (post as any).sourceDataset === 'farmers_protest_tweets'
                    ? 'Farmers Protest'
                    : 'Historical'}
                </span>
              )}
            </div>

            {/* Three dot menu button */}
            <div className="relative">
              <button
                type="button"
                aria-label="More options"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1.5 rounded-full text-[#71767b] hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {/* Three dot dropdown */}
              {showMenu && (
                <div
                  className="absolute right-0 top-full mt-1 w-56 bg-black rounded-2xl shadow-2xl border border-[#2f3336] py-1.5 z-40 animate-in fade-in text-sm text-[#e7e9ea]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={handleCopy}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#181818] transition-colors text-left cursor-pointer"
                  >
                    <Copy className="w-4 h-4 text-[#71767b]" />
                    <span>{copiedLink ? 'Link Copied!' : 'Copy link to post'}</span>
                  </button>

                  <button
                    onClick={() => setShowMenu(false)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#181818] transition-colors text-left text-[#e7e9ea] cursor-pointer"
                  >
                    <UserX className="w-4 h-4 text-[#71767b]" />
                    <span>Not interested in this</span>
                  </button>
                  <button
                    onClick={() => setShowMenu(false)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#181818] transition-colors text-left text-rose-400 cursor-pointer"
                  >
                    <Flag className="w-4 h-4" />
                    <span>Report post (Mock)</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Post Text */}
          <div className="text-[15px] text-[#e7e9ea] leading-5 pt-1 whitespace-pre-line break-words">
            {post.content}
          </div>

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1.5">
              {post.hashtags.map((tag, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onTagClick) onTagClick(tag);
                  }}
                  className="text-[14px] text-[#1d9bf0] hover:underline cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Media preview (if post includes an image) */}
          {post.media && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-[#2f3336] bg-[#16181c] max-h-[320px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.media.url}
                alt={post.media.alt}
                className="w-full h-auto max-h-[320px] object-cover hover:opacity-95 transition-opacity"
                loading="lazy"
              />
              {post.media.caption && (
                <div className="px-3 py-1.5 text-xs text-[#71767b] bg-[#16181c] border-t border-[#2f3336]">
                  {post.media.caption}
                </div>
              )}
            </div>
          )}

          {/* Optional Analysis Mode Overlay (visible ONLY when Analysis Mode is active) */}
          {isAnalysisMode && finding && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetection(post);
              }}
              className="mt-2.5 p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/60 flex items-center justify-between text-xs text-amber-200 hover:bg-amber-950/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">
                  <strong className="font-semibold text-amber-300">
                    Simulated Anomaly ({Math.round(finding.confidenceScore * 100)}%):
                  </strong>{' '}
                  {finding.badgeLabel} — {finding.ruleTriggered}
                </span>
              </div>
              <span className="text-[11px] text-[#1d9bf0] font-semibold shrink-0 ml-2 hover:underline">
                Inspect Details →
              </span>
            </div>
          )}

          {/* Engagement Icons Row */}
          <div className="flex items-center justify-between mt-3 text-[#71767b] max-w-[425px]">
            {/* Reply */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(post);
              }}
              className="group/reply flex items-center gap-1.5 text-xs hover:text-[#1d9bf0] transition-colors cursor-pointer"
              title="Reply"
            >
              <div className="p-2 rounded-full group-hover/reply:bg-[#1d9bf0]/10 transition-colors">
                <MessageCircle className="w-[18px] h-[18px]" />
              </div>
              <span className="text-[13px]">{post.repliesList.length || post.metrics.replies}</span>
            </button>

            {/* Repost */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRepost(post.id);
              }}
              className={`group/repost flex items-center gap-1.5 text-xs transition-colors cursor-pointer ${
                isReposted ? 'text-[#00ba7c]' : 'hover:text-[#00ba7c]'
              }`}
              title="Repost"
            >
              <div
                className={`p-2 rounded-full transition-colors ${
                  isReposted ? 'bg-[#00ba7c]/10' : 'group-hover/repost:bg-[#00ba7c]/10'
                }`}
              >
                <Repeat2 className="w-[18px] h-[18px]" />
              </div>
              <span className="text-[13px]">{post.metrics.reposts}</span>
            </button>

            {/* Like */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLike(post.id);
              }}
              className={`group/like flex items-center gap-1.5 text-xs transition-colors cursor-pointer ${
                isLiked ? 'text-[#f91880]' : 'hover:text-[#f91880]'
              }`}
              title="Like"
            >
              <div
                className={`p-2 rounded-full transition-colors ${
                  isLiked ? 'bg-[#f91880]/10' : 'group-hover/like:bg-[#f91880]/10'
                }`}
              >
                <Heart
                  className={`w-[18px] h-[18px] ${
                    isLiked ? 'fill-[#f91880] text-[#f91880]' : ''
                  }`}
                />
              </div>
              <span className="text-[13px]">{post.metrics.likes}</span>
            </button>

            {/* Views */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(post);
              }}
              className="group/views flex items-center gap-1.5 text-xs hover:text-[#1d9bf0] transition-colors cursor-pointer"
              title="Views"
            >
              <div className="p-2 rounded-full group-hover/views:bg-[#1d9bf0]/10 transition-colors">
                <BarChart2 className="w-[18px] h-[18px]" />
              </div>
              <span className="text-[13px]">{post.metrics.views || '1.4K'}</span>
            </button>

            {/* Bookmark & Share */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onBookmark(post.id);
                }}
                className={`p-2 rounded-full hover:bg-[#1d9bf0]/10 hover:text-[#1d9bf0] transition-colors cursor-pointer ${
                  isBookmarked ? 'text-[#1d9bf0]' : 'text-[#71767b]'
                }`}
                title="Bookmark"
              >
                <Bookmark
                  className={`w-[18px] h-[18px] ${
                    isBookmarked ? 'fill-[#1d9bf0] text-[#1d9bf0]' : ''
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(e);
                }}
                className="p-2 rounded-full hover:bg-[#1d9bf0]/10 hover:text-[#1d9bf0] transition-colors cursor-pointer text-[#71767b]"
                title="Share"
              >
                <Share className="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
