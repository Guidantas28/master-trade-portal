"use client";

// TopBar — ported from shell.jsx. Title/breadcrumb, search, notifications, actions.

import { Fragment, useState, type ReactNode } from "react";
import { T } from "@/lib/tokens";
import { Icon, IconButton } from "@/components/ui/primitives";

export function TopBar({
  title,
  breadcrumb = [],
  actions,
}: {
  title: ReactNode;
  breadcrumb?: string[];
  actions?: ReactNode;
}) {
  const [search, setSearch] = useState("");
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "14px 24px",
        borderBottom: `1px solid ${T.line}`,
        background: T.white,
        flexShrink: 0,
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        {breadcrumb.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: T.mute }}>
            {breadcrumb.map((b, i) => (
              <Fragment key={i}>
                {i > 0 && <Icon name="chevron-right" size={12} />}
                <span style={i === breadcrumb.length - 1 ? { color: T.ink, fontWeight: 500 } : undefined}>
                  {b}
                </span>
              </Fragment>
            ))}
          </div>
        )}
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: -0.3, color: T.navy }}>{title}</div>
      </div>

      {/* Search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 10px",
          height: 36,
          border: `1px solid ${T.line}`,
          borderRadius: 8,
          width: 280,
          color: T.mute,
          fontSize: 13,
          background: T.white,
        }}
      >
        <Icon name="search" size={14} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search jobs, leads, customers…"
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: T.sans,
            fontSize: 13,
            color: T.ink,
            minWidth: 0,
          }}
        />
        <span
          style={{
            fontFamily: T.mono,
            fontSize: 10.5,
            padding: "1px 5px",
            borderRadius: 4,
            background: T.paper,
            border: `1px solid ${T.line}`,
            color: T.mute,
          }}
        >
          ⌘K
        </span>
      </div>

      <IconButton icon="bell" title="Notifications" style={{ position: "relative" }} />

      {actions}
    </header>
  );
}
