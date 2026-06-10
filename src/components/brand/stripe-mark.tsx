"use client";

import Image from "next/image";

// Official Stripe wordmark — PNG asset for crisp rendering on payout trust badges.

export function StripeMark({ width = 64 }: { width?: number }) {
  const height = Math.round(width * 0.42);
  return (
    <Image
      src="/stripe-wordmark.png"
      alt="Stripe"
      width={width}
      height={height}
      style={{ display: "block", width, height: "auto" }}
      priority
    />
  );
}
