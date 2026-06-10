"use client";

// Mapbox map of the partner's jobs — coloured pins by status, fits parent when `fill`.

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { T } from "@/lib/tokens";
import { Icon } from "@/components/ui/primitives";
import type { MyJob } from "@/types";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
const STATUS_COLOR: Record<string, string> = {
  scheduled: T.blue,
  in_progress: T.coral,
  final_check: T.amber,
  completed: T.green,
  cancelled: T.mute,
};

type JobPin = MyJob & { mapLat: number; mapLng: number };

function jobQuery(j: MyJob): string {
  return [j.customer.address?.trim(), j.postcode?.trim()].filter(Boolean).join(", ");
}

async function geocodeJob(j: MyJob): Promise<[number, number] | null> {
  const query = jobQuery(j);
  if (!query || !TOKEN) return null;
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=gb&limit=1&access_token=${TOKEN}`;
    const json = await (await fetch(url)).json();
    const center = json?.features?.[0]?.center as [number, number] | undefined;
    return center ?? null;
  } catch {
    return null;
  }
}

export function JobsMap({
  jobs,
  onOpenJob,
  minHeight = 460,
  fill = false,
}: {
  jobs: MyJob[];
  onOpenJob: (id: string) => void;
  minHeight?: number;
  fill?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const openRef = useRef(onOpenJob);
  openRef.current = onOpenJob;
  const [pins, setPins] = useState<JobPin[]>([]);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const resolved: JobPin[] = [];
      for (const j of jobs) {
        if (typeof j.lat === "number" && typeof j.lng === "number") {
          resolved.push({ ...j, mapLat: j.lat, mapLng: j.lng });
          continue;
        }
        const center = await geocodeJob(j);
        if (center) resolved.push({ ...j, mapLat: center[1], mapLng: center[0] });
      }
      if (!cancelled) setPins(resolved);
    })();
    return () => {
      cancelled = true;
    };
  }, [jobs]);

  useEffect(() => {
    if (!TOKEN || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-0.118, 51.495],
      zoom: 10,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => setMapReady(true));
    mapRef.current = map;

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (pins.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    pins.forEach((j) => {
      const el = document.createElement("button");
      el.setAttribute("aria-label", j.title);
      el.style.cssText =
        "width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;cursor:pointer;box-shadow:0 2px 6px rgba(2,0,64,0.3);padding:0";
      el.style.background = STATUS_COLOR[j.status] ?? T.blue;
      el.addEventListener("click", () => openRef.current(j.id));
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([j.mapLng, j.mapLat])
        .setPopup(new mapboxgl.Popup({ offset: 18, closeButton: false }).setText(`${j.title} · ${j.postcode || ""}`))
        .addTo(map);
      markersRef.current.push(marker);
      bounds.extend([j.mapLng, j.mapLat]);
    });

    if (pins.length === 1) {
      map.flyTo({ center: [pins[0].mapLng, pins[0].mapLat], zoom: 13, duration: 0 });
    } else {
      map.fitBounds(bounds, { padding: 56, maxZoom: 14, duration: 0 });
    }
    map.resize();
  }, [pins, mapReady]);

  const shellStyle = fill
    ? { position: "relative" as const, flex: 1, minHeight: 0, height: "100%", width: "100%" }
    : { position: "relative" as const, minHeight };

  if (!TOKEN) {
    return (
      <div
        style={{
          ...shellStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: T.mute,
          fontSize: 13,
          gap: 8,
          background: T.paper2,
        }}
      >
        <Icon name="map-pin" size={16} color={T.mute} /> Map unavailable — set NEXT_PUBLIC_MAPBOX_TOKEN.
      </div>
    );
  }

  const anyLocated = pins.length > 0;
  return (
    <div style={shellStyle}>
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
      {!anyLocated && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            color: T.slate,
            fontSize: 13,
          }}
        >
          <span style={{ background: "rgba(255,255,255,0.9)", padding: "6px 12px", borderRadius: 8, border: `1px solid ${T.line}` }}>
            {jobs.length === 0 ? "No jobs to show." : "Plotting job locations…"}
          </span>
        </div>
      )}
    </div>
  );
}
