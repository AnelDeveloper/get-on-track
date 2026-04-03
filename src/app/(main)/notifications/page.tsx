"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import UserAvatar from "@/components/UserAvatar";
import { Bell, Heart, MessageCircle, Repeat2, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  reaction: string | null;
  readAt: string | null;
  createdAt: string;
  fromUser: { id: string; name: string; avatar: string | null };
  post: { id: string; body: string };
}

const typeIcons: Record<string, typeof Heart> = {
  like: Heart,
  comment: MessageCircle,
  repost: Repeat2,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.notifications.list().then((data) => {
      setNotifications(data.notifications);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    try {
      await api.notifications.markRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-2 border-lime-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Bell className="text-lime-500" size={22} /> Notifications
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs text-lime-400 hover:text-lime-300"
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="mx-auto text-zinc-700 mb-3" size={48} />
          <p className="text-zinc-500 text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((notif) => {
            const Icon = typeIcons[notif.type] || Bell;
            return (
              <Link
                key={notif.id}
                href={`/post/${notif.post.id}`}
                className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                  notif.readAt ? "bg-transparent" : "bg-lime-500/5"
                } hover:bg-zinc-900`}
              >
                <div className="relative">
                  <UserAvatar src={notif.fromUser.avatar} name={notif.fromUser.name} size={40} />
                  <div className="absolute -bottom-1 -right-1 bg-zinc-950 rounded-full p-0.5">
                    <Icon size={12} className={notif.type === "like" ? "text-red-400" : "text-lime-400"} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold">{notif.fromUser.name}</span>{" "}
                    <span className="text-zinc-400">
                      {notif.type === "like" && `reacted ${notif.reaction || ""} to your post`}
                      {notif.type === "comment" && "commented on your post"}
                      {notif.type === "repost" && "reposted your post"}
                    </span>
                  </p>
                  <p className="text-xs text-zinc-600 truncate mt-0.5">{notif.post.body}</p>
                  <p className="text-[10px] text-zinc-600 mt-1">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!notif.readAt && (
                  <div className="w-2 h-2 bg-lime-500 rounded-full mt-2 flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
