"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { T } from "@/lib/tokens";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

type GeoFeature = {
  place_name: string;
  center: [number, number];
  context?: Array<{ id: string; text: string }>;
  text: string;
  address?: string;
  properties?: { address?: string };
};

type AddressAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
};

export function GetStartedAddressAutocomplete({
  value,
  onChange,
  placeholder = "Start typing your address or postcode…",
  autoFocus,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<GeoFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node & { closest?: (s: string) => Element | null };
      if (containerRef.current?.contains(target)) return;
      if (target.closest?.("[data-get-started-address-dropdown]")) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const el = inputRef.current;
    if (open && results.length > 0 && el) {
      const rect = el.getBoundingClientRect();
      setDropdownRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    } else {
      setDropdownRect(null);
    }
  }, [open, results.length]);

  const search = useCallback(async (q: string) => {
    if (!MAPBOX_TOKEN || q.trim().length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_TOKEN}&types=address,postcode,place,locality&country=gb&limit=5&language=en`;
      const res = await fetch(url);
      const data = (await res.json()) as { features?: GeoFeature[] };
      const features = data.features ?? [];
      setResults(features);
      setOpen(features.length > 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void search(val), 300);
  };

  const handleSelect = (feature: GeoFeature) => {
    const full = feature.place_name.trim();
    setQuery(full);
    onChange(full);
    setOpen(false);
    setResults([]);
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <input
        ref={inputRef}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => {
          setFocus(true);
          if (results.length > 0) setOpen(true);
        }}
        onBlur={() => setFocus(false)}
        style={{
          width: "100%",
          height: 46,
          padding: "0 14px",
          borderRadius: 10,
          border: `1px solid ${focus ? T.coral : T.lineStrong}`,
          background: T.white,
          color: T.ink,
          fontFamily: T.sans,
          fontSize: 15,
          outline: "none",
          boxShadow: focus ? `0 0 0 3px ${T.coralTint}` : "none",
          transition: `border-color 120ms ${T.ease}, box-shadow 120ms ${T.ease}`,
        }}
      />
      {!MAPBOX_TOKEN && (
        <p style={{ margin: "8px 0 0", fontSize: 12, color: T.mute }}>Type your full address manually.</p>
      )}
      {open && results.length > 0 && dropdownRect && typeof document !== "undefined" &&
        createPortal(
          <div
            data-get-started-address-dropdown
            style={{
              position: "fixed",
              top: dropdownRect.top,
              left: dropdownRect.left,
              width: dropdownRect.width,
              zIndex: 9999,
              background: T.white,
              border: `1px solid ${T.line}`,
              borderRadius: 10,
              boxShadow: "0 12px 40px -12px rgba(2,0,64,0.25)",
              overflow: "hidden",
            }}
          >
            {results.map((feature, i) => (
              <button
                key={`${feature.place_name}-${i}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(feature)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "12px 14px",
                  border: "none",
                  borderBottom: i < results.length - 1 ? `1px solid ${T.line}` : "none",
                  background: T.white,
                  color: T.ink,
                  fontFamily: T.sans,
                  fontSize: 14,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                {feature.place_name}
              </button>
            ))}
            {loading ? (
              <p style={{ margin: 0, padding: "10px 14px", fontSize: 12, color: T.mute }}>Searching…</p>
            ) : null}
          </div>,
          document.body,
        )}
    </div>
  );
}
