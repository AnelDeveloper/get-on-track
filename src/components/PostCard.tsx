"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle, Repeat2, Share, MoreHorizontal, Trash2, Send } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import { formatDistanceToNow } from "date-fns";
import UserAvatar from "./UserAvatar";

interface Comment {
  id: string;
  body: string;
  userId: string;
  user: { id: string; name: string; avatar: string | null };
  replies?: Comment[];
  createdAt: string;
}

interface Post {
  id: string;
  body: string;
  image: string | null;
  mediaType: string | null;
  userId: string;
  user: { id: string; name: string; avatar: string | null; bio?: string | null };
  comments: Comment[];
  tags: { id: string; name: string; slug: string }[];
  userReaction: string | null;
  reactionsSummary: Record<string, number>;
  likesCount: number;
  commentsCount: number;
  originalPost?: { id: string; body: string; user: { id: string; name: string; avatar: string | null } } | null;
  createdAt: string;
}

const REACTIONS = [
  { key: "like", emoji: "\u2764\ufe0f" },
  { key: "celebrate", emoji: "\ud83c\udf89" },
  { key: "support", emoji: "\ud83d\udcaa" },
  { key: "love", emoji: "\ud83d\ude0d" },
  { key: "insightful", emoji: "\ud83d\udca1" },
  { key: "funny", emoji: "\ud83d\ude02" },
];

export default function PostCard({ post, onDelete, onUpdate }: { post: Post; onDelete?: (id: string) => void; onUpdate?: (post: Post) => void }) {
  const { user } = useAuth();
  const toast = useToast();
  const [showReactions, setShowReactions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [showMenu, setShowMenu] = useState(false);
  const [currentReaction, setCurrentReaction] = useState(post.userReaction);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDeleteComment, setConfirmDeleteComment] = useState<string | null>(null);

  const handleReact = async (reaction: string) => {
    try {
      const data = await api.posts.react(post.id, reaction);
      setCurrentReaction(data.userReaction);
      setLikesCount(data.likesCount);
      setShowReactions(false);
    } catch {}
  };

  const handleComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const comment = await api.posts.comment(post.id, {
        body: commentText,
        parentId: replyTo?.id,
      });
      if (replyTo) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTo.id ? { ...c, replies: [...(c.replies || []), comment] } : c
          )
        );
      } else {
        setComments((prev) => [...prev, comment]);
      }
      setCommentText("");
      setReplyTo(null);
      toast.success("Comment added");
    } catch { toast.error("Failed to add comment"); }
    setSubmitting(false);
  };

  const doDeleteComment = async () => {
    if (!confirmDeleteComment) return;
    try {
      await api.posts.deleteComment(post.id, confirmDeleteComment);
      setComments((prev) => prev.filter((c) => c.id !== confirmDeleteComment).map((c) => ({
        ...c,
        replies: c.replies?.filter((r) => r.id !== confirmDeleteComment),
      })));
      toast.success("Comment deleted");
    } catch { toast.error("Failed to delete comment"); }
    setConfirmDeleteComment(null);
  };

  const doDeletePost = async () => {
    try {
      await api.posts.delete(post.id);
      onDelete?.(post.id);
      toast.success("Post deleted");
    } catch { toast.error("Failed to delete post"); }
    setConfirmDelete(false);
    setShowMenu(false);
  };

  const handleRepost = async () => {
    try {
      await api.posts.repost(post.id);
      toast.success("Reposted!");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <article className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <UserAvatar src={post.user.avatar} name={post.user.name} size={40} />
          <div>
            <p className="font-semibold text-sm">{post.user.name}</p>
            <p className="text-zinc-500 text-xs">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        {user?.id === post.userId && (
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-1 text-zinc-500 hover:text-white">
              <MoreHorizontal size={18} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-zinc-800 rounded-xl border border-zinc-700 shadow-xl z-10 min-w-[140px]">
                <button onClick={() => { setConfirmDelete(true); setShowMenu(false); }} className="flex items-center gap-2 px-4 py-2.5 text-red-400 hover:bg-zinc-700 w-full text-sm rounded-xl">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Repost indicator */}
      {post.originalPost && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-1 text-zinc-500 text-xs mb-2">
            <Repeat2 size={12} /> Reposted from {post.originalPost.user.name}
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/50">
            <p className="text-sm text-zinc-300">{post.originalPost.body}</p>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="px-4 pb-2">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.body}</p>
      </div>

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <span key={tag.id} className="text-xs bg-lime-500/10 text-lime-400 px-2 py-0.5 rounded-full">
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Media */}
      {post.image && (
        <div className="px-4 pb-2">
          {post.mediaType === "video" ? (
            <video src={post.image} controls className="w-full rounded-xl max-h-[400px] object-cover bg-black" />
          ) : (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-800">
              <Image src={post.image} alt="" fill className="object-cover" />
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="px-4 py-1 flex items-center gap-4 text-xs text-zinc-500">
        {likesCount > 0 && <span>{likesCount} reaction{likesCount !== 1 ? "s" : ""}</span>}
        {post.commentsCount > 0 && (
          <button onClick={() => setShowComments(!showComments)} className="hover:text-zinc-300">
            {comments.length} comment{comments.length !== 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-zinc-800 px-2 py-1 flex items-center justify-around">
        <div className="relative">
          <button
            onClick={() => currentReaction ? handleReact(currentReaction) : setShowReactions(!showReactions)}
            onMouseEnter={() => setShowReactions(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              currentReaction ? "text-lime-400" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Heart size={18} fill={currentReaction ? "currentColor" : "none"} />
            <span className="text-xs">{currentReaction ? REACTIONS.find((r) => r.key === currentReaction)?.emoji : "Like"}</span>
          </button>
          {showReactions && (
            <div
              className="absolute bottom-full left-0 mb-1 bg-zinc-800 rounded-full border border-zinc-700 shadow-xl flex gap-0.5 p-1 z-20"
              onMouseLeave={() => setShowReactions(false)}
            >
              {REACTIONS.map((r) => (
                <button
                  key={r.key}
                  onClick={() => handleReact(r.key)}
                  className={`text-lg px-1.5 py-0.5 rounded-full hover:bg-zinc-700 transition-transform hover:scale-125 ${
                    currentReaction === r.key ? "bg-zinc-700" : ""
                  }`}
                  title={r.key}
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <MessageCircle size={18} />
          <span className="text-xs">Comment</span>
        </button>

        <button
          onClick={handleRepost}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <Repeat2 size={18} />
          <span className="text-xs">Repost</span>
        </button>

        <button
          onClick={() => navigator.share?.({ text: post.body, url: `/post/${post.id}` }).catch(() => {})}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <Share size={18} />
          <span className="text-xs">Share</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-zinc-800 px-4 py-3 space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-2">
              <div className="flex gap-2">
                <UserAvatar src={comment.user.avatar} name={comment.user.name} size={28} />
                <div className="flex-1">
                  <div className="bg-zinc-800 rounded-xl px-3 py-2">
                    <p className="text-xs font-semibold">{comment.user.name}</p>
                    <p className="text-sm text-zinc-300">{comment.body}</p>
                  </div>
                  <div className="flex gap-3 mt-1 text-[10px] text-zinc-500">
                    <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                    <button onClick={() => setReplyTo({ id: comment.id, name: comment.user.name })} className="hover:text-lime-400 font-medium">
                      Reply
                    </button>
                    {user?.id === comment.userId && (
                      <button onClick={() => setConfirmDeleteComment(comment.id)} className="hover:text-red-400">Delete</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Replies */}
              {comment.replies?.map((reply) => (
                <div key={reply.id} className="flex gap-2 ml-8">
                  <UserAvatar src={reply.user.avatar} name={reply.user.name} size={24} />
                  <div className="flex-1">
                    <div className="bg-zinc-800/50 rounded-xl px-3 py-2">
                      <p className="text-xs font-semibold">{reply.user.name}</p>
                      <p className="text-sm text-zinc-300">{reply.body}</p>
                    </div>
                    <div className="flex gap-3 mt-1 text-[10px] text-zinc-500">
                      <span>{formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}</span>
                      {user?.id === reply.userId && (
                        <button onClick={() => setConfirmDeleteComment(reply.id)} className="hover:text-red-400">Delete</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Comment input */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              {replyTo && (
                <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                  <span>Replying to {replyTo.name}</span>
                  <button onClick={() => setReplyTo(null)} className="text-red-400">&times;</button>
                </div>
              )}
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleComment()}
                placeholder="Write a comment..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-lime-500"
              />
            </div>
            <button
              onClick={handleComment}
              disabled={!commentText.trim() || submitting}
              className="p-2 bg-lime-500 rounded-full text-black disabled:opacity-40 hover:bg-lime-400 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
      {/* Delete post confirmation */}
      <ConfirmDialog
        open={confirmDelete}
        title="Delete Post"
        message="This post and all its comments will be permanently deleted."
        confirmText="Delete"
        variant="danger"
        onConfirm={doDeletePost}
        onCancel={() => setConfirmDelete(false)}
      />

      {/* Delete comment confirmation */}
      <ConfirmDialog
        open={!!confirmDeleteComment}
        title="Delete Comment"
        message="This comment will be permanently removed."
        confirmText="Delete"
        variant="danger"
        onConfirm={doDeleteComment}
        onCancel={() => setConfirmDeleteComment(null)}
      />
    </article>
  );
}
