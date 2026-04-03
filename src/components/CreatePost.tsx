"use client";

import { useState, useRef } from "react";
import { ImagePlus, Video, X, Tag, Send } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/Toast";
import UserAvatar from "./UserAvatar";

function CreatePostForm({ onCreated, autoExpand }: { onCreated?: () => void; autoExpand?: boolean }) {
  const { user } = useAuth();
  const toast = useToast();
  const [body, setBody] = useState("");
  const [media, setMedia] = useState<{ url: string; type: string } | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(autoExpand || false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await api.upload(file, "posts");
      setMedia({ url: data.url, type: data.mediaType });
    } catch (err) {
      toast.error((err as Error).message);
    }
    setUploading(false);
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && tags.length < 5 && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const handleSubmit = async () => {
    if (!body.trim() || submitting) return;
    setSubmitting(true);
    try {
      await api.posts.create({
        body,
        tags: tags.length > 0 ? tags : undefined,
        image: media?.url || undefined,
        mediaType: media?.type || undefined,
      });
      setBody("");
      setMedia(null);
      setTags([]);
      setExpanded(autoExpand || false);
      onCreated?.();
      toast.success("Post created!");
    } catch (err) {
      toast.error((err as Error).message);
    }
    setSubmitting(false);
  };

  if (!user) return null;

  return (
    <div>
      <div className="flex gap-3">
        <UserAvatar src={user.avatar} name={user.name} size={40} />
        <div className="flex-1">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onFocus={() => setExpanded(true)}
            placeholder="Share your workout, progress, or motivation..."
            rows={expanded ? 4 : 2}
            maxLength={5000}
            className="w-full bg-transparent resize-none text-sm focus:outline-none placeholder:text-zinc-600 leading-relaxed"
          />
        </div>
      </div>

      {media && (
        <div className="relative mt-3 rounded-xl overflow-hidden bg-zinc-800">
          {media.type === "video" ? (
            <video src={media.url} controls className="w-full max-h-[200px]" />
          ) : (
            <img src={media.url} alt="" className="w-full max-h-[200px] object-cover" />
          )}
          <button onClick={() => setMedia(null)} className="absolute top-2 right-2 bg-black/60 rounded-full p-1">
            <X size={14} />
          </button>
        </div>
      )}

      {expanded && tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {tags.map((tag) => (
            <span key={tag} className="flex items-center gap-1 text-xs bg-lime-500/10 text-lime-400 px-2 py-1 rounded-full">
              #{tag}
              <button onClick={() => setTags(tags.filter((t) => t !== tag))}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {expanded && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-800">
          <input type="file" ref={fileRef} onChange={handleFileUpload} accept="image/*,video/*" className="hidden" />
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="p-2 text-zinc-500 hover:text-lime-400 hover:bg-zinc-800 rounded-lg transition-colors">
            <ImagePlus size={18} />
          </button>
          <button onClick={() => { fileRef.current?.setAttribute("accept", "video/*"); fileRef.current?.click(); }} disabled={uploading} className="p-2 text-zinc-500 hover:text-lime-400 hover:bg-zinc-800 rounded-lg transition-colors">
            <Video size={18} />
          </button>
          <div className="flex items-center gap-1 flex-1">
            <Tag size={14} className="text-zinc-500" />
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
              placeholder="Add tag"
              className="bg-transparent text-xs text-zinc-400 focus:outline-none w-20"
            />
          </div>
          {uploading && <span className="text-xs text-zinc-500">Uploading...</span>}
          <button
            onClick={handleSubmit}
            disabled={!body.trim() || submitting}
            className="ml-auto bg-lime-500 text-black font-semibold text-sm px-4 py-2 rounded-full hover:bg-lime-400 transition-colors disabled:opacity-40 flex items-center gap-1.5"
          >
            <Send size={14} />
            Post
          </button>
        </div>
      )}
    </div>
  );
}

export default function CreatePost({ onCreated }: { onCreated?: () => void }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <CreatePostForm onCreated={onCreated} />
    </div>
  );
}

export { CreatePostForm };
