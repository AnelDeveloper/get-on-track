"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { FileText, ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

interface LogEntry {
  id: string;
  action: string;
  ipAddress: string | null;
  method: string;
  path: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

export default function AdminLogsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "admin") {
      router.replace("/feed");
      return;
    }
  }, [user, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = search ? `search=${search}` : "";
      api.admin.logs(params).then(setLogs).catch(() => {}).finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const actionColors: Record<string, string> = {
    login: "text-green-400",
    register: "text-blue-400",
    create_post: "text-lime-400",
    delete_post: "text-red-400",
    react: "text-pink-400",
    create_comment: "text-cyan-400",
  };

  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="text-zinc-500 hover:text-white">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <FileText className="text-lime-500" size={22} /> Activity Logs
        </h1>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search logs..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-lime-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-lime-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <p className="text-center py-8 text-zinc-600 text-sm">No activity logs found</p>
      ) : (
        <div className="space-y-1">
          {logs.map((log) => (
            <div key={log.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{log.user.name}</span>
                <span className="text-[10px] text-zinc-600">
                  {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-mono ${actionColors[log.action] || "text-zinc-400"}`}>
                  {log.action}
                </span>
                <span className="text-[10px] text-zinc-700">{log.method} {log.path}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
