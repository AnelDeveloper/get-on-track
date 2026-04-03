"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import Modal from "@/components/Modal";
import Image from "next/image";
import { ArrowLeftRight, Plus, Trash2, X, Upload, Clock, User } from "lucide-react";

interface Transformation {
  id: string;
  clientName: string;
  description: string | null;
  beforeImage: string;
  afterImage: string;
  duration: string | null;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null };
}

export default function TransformationsPage() {
  const { user } = useAuth();
  const [transformations, setTransformations] = useState<Transformation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTransformation, setSelectedTransformation] = useState<Transformation | null>(null);
  const [form, setForm] = useState({
    clientName: "",
    description: "",
    beforeImage: "",
    afterImage: "",
    duration: "",
  });
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/transformations")
      .then((r) => r.json())
      .then(setTransformations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (file: File, type: "before" | "after") => {
    if (type === "before") setUploadingBefore(true);
    else setUploadingAfter(true);
    try {
      const data = await api.upload(file, "posts");
      setForm((prev) => ({
        ...prev,
        [type === "before" ? "beforeImage" : "afterImage"]: data.url,
      }));
    } catch (err) {
      toast.error((err as Error).message);
    }
    if (type === "before") setUploadingBefore(false);
    else setUploadingAfter(false);
  };

  const handleSubmit = async () => {
    if (!form.clientName || !form.beforeImage || !form.afterImage || submitting) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/transformations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTransformations((prev) => [data, ...prev]);
      setForm({ clientName: "", description: "", beforeImage: "", afterImage: "", duration: "" });
      setShowForm(false);
      toast.success("Transformation added!");
    } catch (err) {
      toast.error((err as Error).message);
    }
    setSubmitting(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/transformations/${deleteTarget}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransformations((prev) => prev.filter((t) => t.id !== deleteTarget));
      if (selectedTransformation?.id === deleteTarget) setSelectedTransformation(null);
      toast.success("Transformation deleted");
    } catch { toast.error("Failed to delete"); }
    setDeleteTarget(null);
  };

  const isAdmin = user?.role === "admin";

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-2 border-lime-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ArrowLeftRight className="text-lime-500" size={22} /> Transformations
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Real results from real clients</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-lime-500 text-black px-3 py-2 rounded-xl hover:bg-lime-400 transition-colors text-sm font-medium"
          >
            <Plus size={16} /> Add
          </button>
        )}
      </div>

      {/* Add Transformation Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Transformation" size="md">
        <div className="space-y-4">
          <input
            value={form.clientName}
            onChange={(e) => setForm({ ...form, clientName: e.target.value })}
            placeholder="Client name"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-lime-500"
          />

          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description (optional) - e.g. weight loss journey, muscle gain..."
            rows={2}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-lime-500 resize-none"
          />

          <input
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
            placeholder="Duration (e.g. 12 weeks, 6 months)"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-lime-500"
          />

          {/* Before/After Upload */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-zinc-500 mb-2 text-center">BEFORE</p>
              <input type="file" ref={beforeRef} onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "before")} accept="image/*" className="hidden" />
              {form.beforeImage ? (
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-800">
                  <Image src={form.beforeImage} alt="Before" fill className="object-cover" />
                  <button onClick={() => setForm({ ...form, beforeImage: "" })} className="absolute top-1 right-1 bg-black/60 rounded-full p-1">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => beforeRef.current?.click()}
                  disabled={uploadingBefore}
                  className="w-full aspect-[3/4] border-2 border-dashed border-zinc-700 rounded-xl flex flex-col items-center justify-center gap-2 text-zinc-600 hover:border-lime-500 hover:text-lime-500 transition-colors"
                >
                  <Upload size={20} />
                  <span className="text-xs">{uploadingBefore ? "Uploading..." : "Upload"}</span>
                </button>
              )}
            </div>

            <div>
              <p className="text-xs text-zinc-500 mb-2 text-center">AFTER</p>
              <input type="file" ref={afterRef} onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "after")} accept="image/*" className="hidden" />
              {form.afterImage ? (
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-800">
                  <Image src={form.afterImage} alt="After" fill className="object-cover" />
                  <button onClick={() => setForm({ ...form, afterImage: "" })} className="absolute top-1 right-1 bg-black/60 rounded-full p-1">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => afterRef.current?.click()}
                  disabled={uploadingAfter}
                  className="w-full aspect-[3/4] border-2 border-dashed border-zinc-700 rounded-xl flex flex-col items-center justify-center gap-2 text-zinc-600 hover:border-lime-500 hover:text-lime-500 transition-colors"
                >
                  <Upload size={20} />
                  <span className="text-xs">{uploadingAfter ? "Uploading..." : "Upload"}</span>
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!form.clientName || !form.beforeImage || !form.afterImage || submitting}
            className="w-full bg-lime-500 text-black font-semibold py-3 rounded-xl text-sm disabled:opacity-40 hover:bg-lime-400 transition-colors"
          >
            {submitting ? "Adding..." : "Add Transformation"}
          </button>
        </div>
      </Modal>

      {/* Transformations Grid */}
      {transformations.length === 0 ? (
        <div className="text-center py-16">
          <ArrowLeftRight className="mx-auto text-zinc-700 mb-3" size={48} />
          <p className="text-zinc-500 text-sm">No transformations yet</p>
          {isAdmin && <p className="text-zinc-600 text-xs mt-1">Add your first client transformation above</p>}
        </div>
      ) : (
        <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {transformations.map((t) => (
            <div
              key={t.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
              onClick={() => setSelectedTransformation(selectedTransformation?.id === t.id ? null : t)}
            >
              {/* Before / After Side by Side */}
              <div className="grid grid-cols-2 gap-[2px] bg-zinc-800">
                <div className="relative aspect-[3/4]">
                  <div className="absolute top-2 left-2 z-10 bg-black/70 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider text-red-400">
                    Before
                  </div>
                  <Image src={t.beforeImage} alt="Before" fill className="object-cover" />
                </div>
                <div className="relative aspect-[3/4]">
                  <div className="absolute top-2 right-2 z-10 bg-black/70 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider text-lime-400">
                    After
                  </div>
                  <Image src={t.afterImage} alt="After" fill className="object-cover" />
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-zinc-500" />
                      <h3 className="font-semibold text-sm">{t.clientName}</h3>
                    </div>
                    {t.duration && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-zinc-500">
                        <Clock size={12} />
                        <span>{t.duration}</span>
                      </div>
                    )}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(t.id); }}
                      className="p-2 text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                {t.description && (
                  <p className="text-sm text-zinc-400 mt-2">{t.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen View Modal */}
      {selectedTransformation && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4"
          onClick={() => setSelectedTransformation(null)}
        >
          <button className="absolute top-4 right-4 text-white p-2">
            <X size={24} />
          </button>
          <h3 className="text-lg font-bold mb-2">{selectedTransformation.clientName}</h3>
          {selectedTransformation.duration && (
            <p className="text-sm text-lime-400 mb-4">{selectedTransformation.duration}</p>
          )}
          <div className="grid grid-cols-2 gap-2 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden">
              <div className="absolute top-2 left-2 z-10 bg-red-500/80 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Before</div>
              <Image src={selectedTransformation.beforeImage} alt="Before" fill className="object-cover" />
            </div>
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden">
              <div className="absolute top-2 right-2 z-10 bg-lime-500/80 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">After</div>
              <Image src={selectedTransformation.afterImage} alt="After" fill className="object-cover" />
            </div>
          </div>
          {selectedTransformation.description && (
            <p className="text-sm text-zinc-400 mt-4 text-center max-w-md">{selectedTransformation.description}</p>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Transformation"
        message="This transformation will be permanently removed."
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
