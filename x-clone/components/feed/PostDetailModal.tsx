'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  Heart,
  Repeat2,
  MessageCircle,
  Share,
  Send,
  AlertTriangle,
  BadgeCheck,
  SearchCode
} from 'lucide-react';
import { Post } from '@/types/feed';
import { useAnalysisMode } from '@/context/AnalysisModeContext';

interface PostDetailModalProps {
  post: Post | null;
  onClose: () => void;
  onLike: (postId: string) => void;
  onRepost: (postId: string) => void;
  onAddReply: (postId: string, replyText: string) => void;
  onOpenDetection: (post: Post) => void;
}

export default function PostDetailModal({
  post,
  onClose,
  onLike,
  onRepost,
  onAddReply,
  onOpenDetection,
}: PostDetailModalProps) {
  const { isAnalysisMode } = useAnalysisMode();
  const [replyInput, setReplyInput] = useState('');

  if (!post) return null;

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim()) return;
    onAddReply(post.id, replyInput.trim());
    setReplyInput('');
  };

  const isLiked = post.userInteractions.isLiked;
  const isReposted = post.userInteractions.isReposted;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[rgba(91,112,131,0.4)] backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-black rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-[#2f3336] flex flex-col max-h-[90vh] text-[#e7e9ea]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2f3336] bg-black sticky top-0 z-10">
          <h3 className="font-bold text-[#e7e9ea] text-[17px]">Post</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-full text-[#71767b] hover:text-[#e7e9ea] hover:bg-[#181818] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable conversation thread */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Main post */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-full ${post.authorAvatarBg} flex items-center justify-center text-white font-bold text-sm`}
                >
                  {post.authorInitials}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-[#e7e9ea] text-[15px] hover:underline cursor-pointer">
                      {post.authorName}
                    </span>
                    {post.isVerified && (
                      <BadgeCheck className="w-4 h-4 text-[#1d9bf0] fill-[#1d9bf0]/20" />
                    )}
                  </div>
                  <span className="text-[14px] text-[#71767b]">{post.authorHandle}</span>
                </div>
              </div>

              {/* Analysis Mode Badge */}
              {isAnalysisMode && post.detectionFinding && (
                <button
                  onClick={() => onOpenDetection(post)}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                    post.detectionFinding.severity === 'high'
                      ? 'bg-rose-950/40 text-rose-300 border-rose-800'
                      : 'bg-amber-950/40 text-amber-300 border-amber-800'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{post.detectionFinding.badgeLabel}</span>
                  <span className="text-[9px] uppercase px-1 rounded bg-[#202327] font-mono text-[#71767b]">
                    DEMO
                  </span>
                </button>
              )}
            </div>

            {/* Post content */}
            <p className="text-[#e7e9ea] text-[17px] leading-relaxed whitespace-pre-line pt-1">
              {post.content}
            </p>

            {/* Media preview (if exists) */}
            {post.media && (
              <div className="rounded-2xl overflow-hidden border border-[#2f3336] bg-[#16181c] max-h-[300px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.media.url}
                  alt={post.media.alt}
                  className="w-full h-auto max-h-[300px] object-cover"
                />
              </div>
            )}

            {/* Simulated Detection Mini-Card (visible ONLY when Analysis Mode is active) */}
            {isAnalysisMode && post.detectionFinding && (
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/80 text-xs text-amber-200 space-y-2">
                <div className="flex items-center justify-between font-semibold text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Simulated Disinformation Telemetry
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenDetection(post)}
                      className="text-[#1d9bf0] hover:underline font-semibold text-[11px] cursor-pointer"
                    >
                      View reasoning
                    </button>
                    <span>·</span>
                    <Link
                      href={`/investigations?signal=${post.id}`}
                      className="text-[#1d9bf0] hover:underline font-semibold text-[11px] flex items-center gap-1"
                    >
                      <SearchCode className="w-3.5 h-3.5" />
                      <span>Investigate in Dashboard</span>
                    </Link>
                  </div>
                </div>
                <p className="text-[#e7e9ea]/90 leading-normal">
                  {post.detectionFinding.reason}
                </p>
                <div className="text-[10px] text-amber-400/90 font-mono">
                  Trigger: {post.detectionFinding.ruleTriggered} (Confidence: {Math.round(post.detectionFinding.confidenceScore * 100)}%)
                </div>
              </div>
            )}

            {/* Timestamp & Views */}
            <div className="flex items-center gap-2 text-[14px] text-[#71767b] py-2 border-y border-[#2f3336]">
              <span>{post.timestamp} ago</span>
              <span>·</span>
              <span>{post.metrics.views || '1.4K'} Views</span>
            </div>

            {/* Engagement Counts Bar */}
            <div className="flex items-center gap-6 py-2 border-b border-[#2f3336] text-[14px] text-[#71767b]">
              <div>
                <strong className="text-[#e7e9ea] font-bold">{post.metrics.reposts}</strong> Reposts
              </div>
              <div>
                <strong className="text-[#e7e9ea] font-bold">{post.metrics.likes}</strong> Likes
              </div>
              <div>
                <strong className="text-[#e7e9ea] font-bold">{post.repliesList.length}</strong> Replies
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-around py-1 text-[#71767b]">
              <button
                className="p-2 rounded-full hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 transition-colors cursor-pointer"
                title="Reply"
              >
                <MessageCircle className="w-5 h-5" />
              </button>

              <button
                onClick={() => onRepost(post.id)}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  isReposted
                    ? 'text-[#00ba7c] bg-[#00ba7c]/10'
                    : 'hover:text-[#00ba7c] hover:bg-[#00ba7c]/10'
                }`}
                title="Repost"
              >
                <Repeat2 className="w-5 h-5" />
              </button>

              <button
                onClick={() => onLike(post.id)}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  isLiked
                    ? 'text-[#f91880] bg-[#f91880]/10'
                    : 'hover:text-[#f91880] hover:bg-[#f91880]/10'
                }`}
                title="Like"
              >
                <Heart
                  className={`w-5 h-5 ${isLiked ? 'fill-[#f91880] text-[#f91880]' : ''}`}
                />
              </button>

              <button
                className="p-2 rounded-full hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 transition-colors cursor-pointer"
                title="Share"
              >
                <Share className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Reply composer */}
          <form
            onSubmit={handleReplySubmit}
            className="flex items-start gap-3 pt-3 border-t border-[#2f3336]"
          >
            <div className="w-9 h-9 rounded-full bg-[#16181c] border border-[#2f3336] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-1">
              LA
            </div>
            <div className="flex-1 space-y-2">
              <textarea
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                placeholder="Post your reply"
                rows={2}
                className="w-full text-[15px] text-[#e7e9ea] placeholder-[#71767b] bg-[#16181c] border border-[#2f3336] rounded-2xl p-3 focus:bg-black focus:outline-hidden focus:border-[#1d9bf0] resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#71767b]">
                  Replying to <span className="text-[#1d9bf0]">{post.authorHandle}</span>
                </span>
                <button
                  type="submit"
                  disabled={!replyInput.trim()}
                  className="px-4 py-1.5 bg-[#1d9bf0] hover:bg-[#1a8cd8] disabled:opacity-50 text-white text-[14px] font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Reply</span>
                </button>
              </div>
            </div>
          </form>

          {/* Replies Thread */}
          <div className="space-y-3 pt-2">
            {post.repliesList.length === 0 ? (
              <p className="text-xs text-[#71767b] italic text-center py-4 bg-[#16181c] rounded-2xl border border-dashed border-[#2f3336]">
                No replies yet. Be the first to reply.
              </p>
            ) : (
              post.repliesList.map((reply) => (
                <div
                  key={reply.id}
                  className="p-3.5 rounded-2xl bg-[#16181c] border border-[#2f3336] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full ${reply.authorAvatarBg} flex items-center justify-center text-white text-[11px] font-bold`}
                      >
                        {reply.authorInitials}
                      </div>
                      <span className="text-[14px] font-bold text-[#e7e9ea]">
                        {reply.authorName}
                      </span>
                      <span className="text-[13px] text-[#71767b]">
                        {reply.authorHandle}
                      </span>
                    </div>
                    <span className="text-[12px] text-[#71767b]">{reply.timestamp}</span>
                  </div>
                  <p className="text-[14px] text-[#e7e9ea] pl-9 leading-relaxed">
                    {reply.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
