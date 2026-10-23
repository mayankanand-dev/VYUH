'use client';

import React, { useState, useMemo } from 'react';
import FeedHeader from './FeedHeader';
import PostComposer from './PostComposer';
import PostCard from './PostCard';
import PostDetailModal from './PostDetailModal';
import DetectionModal from './DetectionModal';
import { Post } from '@/types/feed';
import { INITIAL_POSTS } from '@/data/mockPosts';
import { Search, RefreshCw } from 'lucide-react';

interface FeedContainerProps {
  searchQuery: string;
  onClearSearch: () => void;
  onTagClick: (tag: string) => void;
}

export default function FeedContainer({
  searchQuery,
  onClearSearch,
  onTagClick,
}: FeedContainerProps) {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [activeTab, setActiveTab] = useState<'all' | 'flagged'>('all');
  const [selectedPostForDetail, setSelectedPostForDetail] = useState<Post | null>(null);
  const [selectedPostForDetection, setSelectedPostForDetection] = useState<Post | null>(null);

  // Toggle Like
  const handleLike = (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          const isLiked = post.userInteractions.isLiked;
          const updatedLikes = isLiked ? post.metrics.likes - 1 : post.metrics.likes + 1;
          const updatedPost = {
            ...post,
            metrics: {
              ...post.metrics,
              likes: updatedLikes,
            },
            userInteractions: {
              ...post.userInteractions,
              isLiked: !isLiked,
            },
          };
          if (selectedPostForDetail?.id === postId) {
            setSelectedPostForDetail(updatedPost);
          }
          return updatedPost;
        }
        return post;
      })
    );
  };

  // Toggle Repost
  const handleRepost = (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          const isReposted = post.userInteractions.isReposted;
          const updatedReposts = isReposted ? post.metrics.reposts - 1 : post.metrics.reposts + 1;
          const updatedPost = {
            ...post,
            metrics: {
              ...post.metrics,
              reposts: updatedReposts,
            },
            userInteractions: {
              ...post.userInteractions,
              isReposted: !isReposted,
            },
          };
          if (selectedPostForDetail?.id === postId) {
            setSelectedPostForDetail(updatedPost);
          }
          return updatedPost;
        }
        return post;
      })
    );
  };

  // Add new post from composer
  const handleAddPost = (
    newPostData: Omit<Post, 'id' | 'timestamp' | 'metrics' | 'userInteractions' | 'repliesList'>
  ) => {
    const newPost: Post = {
      ...newPostData,
      id: `post-${Date.now()}`,
      timestamp: 'Just now',
      metrics: {
        replies: 0,
        reposts: 0,
        likes: 0,
        views: '1',
      },
      userInteractions: {
        isLiked: false,
        isReposted: false,
        isBookmarked: false,
      },
      repliesList: [],
    };

    setPosts([newPost, ...posts]);
  };

  // Add reply to post
  const handleAddReply = (postId: string, replyText: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          const newReply = {
            id: `reply-${Date.now()}`,
            authorName: 'Lead Evaluator',
            authorHandle: '@lab_analyst_01',
            authorInitials: 'LA',
            authorAvatarBg: 'bg-slate-900',
            timestamp: 'Just now',
            content: replyText,
            likes: 0,
            isLiked: false,
          };
          const updatedReplies = [newReply, ...post.repliesList];
          const updatedPost: Post = {
            ...post,
            metrics: {
              ...post.metrics,
              replies: updatedReplies.length,
            },
            repliesList: updatedReplies,
          };
          if (selectedPostForDetail?.id === postId) {
            setSelectedPostForDetail(updatedPost);
          }
          return updatedPost;
        }
        return post;
      })
    );
  };

  // Filtered posts calculation
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Tab filter: flagged vs all
      if (activeTab === 'flagged' && !post.detectionFinding) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesContent = post.content.toLowerCase().includes(query);
        const matchesName = post.authorName.toLowerCase().includes(query);
        const matchesHandle = post.authorHandle.toLowerCase().includes(query);
        const matchesHashtag = post.hashtags?.some((h) => h.toLowerCase().includes(query));
        const matchesRule = post.detectionFinding?.ruleTriggered.toLowerCase().includes(query);

        if (!matchesContent && !matchesName && !matchesHandle && !matchesHashtag && !matchesRule) {
          return false;
        }
      }

      return true;
    });
  }, [posts, activeTab, searchQuery]);

  const flaggedCount = useMemo(() => {
    return posts.filter((p) => p.detectionFinding !== undefined).length;
  }, [posts]);

  return (
    <main className="w-full min-h-screen bg-white">
      {/* Sticky Header with All/Flagged tabs */}
      <FeedHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalCount={posts.length}
        flaggedCount={flaggedCount}
        searchQuery={searchQuery}
        onClearSearch={onClearSearch}
      />

      {/* Post Composer */}
      <PostComposer onAddPost={handleAddPost} />

      {/* Feed list */}
      <div className="divide-y divide-slate-100">
        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">
              No matching synthetic signals
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `No signals matched "${searchQuery}". Try searching for another keyword or hashtag.`
                : 'No posts currently match the selected filter category.'}
            </p>
            {(searchQuery || activeTab === 'flagged') && (
              <button
                onClick={() => {
                  onClearSearch();
                  setActiveTab('all');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onRepost={handleRepost}
              onOpenDetail={(p) => setSelectedPostForDetail(p)}
              onOpenDetection={(p) => setSelectedPostForDetection(p)}
              onTagClick={onTagClick}
            />
          ))
        )}
      </div>

      {/* Post Detail & Reply Modal */}
      <PostDetailModal
        post={selectedPostForDetail}
        onClose={() => setSelectedPostForDetail(null)}
        onLike={handleLike}
        onRepost={handleRepost}
        onAddReply={handleAddReply}
        onOpenDetection={(p) => setSelectedPostForDetection(p)}
      />

      {/* Detection Explanation Modal */}
      <DetectionModal
        post={selectedPostForDetection}
        onClose={() => setSelectedPostForDetection(null)}
      />
    </main>
  );
}
