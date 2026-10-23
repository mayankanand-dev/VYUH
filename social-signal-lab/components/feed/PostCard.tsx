'use client';

import React from 'react';
import {
  Heart,
  Repeat2,
  MessageSquare,
  Share2,
  AlertTriangle,
  BadgeCheck,
  Info
} from 'lucide-react';
import { Post } from '@/types/feed';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onRepost: (postId: string) => void;
  onOpenDetail: (post: Post) => void;
  onOpenDetection: (post: Post) => void;
  onTagClick?: (tag: string) => void;
}

export default function PostCard({
  post,
  onLike,
  onRepost,
  onOpenDetail,
  onOpenDetection,
  onTagClick,
}: PostCardProps) {
  const isLiked = post.userInteractions.isLiked;
  const isReposted = post.userInteractions.isReposted;
  const finding = post.detectionFinding;

  const handleCardClick = (e: React.MouseEvent) => {
    // If user clicked inside an interactive button or badge, don't trigger card modal
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    onOpenDetail(post);
  };

  return (
    <article
      onClick={handleCardClick}
      className="p-4 border-b border-slate-200/80 hover:bg-slate-50/70 transition-colors cursor-pointer bg-white group"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={`w-10 h-10 rounded-full ${post.authorAvatarBg} flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-2xs group-hover:scale-102 transition-transform`}
        >
          {post.authorInitials}
        </div>

        {/* Main Body */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap leading-tight">
              <span className="font-bold text-slate-900 text-sm hover:underline">
                {post.authorName}
              </span>
              {post.isVerified && (
                <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/20 shrink-0" />
              )}
              <span className="text-xs text-slate-500">{post.authorHandle}</span>
              <span className="text-xs text-slate-300">·</span>
              <span className="text-xs text-slate-500 hover:underline">{post.timestamp}</span>
            </div>

            {/* Simulated Detection Badge */}
            {finding && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetection(post);
                }}
                className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-all cursor-pointer shadow-2xs ${
                  finding.severity === 'high'
                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 hover:border-amber-300'
                }`}
                title="Click to view simulated detection breakdown"
              >
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span className="hidden sm:inline">{finding.badgeLabel}</span>
                <span className="sm:hidden">Alert</span>
                <span className="text-[9px] uppercase px-1 rounded bg-black/5 font-mono">DEMO</span>
              </button>
            )}
          </div>

          {/* Post Text */}
          <p className="mt-1.5 text-slate-800 text-sm sm:text-[15px] leading-relaxed whitespace-pre-line break-words">
            {post.content}
          </p>

          {/* Hashtag pills */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {post.hashtags.map((tag, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onTagClick) onTagClick(tag);
                  }}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline py-0.5 cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Inline Subtle Detection Hint for Flagged posts */}
          {finding && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetection(post);
              }}
              className="mt-2.5 p-2 rounded-lg bg-amber-50/50 border border-amber-200/60 flex items-center justify-between text-xs text-amber-900 hover:bg-amber-100/50 transition-colors"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="truncate">
                  <strong className="font-semibold">Simulated Telemetry:</strong> {finding.ruleTriggered}
                </span>
              </div>
              <span className="text-[11px] text-blue-600 font-medium shrink-0 ml-2 hover:underline">
                Inspect Details →
              </span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between mt-3 text-slate-500 max-w-md">
            {/* Reply */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(post);
              }}
              className="flex items-center gap-1.5 group/btn text-xs hover:text-blue-600 transition-colors cursor-pointer"
              aria-label="Replies"
            >
              <div className="p-1.5 rounded-full group-hover/btn:bg-blue-50 transition-colors">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span>{post.repliesList.length || post.metrics.replies}</span>
            </button>

            {/* Repost */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRepost(post.id);
              }}
              className={`flex items-center gap-1.5 group/btn text-xs transition-colors cursor-pointer ${
                isReposted ? 'text-emerald-600 font-semibold' : 'hover:text-emerald-600'
              }`}
              aria-label="Repost"
            >
              <div
                className={`p-1.5 rounded-full transition-colors ${
                  isReposted ? 'bg-emerald-50' : 'group-hover/btn:bg-emerald-50'
                }`}
              >
                <Repeat2 className="w-4 h-4" />
              </div>
              <span>{post.metrics.reposts}</span>
            </button>

            {/* Like */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLike(post.id);
              }}
              className={`flex items-center gap-1.5 group/btn text-xs transition-colors cursor-pointer ${
                isLiked ? 'text-rose-600 font-semibold' : 'hover:text-rose-600'
              }`}
              aria-label="Like"
            >
              <div
                className={`p-1.5 rounded-full transition-colors ${
                  isLiked ? 'bg-rose-50' : 'group-hover/btn:bg-rose-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
              </div>
              <span>{post.metrics.likes}</span>
            </button>

            {/* Share / Details */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(post);
              }}
              className="flex items-center gap-1.5 group/btn text-xs hover:text-blue-600 transition-colors cursor-pointer"
              aria-label="Details"
            >
              <div className="p-1.5 rounded-full group-hover/btn:bg-blue-50 transition-colors">
                <Share2 className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
