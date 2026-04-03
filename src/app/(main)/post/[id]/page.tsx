"use client";

import { useState, useEffect, use } from "react";
import { api } from "@/lib/api";
import PostCard from "@/components/PostCard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.posts.get(id).then((data) => {
      setPost(data);
      setLoading(false);
    }).catch((err) => {
      setError(err.message);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-2 border-lime-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="py-6">
        <Link href="/feed" className="flex items-center gap-2 text-zinc-400 hover:text-white mb-4">
          <ArrowLeft size={18} /> Back to feed
        </Link>
        <p className="text-center text-red-400 py-8">{error || "Post not found"}</p>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-4">
      <Link href="/feed" className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm">
        <ArrowLeft size={18} /> Back to feed
      </Link>
      <PostCard post={post} />
    </div>
  );
}
