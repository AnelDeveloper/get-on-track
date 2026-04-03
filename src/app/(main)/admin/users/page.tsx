"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import UserAvatar from "@/components/UserAvatar";
import Modal from "@/components/Modal";
import { Shield, Search, Trash2, UserPlus, ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  bio: string | null;
  postsCount: number;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "user" });
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (user?.role !== "admin") {
      router.replace("/feed");
      return;
    }
    fetchUsers();
  }, [user, router]);

  const fetchUsers = async () => {
    try {
      const params = search ? `search=${search}` : "";
      const data = await api.admin.users(params);
      setUsers(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const confirmDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      await api.admin.deleteUser(deleteTarget);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget));
      toast.success("User deleted");
    } catch (err) {
      toast.error((err as Error).message);
    }
    setDeleteTarget(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.admin.createUser(newUser);
      setShowCreate(false);
      setNewUser({ name: "", email: "", password: "", role: "user" });
      fetchUsers();
      toast.success("User created");
    } catch (err) {
      toast.error((err as Error).message);
    }
    setCreating(false);
  };

  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/profile" className="text-zinc-500 hover:text-white">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Shield className="text-lime-500" size={22} /> Admin - Users
        </h1>
      </div>

      <div className="flex gap-2">
        <Link href="/admin/logs" className="flex items-center gap-1.5 bg-zinc-800 text-zinc-400 px-3 py-2 rounded-xl text-sm hover:bg-zinc-700">
          <FileText size={14} /> Logs
        </Link>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 bg-lime-500 text-black px-3 py-2 rounded-xl text-sm font-medium"
        >
          <UserPlus size={14} /> Add User
        </button>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add New User" size="sm">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Name</label>
            <input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="Full name" required className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-lime-500" />
          </div>
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Email</label>
            <input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="user@email.com" type="email" required className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-lime-500" />
          </div>
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Password</label>
            <input value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Min 6 characters" type="password" required className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-lime-500" />
          </div>
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Role</label>
            <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-lime-500">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" disabled={creating} className="w-full bg-lime-500 text-black font-semibold py-2.5 rounded-xl text-sm hover:bg-lime-400 transition-colors">
            {creating ? "Creating..." : "Create User"}
          </button>
        </form>
      </Modal>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-lime-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-lime-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {users.map((u) => (
            <div key={u.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
              <UserAvatar src={u.avatar} name={u.name} size={40} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{u.name}</p>
                <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                <div className="flex gap-2 mt-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${u.role === "admin" ? "bg-lime-500/10 text-lime-400" : "bg-zinc-800 text-zinc-500"}`}>
                    {u.role}
                  </span>
                  <span className="text-[10px] text-zinc-600">{u.postsCount} posts</span>
                </div>
              </div>
              {u.id !== user?.id && (
                <button onClick={() => setDeleteTarget(u.id)} className="p-2 text-zinc-600 hover:text-red-400">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete User"
        message="This will permanently delete the user and all their posts, comments, and data."
        confirmText="Delete User"
        variant="danger"
        onConfirm={confirmDeleteUser}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
