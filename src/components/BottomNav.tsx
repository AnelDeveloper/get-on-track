"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ArrowLeftRight, Bell, User } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function BottomNav() {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

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
    { href: "/transformations", icon: ArrowLeftRight, label: "Results" },
    { href: "/notifications", icon: Bell, label: "Alerts", badge: unread },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900/95 backdrop-blur border-t border-zinc-800 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {links.map(({ href, icon: Icon, label, badge }) => {
          const active = pathname === href.split("?")[0];
          return (
            <Link
              key={label}
              href={href}
              className={`flex flex-col items-center py-2 px-3 relative transition-colors ${
                active ? "text-lime-400" : "text-zinc-500"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] mt-0.5">{label}</span>
              {badge ? (
                <span className="absolute -top-0.5 right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {badge > 99 ? "99+" : badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
