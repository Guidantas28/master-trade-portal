"use client";

// Partner work-report form rendered inside the job drawer's "Report" tab. A faithful port of the
// OS public report form (master-os src/app/quote/respond/public-report-form.tsx): same templates,
// fields and photo slots, but built with the portal's design tokens (no Tailwind) and submitting
// to /api/jobs/report (session-authed) which writes jobs.start_report / final_report to the DB.

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { T } from "@/lib/tokens";
import { Button, Field, Icon, Input, Toggle } from "@/components/ui/primitives";
import {
  fieldsForTemplate,
  photoSlotsForTemplate,
  pickReportTemplate,
  type ReportField,
} from "@/lib/report-templates";
import type { MyJob } from "@/types";
import type { ToastInput } from "@/components/ui/toast";

type ShowToast = (t: ToastInput) => void;
type FieldValue = string | number | boolean;

const sectionTitle: CSSProperties = { fontSize: 14, fontWeight: 600, color: T.ink, margin: "0 0 4px" };
const labelStyle: CSSProperties = { display: "block", fontSize: 13, fontWeight: 500, color: T.ink, marginBottom: 6 };
const hintStyle: CSSProperties = { fontSize: 11.5, color: T.mute, marginTop: 4 };

export function JobReportForm({ job, onShowToast, onClose }: { job: MyJob; onShowToast: ShowToast; onClose: () => void }) {
  const template = useMemo(() => pickReportTemplate({ serviceType: job.trade, title: job.title }), [job.trade, job.title]);
  const spec = useMemo(() => fieldsForTemplate(template), [template]);
  const photoSlots = useMemo(() => photoSlotsForTemplate(template), [template]);

  const [data, setData] = useState<Record<string, FieldValue>>({});
  const [photos, setPhotos] = useState<Record<string, File[]>>({});
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Lock the form if a report was already submitted for this job.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/jobs/report?jobId=${encodeURIComponent(job.uuid)}`);
        const json = await res.json();
        if (!cancelled && res.ok && json.submitted) setAlreadySubmitted(true);
      } catch {
        /* ignore — treat as not submitted */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [job.uuid]);

  const setField = useCallback((key: string, value: FieldValue) => setData((d) => ({ ...d, [key]: value })), []);
  const addPhotos = useCallback((slot: string, files: FileList | null) => {
    if (!files?.length) return;
    setPhotos((p) => ({ ...p, [slot]: [...(p[slot] ?? []), ...Array.from(files)] }));
  }, []);
  const removePhoto = useCallback((slot: string, idx: number) => {
    setPhotos((p) => ({ ...p, [slot]: (p[slot] ?? []).filter((_, i) => i !== idx) }));
  }, []);

  const renderField = (f: ReportField) => {
    if (f.showIf && data[f.showIf.key] !== f.showIf.equals) return null;
    const v = data[f.key];
    if (f.type === "boolean") {
      return (
        <div key={f.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "6px 0" }}>
          <span style={{ fontSize: 13, color: T.ink }}>{f.label}</span>
          <Toggle on={v === true} onChange={(on) => setField(f.key, on)} />
        </div>
      );
    }
    if (f.type === "select") {
      return (
        <div key={f.key}>
          <label style={labelStyle}>{f.label}</label>
          <select
            value={typeof v === "string" ? v : ""}
            onChange={(e) => setField(f.key, e.target.value)}
            style={{
              width: "100%",
              height: 38,
              padding: "0 10px",
              borderRadius: 8,
              border: `1px solid ${T.line}`,
              background: T.white,
              fontFamily: T.sans,
              fontSize: 13,
              color: T.ink,
            }}
          >
            <option value="">Select…</option>
            {f.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {f.hint && <div style={hintStyle}>{f.hint}</div>}
        </div>
      );
    }
    if (f.type === "longtext") {
      return (
        <div key={f.key}>
          <label style={labelStyle}>{f.label}</label>
          <textarea
            value={typeof v === "string" ? v : ""}
            onChange={(e) => setField(f.key, e.target.value)}
            rows={3}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: `1px solid ${T.line}`,
              background: T.white,
              fontFamily: T.sans,
              fontSize: 13,
              color: T.ink,
              resize: "vertical",
              outline: "none",
            }}
          />
          {f.hint && <div style={hintStyle}>{f.hint}</div>}
        </div>
      );
    }
    // text | number
    return (
      <div key={f.key}>
        <label style={labelStyle}>{f.label}</label>
        <Input
          type={f.type === "number" ? "number" : "text"}
          value={v == null ? "" : String(v)}
          onChange={(val) => setField(f.key, f.type === "number" ? (val === "" ? "" : Number(val)) : val)}
        />
        {f.hint && <div style={hintStyle}>{f.hint}</div>}
      </div>
    );
  };

  const renderPhotoSlot = (slot: { key: string; label: string }) => {
    const files = photos[slot.key] ?? [];
    return (
      <div key={slot.key} style={{ border: `1px solid ${T.line}`, borderRadius: 10, padding: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: files.length ? 10 : 0 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: T.ink }}>{slot.label}</span>
          <label style={{ cursor: "pointer", fontSize: 12, fontWeight: 500, color: T.coral, display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Icon name="image-plus" size={13} color={T.coral} /> Add photos
            <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => addPhotos(slot.key, e.target.files)} />
          </label>
        </div>
        {files.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {files.map((f, i) => (
              <div key={i} style={{ position: "relative", width: 64, height: 64, borderRadius: 8, overflow: "hidden", border: `1px solid ${T.line}` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={URL.createObjectURL(f)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button
                  type="button"
                  onClick={() => removePhoto(slot.key, i)}
                  aria-label="Remove photo"
                  style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: 9999, border: "none", background: "rgba(2,0,64,0.7)", color: "#fff", cursor: "pointer", fontSize: 11, lineHeight: 1 }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const submit = async () => {
    setError(null);
    const collect = (fields: ReportField[]): Record<string, unknown> => {
      const out: Record<string, unknown> = {};
      for (const f of fields) {
        if (f.showIf && data[f.showIf.key] !== f.showIf.equals) continue;
        const v = data[f.key];
        if (v === undefined || v === null || v === "") continue;
        out[f.key] = v;
      }
      return out;
    };
    const startFields = collect(spec.start);
    const finalFields = collect(spec.final);

    const h = Number(hours) || 0;
    const m = Number(minutes) || 0;
    const durationMs = (h * 3600 + m * 60) * 1000;
    if (durationMs > 0) {
      finalFields.duration_ms = durationMs;
      if (template === "gardener") finalFields.chargeable_hours = h + m / 60;
    }

    const form = new FormData();
    form.set("jobId", job.uuid);
    form.set("template", template);
    form.set("startData", JSON.stringify(startFields));
    form.set("finalData", JSON.stringify(finalFields));
    for (const [slot, files] of Object.entries(photos)) {
      files.forEach((file, i) => form.append(`photos[${slot}][]`, file, file.name || `${slot}-${i}.jpg`));
    }

    setSubmitting(true);
    setProgress("Uploading report…");
    try {
      const res = await fetch("/api/jobs/report", { method: "POST", body: form });
      const body = (await res.json().catch(() => null)) as { error?: string; jobReference?: string } | null;
      if (!res.ok) {
        setError(body?.error ?? "Could not submit the report.");
        return;
      }
      onShowToast({ icon: "check-circle-2", text: `Report submitted${body?.jobReference ? ` · ${body.jobReference}` : ""}. The office will review it.` });
      setAlreadySubmitted(true);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error submitting the report.");
    } finally {
      setSubmitting(false);
      setProgress("");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20, color: T.mute, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name="loader" size={14} color={T.mute} /> Loading report…
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center" }}>
        <div style={{ width: 44, height: 44, borderRadius: 9999, background: "rgba(34,160,90,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="check-circle-2" size={22} color={T.green} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.ink }}>Report submitted</div>
        <div style={{ fontSize: 13, color: T.mute, maxWidth: 320 }}>
          This job&apos;s report is in with the office for final check. You can&apos;t edit it from here — contact the office if something needs changing.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ fontSize: 11.5, color: T.mute }}>
        Template: <b style={{ color: T.ink, fontWeight: 500, textTransform: "capitalize" }}>{template}</b>
      </div>

      {/* On arrival */}
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h3 style={sectionTitle}>On arrival</h3>
        {spec.start.map(renderField)}
        {photoSlots.start.map(renderPhotoSlot)}
      </section>

      {/* On completion */}
      <section style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 14, borderTop: `1px solid ${T.line}` }}>
        <h3 style={sectionTitle}>On completion</h3>
        {spec.final.map(renderField)}
        <Field label="Time spent on site">
          <div style={{ display: "flex", gap: 8 }}>
            <Input type="number" placeholder="hours" value={hours} onChange={setHours} style={{ width: 110 }} />
            <Input type="number" placeholder="mins" value={minutes} onChange={setMinutes} style={{ width: 110 }} />
          </div>
        </Field>
        {photoSlots.final.map(renderPhotoSlot)}
      </section>

      {error && (
        <div style={{ borderRadius: 8, background: "rgba(237,75,0,0.08)", border: `1px solid ${T.coral}`, padding: 10, fontSize: 12.5, color: T.coral }}>
          {error}
        </div>
      )}

      <Button variant="primary" size="lg" icon="send" onClick={() => void submit()} disabled={submitting}>
        {submitting ? progress || "Submitting…" : "Submit report"}
      </Button>
    </div>
  );
}
