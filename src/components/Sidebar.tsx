"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ArrowLeftRight, Bell, User, Dumbbell, Shield, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import ConfirmDialog from "./ConfirmDialog";
import UserAvatar from "./UserAvatar";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [unread, setUnread] = useState(0);
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    api.notifications.unreadCount().then((d) => setUnread(d.count)).catch(() => {});
    const interval = setInterval(() => {
      api.notifications.unreadCount().then((d) => setUnread(d.count)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const links = [
    { href: "/feed", icon: Home, label: "Feed" },
    { href: "/explore", icon: Search, label: "Explore" },
    { href: "/transformations", icon: ArrowLeftRight, label: "Transformations" },
    { href: "/notifications", icon: Bell, label: "Notifications", badge: unread },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-zinc-900/50 border-r border-zinc-800/50 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 pb-4">
        <Link href="/feed" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-lime-500 rounded-xl flex items-center justify-center">
            <Dumbbell className="text-black" size={18} />
          </div>
          <span className="text-lg font-bold tracking-tight">Get On Track</span>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 space-y-1">
        {links.map(({ href, icon: Icon, label, badge }) => {
          const active = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative group ${
                active
                  ? "bg-lime-500/10 text-lime-400"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.5} />
              <span>{label}</span>
              {badge ? (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {badge > 99 ? "99+" : badge}
                </span>
              ) : null}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-lime-500 rounded-r-full" />
              )}
            </Link>
          );
        })}

        {user?.role === "admin" && (
          <>
            <div className="h-px bg-zinc-800/50 my-3" />
            <Link
              href="/admin/users"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                pathname.startsWith("/admin")
                  ? "bg-lime-500/10 text-lime-400"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <Shield size={20} strokeWidth={1.5} />
              <span>Admin Panel</span>
            </Link>
          </>
        )}
      </nav>

      {/* User section */}
      {user && (
        <div className="p-3 border-t border-zinc-800/50">
          <div className="flex items-center gap-3 px-3 py-2">
            <UserAvatar src={user.avatar} name={user.name} size={36} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={() => setShowLogout(true)}
              className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors rounded-lg hover:bg-zinc-800"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showLogout}
        title="Logout"
        message="Are you sure you want to log out?"
        confirmText="Logout"
        variant="warning"
        onConfirm={logout}
        onCancel={() => setShowLogout(false)}
      />
    </aside>
  );
}
