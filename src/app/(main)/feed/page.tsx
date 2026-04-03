"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import PostCard from "@/components/PostCard";
import CreatePost, { CreatePostForm } from "@/components/CreatePost";
import Modal from "@/components/Modal";
import UserAvatar from "@/components/UserAvatar";
import { Dumbbell, RefreshCw, PenSquare, Hash, Users, TrendingUp } from "lucide-react";

interface Post {
  id: string;
  body: string;
  image: string | null;
  mediaType: string | null;
  userId: string;
  user: { id: string; name: string; avatar: string | null; bio?: string | null };
  comments: [];
  tags: { id: string; name: string; slug: string }[];
  userReaction: string | null;
  reactionsSummary: Record<string, number>;
  likesCount: number;
  commentsCount: number;
  originalPost?: { id: string; body: string; user: { id: string; name: string; avatar: string | null } } | null;
  createdAt: string;
}

interface Tag { id: string; name: string; slug: string; postsCount: number; }

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [stats, setStats] = useState({ members: 0, posts: 0 });

  const fetchPosts = useCallback(async (cursor?: string) => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (cursor) params.set("cursor", cursor);
      const data = await api.posts.list(params.toString());
      if (cursor) {
        setPosts((prev) => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
      }
      setNextCursor(data.nextCursor);
    } catch {}
    setLoading(false);
    setLoadingMore(false);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    fetchPosts();
    // Load sidebar data
    api.explore.tags().then(setTags).catch(() => {});
    api.explore.stats().then(setStats).catch(() => {});
  }, [fetchPosts]);

  const loadMore = () => {
    if (nextCursor && !loadingMore) {
      setLoadingMore(true);
      fetchPosts(nextCursor);
    }
  };

  const handleDelete = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Dumbbell className="text-lime-500 lg:hidden" size={24} />
          <h1 className="text-xl font-bold">Feed</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="hidden lg:flex items-center gap-2 bg-lime-500 text-black font-semibold text-sm px-4 py-2 rounded-xl hover:bg-lime-400 transition-colors"
          >
            <PenSquare size={16} />
            New Post
          </button>
          <button
            onClick={() => { setLoading(true); fetchPosts(); }}
            className="p-2 text-zinc-500 hover:text-lime-400 transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Desktop: 2-column layout */}
      <div className="lg:flex lg:gap-8">
        {/* Main feed column */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts, people, tags..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-lime-500 transition-colors"
          />

          {/* Mobile: inline create post */}
          <div className="lg:hidden">
            <CreatePost onCreated={() => fetchPosts()} />
          </div>

          {/* Desktop: clickable trigger bar */}
          <div
            className="hidden lg:flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 cursor-pointer hover:border-zinc-700 transition-colors"
            onClick={() => setShowCreateModal(true)}
          >
            {user && <UserAvatar src={user.avatar} name={user.name} size={40} />}
            <span className="text-sm text-zinc-500">Share your workout, progress, or motivation...</span>
          </div>

          {/* Posts */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-lime-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <Dumbbell className="mx-auto text-zinc-700 mb-3" size={48} />
              <p className="text-zinc-500 text-sm">No posts yet. Be the first to share!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onDelete={handleDelete} />
              ))}
              {nextCursor && (
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full py-3 text-sm text-zinc-400 hover:text-lime-400 transition-colors"
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Desktop right sidebar */}
        <div className="hidden lg:block w-[300px] flex-shrink-0 space-y-4 sticky top-6 self-start">
          {/* Stats */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-zinc-400 mb-4 flex items-center gap-1.5">
              <TrendingUp size={14} className="text-lime-500" /> Community
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.members}</p>
                <p className="text-xs text-zinc-500">Members</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.posts}</p>
                <p className="text-xs text-zinc-500">Posts</p>
              </div>
            </div>
          </div>

          {/* Trending Tags */}
          {tags.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-1.5">
                <Hash size={14} className="text-lime-500" /> Trending Tags
              </h3>
              <div className="space-y-2">
                {tags.slice(0, 8).map((tag) => (
                  <div key={tag.id} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300">#{tag.name}</span>
                    <span className="text-xs text-zinc-600">{tag.postsCount} posts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User card */}
          {user && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <UserAvatar src={user.avatar} name={user.name} size={44} />
                <div>
                  <p className="font-semibold text-sm">{user.name}</p>
                  <p className="text-xs text-zinc-500">{user.bio || "No bio yet"}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create post modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Post" size="md">
        <CreatePostForm
          autoExpand
          onCreated={() => { setShowCreateModal(false); fetchPosts(); }}
        />
      </Modal>
    </div>
  );
}
