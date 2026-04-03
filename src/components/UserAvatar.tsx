"use client";

import Image from "next/image";

export default function UserAvatar({ src, name, size = 40 }: { src: string | null; name: string; size?: number }) {
  if (src) {
    return (
      <div className="rounded-full overflow-hidden flex-shrink-0 bg-zinc-800" style={{ width: size, height: size }}>
        <Image src={src} alt={name} width={size} height={size} className="object-cover w-full h-full" />
      </div>
    );
  }

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="rounded-full bg-gradient-to-br from-lime-500 to-emerald-600 flex items-center justify-center flex-shrink-0 font-bold text-black"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}
