"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import UserAvatar from "@/components/UserAvatar";
import { Camera, Settings, LogOut, Shield, Save, X } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [saving, setSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.auth.updateProfile({ name, bio });
      await refreshUser();
      setEditing(false);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error((err as Error).message);
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await api.upload(file, "avatars");
      await api.auth.updateProfile({ avatar: data.url });
      await refreshUser();
      toast.success("Avatar updated!");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.auth.changePassword({ currentPassword, newPassword });
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password changed!");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (!user) return null;

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Profile</h1>
        <button onClick={logout} className="flex items-center gap-1.5 text-zinc-500 hover:text-red-400 text-sm transition-colors lg:hidden">
          <LogOut size={16} /> Logout
        </button>
      </div>

      {/* Desktop: side-by-side, Mobile: stacked */}
      <div className="lg:flex lg:gap-8">
      {/* Profile Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 lg:flex-1">
        <div className="flex flex-col items-center lg:flex-row lg:items-start lg:gap-8">
          <div className="relative mb-4">
            <UserAvatar src={user.avatar} name={user.name} size={80} />
            <input type="file" ref={fileRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 bg-lime-500 text-black rounded-full p-1.5"
            >
              <Camera size={12} />
            </button>
          </div>

          {editing ? (
            <div className="w-full space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-center focus:outline-none focus:border-lime-500"
                placeholder="Your name"
              />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-lime-500 resize-none"
                placeholder="Tell us about your fitness journey..."
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 bg-lime-500 text-black font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-1.5"
                >
                  <Save size={14} /> {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => { setEditing(false); setName(user.name); setBio(user.bio || ""); }}
                  className="px-4 py-2.5 bg-zinc-800 rounded-xl text-sm text-zinc-400"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold mt-1">{user.name}</h2>
              <p className="text-sm text-zinc-500">{user.email}</p>
              {user.bio && <p className="text-sm text-zinc-400 mt-2 text-center">{user.bio}</p>}
              <div className="flex gap-6 mt-4">
                <div className="text-center">
                  <p className="text-lg font-bold">{user.postsCount || 0}</p>
                  <p className="text-xs text-zinc-500">Posts</p>
                </div>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="mt-4 w-full bg-zinc-800 text-white font-medium py-2.5 rounded-xl text-sm hover:bg-zinc-700 transition-colors"
              >
                Edit Profile
              </button>
            </>
          )}
        </div>
      </div>

      {/* Settings — right column on desktop */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden lg:w-[340px] lg:flex-shrink-0 lg:self-start mt-6 lg:mt-0">
        <button
          onClick={() => setShowPasswordForm(!showPasswordForm)}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-sm hover:bg-zinc-800 transition-colors"
        >
          <Settings size={18} className="text-zinc-500" />
          <span>Change Password</span>
        </button>

        {showPasswordForm && (
          <form onSubmit={handleChangePassword} className="px-4 pb-4 space-y-3">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-lime-500"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 6 chars)"
              required
              minLength={6}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-lime-500"
            />
            <button type="submit" className="w-full bg-lime-500 text-black font-semibold py-2.5 rounded-xl text-sm">
              Update Password
            </button>
          </form>
        )}

        {user.role === "admin" && (
          <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3.5 text-sm hover:bg-zinc-800 transition-colors border-t border-zinc-800">
            <Shield size={18} className="text-lime-500" />
            <span>Admin Panel</span>
          </Link>
        )}
      </div>
      </div>
    </div>
  );
}
