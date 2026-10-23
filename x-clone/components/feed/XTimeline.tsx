'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { SlidersHorizontal, Sparkles, Search, RefreshCw } from 'lucide-react';
import { Post } from '@/types/feed';
import { INITIAL_POSTS } from '@/data/mockPosts';
import { CANONICAL_FIXTURE_POSTS, CanonicalPost } from '@/data/canonicalPosts';
import XPostComposer from './XPostComposer';
import XPostCard from './XPostCard';
import PostDetailModal from './PostDetailModal';
import DetectionModal from './DetectionModal';
import { useAnalysisMode } from '@/context/AnalysisModeContext';

export type DataSource = 'all' | 'farmers' | 'ira' | 'simulated';

interface XTimelineProps {
  searchQuery: string;
  onClearSearch: () => void;
  onTagClick: (tag: string) => void;
}

export default function XTimeline({
  searchQuery,
  onClearSearch,
  onTagClick,
}: XTimelineProps) {
  const { isAnalysisMode, setAnalysisMode } = useAnalysisMode();
  const [dataSource, setDataSource] = useState<DataSource>('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [totalPostsCount, setTotalPostsCount] = useState<number>(30000);
  const [timelineTab, setTimelineTab] = useState<'forYou' | 'following'>('forYou');
  const [selectedPostForDetail, setSelectedPostForDetail] = useState<Post | null>(null);
  const [selectedPostForDetection, setSelectedPostForDetection] = useState<Post | null>(null);
  const observerTarget = React.useRef<HTMLDivElement | null>(null);

  // Fetch live feed from SQLite server
  React.useEffect(() => {
    let ignore = false;
    const fetchFeed = async () => {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      try {
        const params = new URLSearchParams({
          source: dataSource,
          page: String(page),
          limit: '40',
        });
        if (searchQuery.trim()) params.set('q', searchQuery.trim());
        const res = await fetch(`/api/posts?${params.toString()}`);
        const data = await res.json();
        if (!ignore && data.success && Array.isArray(data.posts)) {
          setTotalPostsCount(data.total || 0);
          setPosts((prevPosts) => {
            if (page === 1) return data.posts;
            const existingIds = new Set(prevPosts.map((p) => p.id));
            const newPosts = data.posts.filter((p: Post) => !existingIds.has(p.id));
            return [...prevPosts, ...newPosts];
          });
          setHasMore(data.posts.length === 40 && page * 40 < (data.total || 0));
        }
      } catch (err) {
        console.error('Failed to fetch from x-clone SQLite API:', err);
      } finally {
        if (!ignore) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    };
    fetchFeed();
    return () => {
      ignore = true;
    };
  }, [dataSource, searchQuery, page]);

  // Infinite scroll observer
  React.useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: '600px' }
    );

    observer.observe(target);
    return () => {
      observer.unobserve(target);
    };
  }, [hasMore, isLoading, isLoadingMore]);

  const handleSourceChange = (source: DataSource) => {
    if (source !== dataSource) {
      setDataSource(source);
      setPage(1);
      setPosts([]);
    }
  };

  // Toggle Like
  const handleLike = (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          const isLiked = post.userInteractions.isLiked;
          const updatedLikes = isLiked ? post.metrics.likes - 1 : post.metrics.likes + 1;
          const updatedPost = {
            ...post,
            metrics: { ...post.metrics, likes: updatedLikes },
            userInteractions: { ...post.userInteractions, isLiked: !isLiked },
          };
          if (selectedPostForDetail?.id === postId) setSelectedPostForDetail(updatedPost);
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
            metrics: { ...post.metrics, reposts: updatedReposts },
            userInteractions: { ...post.userInteractions, isReposted: !isReposted },
          };
          if (selectedPostForDetail?.id === postId) setSelectedPostForDetail(updatedPost);
          return updatedPost;
        }
        return post;
      })
    );
  };

  // Toggle Bookmark
  const handleBookmark = (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          const isBookmarked = post.userInteractions.isBookmarked;
          const updatedBookmarks = (post.metrics.bookmarks || 0) + (isBookmarked ? -1 : 1);
          const updatedPost = {
            ...post,
            metrics: { ...post.metrics, bookmarks: updatedBookmarks },
            userInteractions: { ...post.userInteractions, isBookmarked: !isBookmarked },
          };
          if (selectedPostForDetail?.id === postId) setSelectedPostForDetail(updatedPost);
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
        bookmarks: 0,
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

  // Add reply to thread
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
            metrics: { ...post.metrics, replies: updatedReplies.length },
            repliesList: updatedReplies,
          };
          if (selectedPostForDetail?.id === postId) setSelectedPostForDetail(updatedPost);
          return updatedPost;
        }
        return post;
      })
    );
  };

  // Filtered posts calculation
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Tab filter: "For you" vs "Following"
      if (timelineTab === 'following') {
        if (!post.isFollowingAuthor && post.authorHandle !== '@lab_analyst_01') {
          return false;
        }
      }
      return true;
    });
  }, [posts, timelineTab]);

  return (
    <main className="w-full max-w-[600px] min-h-screen bg-black text-[#e7e9ea]">
      {/* Sticky Top Header */}
      <div className="sticky top-0 bg-black/75 backdrop-blur-md z-30 border-b border-[#2f3336]">
        {/* Top line with Home & settings icon */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <h1 className="text-xl font-bold text-[#e7e9ea] tracking-tight">Home</h1>
          <button
            type="button"
            aria-label="Timeline settings"
            className="p-2 rounded-full hover:bg-[#181818] text-[#e7e9ea] transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 stroke-[2]" />
          </button>
        </div>

        {/* For you & Following Tabs */}
        <div className="grid grid-cols-2 text-center select-none border-t border-[#2f3336]/40">
          <button
            onClick={() => setTimelineTab('forYou')}
            className="py-3.5 relative flex items-center justify-center hover:bg-[#181818] transition-colors cursor-pointer"
          >
            <span
              className={`text-[15px] ${
                timelineTab === 'forYou' ? 'font-bold text-[#e7e9ea]' : 'font-medium text-[#71767b]'
              }`}
            >
              For you
            </span>
            {timelineTab === 'forYou' && (
              <span className="absolute bottom-0 h-1 w-14 bg-[#1d9bf0] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setTimelineTab('following')}
            className="py-3.5 relative flex items-center justify-center hover:bg-[#181818] transition-colors cursor-pointer"
          >
            <span
              className={`text-[15px] ${
                timelineTab === 'following' ? 'font-bold text-[#e7e9ea]' : 'font-medium text-[#71767b]'
              }`}
            >
              Following
            </span>
            {timelineTab === 'following' && (
              <span className="absolute bottom-0 h-1 w-16 bg-[#1d9bf0] rounded-full" />
            )}
          </button>
        </div>

        {/* Dataset Source Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 overflow-x-auto border-t border-[#2f3336]/40 no-scrollbar text-xs bg-[#080808]">
          <span className="text-[#71767b] shrink-0 font-medium text-[11px] uppercase tracking-wider">Dataset:</span>
          <button
            onClick={() => handleSourceChange('all')}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer shrink-0 ${
              dataSource === 'all'
                ? 'bg-[#1d9bf0] text-white'
                : 'bg-[#181818] text-[#71767b] hover:text-[#e7e9ea] hover:bg-[#202020]'
            }`}
          >
            All Canonical (30,000)
          </button>
          <button
            onClick={() => handleSourceChange('farmers')}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer shrink-0 ${
              dataSource === 'farmers'
                ? 'bg-[#1d9bf0] text-white'
                : 'bg-[#181818] text-[#71767b] hover:text-[#e7e9ea] hover:bg-[#202020]'
            }`}
          >
            Farmers Protest (15,000)
          </button>
          <button
            onClick={() => handleSourceChange('ira')}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer shrink-0 ${
              dataSource === 'ira'
                ? 'bg-[#1d9bf0] text-white'
                : 'bg-[#181818] text-[#71767b] hover:text-[#e7e9ea] hover:bg-[#202020]'
            }`}
          >
            Russian IRA Trolls (15,000)
          </button>
          <button
            onClick={() => handleSourceChange('simulated')}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer shrink-0 ${
              dataSource === 'simulated'
                ? 'bg-[#1d9bf0] text-white'
                : 'bg-[#181818] text-[#71767b] hover:text-[#e7e9ea] hover:bg-[#202020]'
            }`}
          >
            Coordinated Bots (15,000)
          </button>
        </div>

        {/* Search filter indicator */}
        {searchQuery && (
          <div className="px-4 py-2 bg-[#16181c] border-t border-[#2f3336] flex items-center justify-between text-xs text-[#e7e9ea]">
            <span>
              Searching for: <strong className="text-[#1d9bf0]">&ldquo;{searchQuery}&rdquo;</strong>
            </span>
            <button
              onClick={onClearSearch}
              className="text-[#1d9bf0] font-semibold underline text-xs cursor-pointer"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>

      {/* Post Composer */}
      <XPostComposer onAddPost={handleAddPost} />

      {/* Posts Timeline */}
      <div className="divide-y divide-[#2f3336]">
        {filteredPosts.length === 0 && !isLoading ? (
          <div className="p-12 text-center space-y-3 bg-black">
            <div className="w-12 h-12 rounded-full bg-[#16181c] text-[#71767b] mx-auto flex items-center justify-center border border-[#2f3336]">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#e7e9ea]">No posts match your search</h3>
            <p className="text-xs text-[#71767b] max-w-sm mx-auto">
              {searchQuery
                ? `No posts matched "${searchQuery}". Try searching for another keyword or hashtag.`
                : 'No posts from accounts you follow. Switch to "For you" to see all posts.'}
            </p>
            {(searchQuery || timelineTab === 'following') && (
              <button
                onClick={() => {
                  onClearSearch();
                  setTimelineTab('forYou');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-[#e7e9ea] border border-[#536471] hover:bg-[#181818] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Timeline
              </button>
            )}
          </div>
        ) : (
          filteredPosts.map((post) => (
            <XPostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onRepost={handleRepost}
              onBookmark={handleBookmark}
              onOpenDetail={(p) => setSelectedPostForDetail(p)}
              onOpenDetection={(p) => setSelectedPostForDetection(p)}
              onTagClick={onTagClick}
            />
          ))
        )}

        {/* Infinite Scroll Sentinel & Load More Indicator */}
        <div ref={observerTarget} className="py-6 flex flex-col items-center justify-center text-center px-4">
          {isLoadingMore || isLoading ? (
            <div className="flex items-center gap-2.5 text-xs text-[#71767b] py-3">
              <span className="w-4 h-4 border-2 border-[#1d9bf0] border-t-transparent rounded-full animate-spin" />
              <span>Streaming next batch from SQLite ({posts.length} of {totalPostsCount.toLocaleString()} loaded)...</span>
            </div>
          ) : hasMore ? (
            <button
              onClick={() => setPage((p) => p + 1)}
              className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#1d9bf0] bg-[#16181c] hover:bg-[#1d9bf0]/10 border border-[#2f3336] transition-colors cursor-pointer"
            >
              Load more posts (Showing {posts.length.toLocaleString()} of {totalPostsCount.toLocaleString()})
            </button>
          ) : posts.length > 0 ? (
            <div className="py-4 text-xs text-[#71767b] border-t border-[#2f3336]/40 w-full">
              ✓ All {totalPostsCount.toLocaleString()} posts loaded from SQLite archive.
            </div>
          ) : null}
        </div>
      </div>

      {/* Post Detail Modal */}
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
