"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import Modal from "@/components/Modal";
import PostCard from "@/components/PostCard";
import Image from "next/image";
import {
  TrendingUp, Users, FileText, Hash, X, ChevronLeft, ChevronRight,
  Plus, Trash2, Upload, Pencil, Star, StarOff,
} from "lucide-react";

interface GalleryPhoto {
  id: string;
  image: string;
  caption: string | null;
  isHero: boolean;
  sortOrder: number;
}

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
  originalPost?: null;
  createdAt: string;
}

interface Tag { id: string; name: string; slug: string; postsCount: number; }

export default function ExplorePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [stats, setStats] = useState({ members: 0, posts: 0 });
  const [loading, setLoading] = useState(true);

  // Hero carousel state
  const heroPhotos = photos.filter((p) => p.isHero);
  const galleryPhotos = photos.filter((p) => !p.isHero);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroFade, setHeroFade] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fullscreen viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  // Admin panel
  const [showAdmin, setShowAdmin] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [galleryData, postsData, tagsData, statsData] = await Promise.all([
        fetch("/api/gallery").then((r) => r.json()),
        api.explore.posts(),
        api.explore.tags(),
        api.explore.stats(),
      ]);
      setPhotos(galleryData);
      setPosts(postsData.posts);
      setTags(tagsData);
      setStats(statsData);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-slide hero every 3 seconds
  useEffect(() => {
    if (heroPhotos.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setHeroFade(false);
      setTimeout(() => {
        setHeroIndex((prev) => (prev + 1) % heroPhotos.length);
        setHeroFade(true);
      }, 300);
    }, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [heroPhotos.length]);

  const goHero = (dir: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setHeroFade(false);
    setTimeout(() => {
      setHeroIndex((prev) => (prev + dir + heroPhotos.length) % heroPhotos.length);
      setHeroFade(true);
    }, 200);
  };

  // Fullscreen viewer
  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const viewerNav = (dir: number) => {
    setViewerIndex((prev) => (prev + dir + photos.length) % photos.length);
  };

  // Admin actions
  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadData = await api.upload(file, "posts");
      const token = localStorage.getItem("token");
      const res = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ image: uploadData.url, isHero: false, sortOrder: photos.length }),
      });
      const newPhoto = await res.json();
      if (res.ok) { setPhotos((prev) => [...prev, newPhoto]); toast.success("Photo added"); }
    } catch (err) { toast.error((err as Error).message); }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const confirmDeletePhoto = async () => {
    if (!deleteTarget) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/gallery/${deleteTarget}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setPhotos((prev) => prev.filter((p) => p.id !== deleteTarget));
      toast.success("Photo deleted");
    } catch { toast.error("Failed to delete photo"); }
    setDeleteTarget(null);
  };

  const handleToggleHero = async (photo: GalleryPhoto) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/gallery/${photo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isHero: !photo.isHero }),
      });
      if (res.ok) {
        setPhotos((prev) => prev.map((p) => p.id === photo.id ? { ...p, isHero: !p.isHero } : p));
        toast.success(photo.isHero ? "Removed from hero" : "Added to hero slideshow");
      }
    } catch { toast.error("Update failed"); }
  };

  const handleUpdateCaption = async () => {
    if (!editingPhoto) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/gallery/${editingPhoto.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ caption: editCaption }),
      });
      if (res.ok) {
        setPhotos((prev) => prev.map((p) => p.id === editingPhoto.id ? { ...p, caption: editCaption } : p));
        setEditingPhoto(null);
        toast.success("Caption updated");
      }
    } catch { toast.error("Update failed"); }
  };

  const handleReplaceImage = async (photoId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const uploadData = await api.upload(file, "posts");
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/gallery/${photoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ image: uploadData.url }),
        });
        if (res.ok) {
          const updated = await res.json();
          setPhotos((prev) => prev.map((p) => p.id === photoId ? updated : p));
          toast.success("Image replaced");
        }
      } catch (err) { toast.error((err as Error).message); }
    };
    input.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-2 border-lime-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      {/* ===== HERO CAROUSEL ===== */}
      {heroPhotos.length > 0 && (
        <div className="relative h-[340px] lg:h-[450px] rounded-2xl overflow-hidden group bg-zinc-900">
          {/* Blurred background fill */}
          <div className={`absolute inset-0 transition-opacity duration-300 ${heroFade ? "opacity-100" : "opacity-0"}`}>
            <Image
              src={heroPhotos[heroIndex]?.image || ""}
              alt=""
              fill
              className="object-cover scale-110 blur-2xl opacity-40"
            />
          </div>
          {/* Main image — fully visible */}
          <div
            className={`absolute inset-0 transition-opacity duration-300 cursor-pointer ${heroFade ? "opacity-100" : "opacity-0"}`}
            onClick={() => openViewer(photos.indexOf(heroPhotos[heroIndex]))}
          >
            <Image
              src={heroPhotos[heroIndex]?.image || ""}
              alt={heroPhotos[heroIndex]?.caption || ""}
              fill
              className="object-contain"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

          {/* Caption */}
          {heroPhotos[heroIndex]?.caption && (
            <div className="absolute bottom-4 left-4 right-16">
              <p className="text-sm font-medium drop-shadow-lg">{heroPhotos[heroIndex].caption}</p>
            </div>
          )}

          {/* Dots */}
          {heroPhotos.length > 1 && (
            <div className="absolute bottom-4 right-4 flex gap-1.5">
              {heroPhotos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { if (intervalRef.current) clearInterval(intervalRef.current); setHeroFade(false); setTimeout(() => { setHeroIndex(i); setHeroFade(true); }, 200); }}
                  className={`w-2 h-2 rounded-full transition-all ${i === heroIndex ? "bg-lime-400 w-4" : "bg-white/40"}`}
                />
              ))}
            </div>
          )}

          {/* Nav arrows (show on hover) */}
          {heroPhotos.length > 1 && (
            <>
              <button onClick={() => goHero(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => goHero(1)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight size={18} />
              </button>
            </>
          )}

          {/* Admin edit badge */}
          {isAdmin && (
            <button
              onClick={() => setShowAdmin(!showAdmin)}
              className="absolute top-3 right-3 bg-black/50 backdrop-blur text-white rounded-full p-1.5 hover:bg-lime-500 hover:text-black transition-colors z-10"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
      )}

      {/* ===== GALLERY STRIP ===== */}
      {galleryPhotos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {galleryPhotos.map((photo) => (
            <div
              key={photo.id}
              className="relative w-[72px] h-[96px] lg:w-[100px] lg:h-[130px] rounded-xl overflow-hidden flex-shrink-0 cursor-pointer group/thumb"
              onClick={() => openViewer(photos.indexOf(photo))}
            >
              <Image src={photo.image} alt={photo.caption || ""} fill className="object-cover group-hover/thumb:scale-110 transition-transform duration-200" />
            </div>
          ))}
        </div>
      )}

      {/* ===== ADMIN PHOTO MANAGER ===== */}
      <Modal open={isAdmin && showAdmin} onClose={() => setShowAdmin(false)} title="Manage Photos" size="lg">
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <div className="flex gap-2">
              <input type="file" ref={fileRef} onChange={handleUploadPhoto} accept="image/*" className="hidden" />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 bg-lime-500 text-black text-xs font-semibold px-3 py-1.5 rounded-lg">
                <Plus size={12} /> {uploading ? "Uploading..." : "Add Photo"}
              </button>
            </div>
          </div>

          {/* Edit caption modal */}
          {editingPhoto && (
            <div className="bg-zinc-800 rounded-xl p-3 space-y-2">
              <p className="text-xs text-zinc-400">Edit caption</p>
              <input
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-lime-500"
                placeholder="Photo caption..."
              />
              <div className="flex gap-2">
                <button onClick={handleUpdateCaption} className="bg-lime-500 text-black text-xs font-semibold px-3 py-1.5 rounded-lg">Save</button>
                <button onClick={() => setEditingPhoto(null)} className="text-zinc-500 text-xs px-3 py-1.5">Cancel</button>
              </div>
            </div>
          )}

          {/* Photos grid */}
          <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-3">
            {photos.map((photo) => (
              <div key={photo.id}>
                <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-800">
                  <Image src={photo.image} alt="" fill className="object-cover" />
                  {photo.isHero && (
                    <div className="absolute top-1 left-1 bg-lime-500 text-black text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                      Hero
                    </div>
                  )}
                </div>
                {photo.caption && (
                  <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{photo.caption}</p>
                )}
                {/* Action buttons — always visible */}
                <div className="flex items-center gap-1 mt-1">
                  <button
                    onClick={() => handleToggleHero(photo)}
                    className={`p-1.5 rounded-lg text-[10px] flex items-center gap-0.5 ${photo.isHero ? "bg-lime-500/20 text-lime-400" : "bg-zinc-800 text-zinc-500"}`}
                  >
                    {photo.isHero ? <StarOff size={10} /> : <Star size={10} />}
                  </button>
                  <button
                    onClick={() => handleReplaceImage(photo.id)}
                    className="p-1.5 bg-zinc-800 text-zinc-500 rounded-lg"
                  >
                    <Upload size={10} />
                  </button>
                  <button
                    onClick={() => { setEditingPhoto(photo); setEditCaption(photo.caption || ""); }}
                    className="p-1.5 bg-zinc-800 text-zinc-500 rounded-lg"
                  >
                    <Pencil size={10} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(photo.id)}
                    className="p-1.5 bg-red-500/10 text-red-400 rounded-lg"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* ===== EXPLORE CONTENT ===== */}
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <TrendingUp className="text-lime-500" size={20} /> Explore
        </h2>
      </div>

      {/* Desktop: 2-col layout for stats/tags + posts */}
      <div className="lg:flex lg:gap-8">
        <div className="flex-1 min-w-0 space-y-6">
          {/* Mobile stats */}
          <div className="grid grid-cols-2 gap-3 lg:hidden">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
              <Users className="mx-auto text-lime-500 mb-1" size={20} />
              <p className="text-2xl font-bold">{stats.members}</p>
              <p className="text-xs text-zinc-500">Members</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
              <FileText className="mx-auto text-lime-500 mb-1" size={20} />
              <p className="text-2xl font-bold">{stats.posts}</p>
              <p className="text-xs text-zinc-500">Posts</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-400">Latest Posts</h2>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {posts.length === 0 && (
              <p className="text-center py-8 text-zinc-600 text-sm">No posts to explore yet</p>
            )}
          </div>
        </div>

        {/* Desktop right sidebar */}
        <div className="hidden lg:block w-[300px] flex-shrink-0 space-y-4 sticky top-6 self-start">
          {/* Community stats */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-zinc-400 mb-4 flex items-center gap-1.5">
              <Users size={14} className="text-lime-500" /> Community
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
              <div className="space-y-2.5">
                {tags.map((tag) => (
                  <div key={tag.id} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300">#{tag.name}</span>
                    <span className="text-xs text-zinc-600">{tag.postsCount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* About */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-zinc-400 mb-3">About</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Get On Track is a fitness community where athletes share their journey, track progress, and get results with professional coaching.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile tags (below posts) */}
      {tags.length > 0 && (
        <div className="lg:hidden">
          <h2 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-1.5">
            <Hash size={14} /> Trending Tags
          </h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag.id} className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-full">
                #{tag.name} <span className="text-zinc-600 ml-1">{tag.postsCount}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ===== FULLSCREEN PHOTO VIEWER ===== */}
      {viewerOpen && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col" onClick={() => setViewerOpen(false)}>
          {/* Close button */}
          <div className="absolute top-4 right-4 z-10">
            <button className="bg-white/10 backdrop-blur rounded-full p-2 hover:bg-white/20 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Counter */}
          <div className="absolute top-4 left-4 z-10 text-sm text-white/60">
            {viewerIndex + 1} / {photos.length}
          </div>

          {/* Image */}
          <div className="flex-1 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-full h-full max-w-lg">
              <Image
                src={photos[viewerIndex]?.image || ""}
                alt={photos[viewerIndex]?.caption || ""}
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* Caption */}
          {photos[viewerIndex]?.caption && (
            <div className="text-center pb-4 px-4">
              <p className="text-sm text-white/70">{photos[viewerIndex].caption}</p>
            </div>
          )}

          {/* Navigation */}
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); viewerNav(-1); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur rounded-full p-2 hover:bg-white/20 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); viewerNav(1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur rounded-full p-2 hover:bg-white/20 transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Thumbnail strip */}
          <div className="flex justify-center gap-1.5 pb-6 px-4 overflow-x-auto">
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                onClick={(e) => { e.stopPropagation(); setViewerIndex(i); }}
                className={`relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                  i === viewerIndex ? "border-lime-400 scale-110" : "border-transparent opacity-50"
                }`}
              >
                <Image src={photo.image} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Photo"
        message="This photo will be permanently removed from the gallery. This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmDeletePhoto}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
