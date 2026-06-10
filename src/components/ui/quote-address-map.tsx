"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapBackground } from "@/components/ui/map-background";
import { T } from "@/lib/tokens";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
const LONDON: [number, number] = [-0.118, 51.495];
/** Full-colour street map (not the light monochrome style). */
const MAP_STYLE = "mapbox://styles/mapbox/streets-v12";

export function QuoteAddressMap({
  address,
  postcode,
  lat,
  lng,
  minHeight = 200,
  maxHeight = 320,
  compact = false,
  fill = false,
  interactive = true,
  addressOverlay,
  className,
}: {
  address?: string;
  postcode?: string;
  lat?: number;
  lng?: number;
  minHeight?: number;
  maxHeight?: number;
  compact?: boolean;
  /** Stretch to 100% of parent height (e.g. job drawer side panel). */
  fill?: boolean;
  interactive?: boolean;
  /** Short line shown over the map bottom (e.g. postcode). */
  addressOverlay?: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [ready, setReady] = useState(false);

  const query = [address?.trim(), postcode?.trim()].filter(Boolean).join(", ") || postcode?.trim() || "";
  const hasCoords = typeof lat === "number" && typeof lng === "number" && !Number.isNaN(lat) && !Number.isNaN(lng);

  const placeMarker = (center: [number, number], map: mapboxgl.Map) => {
    map.flyTo({ center, zoom: compact ? 13.5 : 14, duration: hasCoords ? 0 : 800 });
    markerRef.current?.remove();
    const el = document.createElement("div");
    el.style.cssText = `width:${compact ? 11 : 14}px;height:${compact ? 11 : 14}px;border-radius:50%;background:${T.coral};border:2.5px solid #fff;box-shadow:0 2px 8px rgba(2,0,64,0.25);`;
    markerRef.current = new mapboxgl.Marker({ element: el }).setLngLat(center).addTo(map);
  };

  useEffect(() => {
    if (!TOKEN || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: hasCoords ? [lng!, lat!] : LONDON,
      zoom: hasCoords ? (compact ? 13.5 : 14) : 11,
      attributionControl: false,
      interactive,
    });
    if (interactive && !compact) {
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    }
    map.on("load", () => {
      setReady(true);
      if (hasCoords) placeMarker([lng!, lat!], map);
    });
    mapRef.current = map;

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!TOKEN || !ready) return;
    const map = mapRef.current;
    if (!map) return;

    if (hasCoords) {
      placeMarker([lng!, lat!], map);
      return;
    }

    if (!query) return;
    let cancelled = false;
    (async () => {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=gb&limit=1&access_token=${TOKEN}`;
        const json = await (await fetch(url)).json();
        const feature = json?.features?.[0];
        const center = feature?.center as [number, number] | undefined;
        if (!center || cancelled || !mapRef.current) return;
        placeMarker(center, mapRef.current);
      } catch {
        /* geocode failed — map stays at default */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, ready, lat, lng]);

  const shellStyle = fill
    ? {
        width: "100%",
        height: "100%",
        minHeight: minHeight,
        flex: 1,
        borderRadius: 0,
        overflow: "hidden" as const,
        border: "none",
        background: T.paper2,
        position: "relative" as const,
      }
    : {
        width: "100%",
        aspectRatio: compact ? "21 / 8" : "16 / 9",
        minHeight: compact ? Math.min(minHeight, 100) : minHeight,
        maxHeight: compact ? Math.min(maxHeight, 140) : maxHeight,
        borderRadius: compact ? 8 : 12,
        overflow: "hidden" as const,
        border: `1px solid ${T.line}`,
        background: T.paper2,
        position: "relative" as const,
      };

  const overlayText = addressOverlay ?? (compact ? postcode || query : "");

  if (!TOKEN) {
    return (
      <div className={className} style={shellStyle}>
        <MapBackground />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", padding: compact ? 8 : 12 }}>
          <span
            style={{
              fontSize: compact ? 11 : 12,
              color: T.slate,
              background: "rgba(255,255,255,0.92)",
              padding: compact ? "4px 8px" : "6px 10px",
              borderRadius: 8,
            }}
          >
            {overlayText || "Address not available"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={shellStyle}>
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
      {overlayText ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: compact ? "6px 8px" : "8px 10px",
            background: "linear-gradient(transparent, rgba(2,0,64,0.55))",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              fontSize: compact ? 11 : 12,
              fontWeight: 500,
              color: "#fff",
              textShadow: "0 1px 2px rgba(0,0,0,0.35)",
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {overlayText}
          </span>
        </div>
      ) : null}
    </div>
  );
}
