"use client";

import { useCallback, useEffect, useState } from "react";
import { displayPartnerRating, type PartnerComplaintDetail } from "@/lib/partner-rating";

export type PartnerRatingMeta = {
  rating: number;
  max: number;
  complaintCount: number;
  pointsLost: number;
  topComplaints: PartnerComplaintDetail[];
  loaded: boolean;
};

export function usePartnerRating(fallbackRating?: number): PartnerRatingMeta & { refresh: () => void } {
  const fallback = displayPartnerRating(fallbackRating);
  const [meta, setMeta] = useState<PartnerRatingMeta>({
    rating: fallback,
    max: 5,
    complaintCount: 0,
    pointsLost: 0,
    topComplaints: [],
    loaded: false,
  });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/partner/rating");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load rating");
      setMeta({
        rating: json.rating ?? fallback,
        max: json.max ?? 5,
        complaintCount: json.complaintCount ?? 0,
        pointsLost: json.pointsLost ?? 0,
        topComplaints: Array.isArray(json.topComplaints) ? json.topComplaints : [],
        loaded: true,
      });
    } catch {
      setMeta((prev) => ({ ...prev, rating: fallback, loaded: true }));
    }
  }, [fallback]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...meta, refresh: load };
}
