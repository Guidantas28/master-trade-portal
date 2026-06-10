"use client";

// Partner work-report form — mirrors master-os public-report-form.tsx (same templates,
// fields, photo slots, certificate PDF upload) submitting to /api/jobs/report.

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { T } from "@/lib/tokens";
import { Button, Field, Icon, Input } from "@/components/ui/primitives";
import {
  fieldsForTemplate,
  photoSlotsForTemplate,
  pickReportTemplate,
  reportSectionTitles,
  reportTemplateDisplayLabel,
  type ReportField,
  type ReportPhotoSlot,
} from "@/lib/report-templates";
import type { MyJob } from "@/types";
import type { ToastInput } from "@/components/ui/toast";

type ShowToast = (t: ToastInput) => void;
type FieldValue = string | number | boolean;

const MAX_PHOTO_LONG_EDGE = 1600;
const PHOTO_JPEG_QUALITY = 0.75;

const sectionTitle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1,
  color: T.coral,
  textTransform: "uppercase",
  margin: "0 0 12px",
};
const labelStyle: CSSProperties = { display: "block", fontSize: 13, fontWeight: 500, color: T.ink, marginBottom: 6 };
const hintStyle: CSSProperties = { fontSize: 11.5, color: T.mute, marginTop: 4 };

async function downscaleImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = longest > MAX_PHOTO_LONG_EDGE ? MAX_PHOTO_LONG_EDGE / longest : 1;
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Image encode failed."))),
      "image/jpeg",
      PHOTO_JPEG_QUALITY,
    );
  });
  bitmap.close();
  return blob;
}

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

async function prepareUploadFile(file: File, slotKey: string, index: number): Promise<File> {
  if (isPdfFile(file)) return file;
  const blob = await downscaleImage(file);
  return new File([blob], `${slotKey}-${index}.jpg`, { type: "image/jpeg" });
}

export function JobReportForm({ job, onShowToast, onClose }: { job: MyJob; onShowToast: ShowToast; onClose: () => void }) {
  const template = useMemo(() => pickReportTemplate({ serviceType: job.trade, title: job.title }), [job.trade, job.title]);
  const spec = useMemo(() => fieldsForTemplate(template), [template]);
  const photoSlots = useMemo(() => photoSlotsForTemplate(template), [template]);
  const sections = useMemo(() => reportSectionTitles(template), [template]);
  const templateLabel = reportTemplateDisplayLabel(template);
  const isCertificate = template === "certificate";
  const certificateUploadFirst = isCertificate && photoSlots.final.length > 0;

  const [data, setData] = useState<Record<string, FieldValue>>({});
  const [photos, setPhotos] = useState<Record<string, File[]>>({});
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/jobs/report?jobId=${encodeURIComponent(job.uuid)}`);
        const json = await res.json();
        if (!cancelled && res.ok && json.submitted) setAlreadySubmitted(true);
      } catch {
        /* treat as not submitted */
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

  const renderBoolean = (f: ReportField, val: FieldValue) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {[true, false].map((b) => (
        <button
          key={String(b)}
          type="button"
          onClick={() => setField(f.key, b)}
          style={{
            minWidth: 72,
            padding: "8px 14px",
            borderRadius: 8,
            border: `1px solid ${val === b ? T.navy : T.line}`,
            background: val === b ? T.navy : T.white,
            color: val === b ? T.white : T.slate,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: T.sans,
          }}
        >
          {b ? "Yes" : "No"}
        </button>
      ))}
    </div>
  );

  const renderField = (f: ReportField) => {
    if (f.showIf && data[f.showIf.key] !== f.showIf.equals) return null;
    const v = data[f.key];
    if (f.type === "boolean") {
      return (
        <div key={f.key}>
          <label style={labelStyle}>{f.label}</label>
          {renderBoolean(f, v)}
          {f.hint && <div style={hintStyle}>{f.hint}</div>}
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
              boxSizing: "border-box",
            }}
          />
          {f.hint && <div style={hintStyle}>{f.hint}</div>}
        </div>
      );
    }
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

  const renderPhotoThumb = (slot: string, file: File, i: number) => {
    const pdf = isPdfFile(file);
    return (
      <div
        key={`${slot}-${i}`}
        style={{ position: "relative", width: 72, height: 72, borderRadius: 8, overflow: "hidden", border: `1px solid ${T.line}`, background: T.paper2 }}
      >
        {pdf ? (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: T.slate, padding: 4, textAlign: "center" }}>
            PDF
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={URL.createObjectURL(file)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        <button
          type="button"
          onClick={() => removePhoto(slot, i)}
          aria-label="Remove file"
          style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: 9999, border: "none", background: "rgba(2,0,64,0.7)", color: "#fff", cursor: "pointer", fontSize: 11, lineHeight: 1 }}
        >
          ×
        </button>
      </div>
    );
  };

  const renderPhotoSlot = (slot: ReportPhotoSlot) => {
    const files = photos[slot.key] ?? [];
    const accept = slot.accept ?? "image/*";

    if (slot.prominent) {
      return (
        <div key={slot.key} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: T.navy, margin: 0 }}>{slot.label}</p>
            {slot.hint ? <p style={{ fontSize: 12, color: T.mute, margin: "4px 0 0", lineHeight: 1.45 }}>{slot.hint}</p> : null}
            {slot.optional ? <p style={{ fontSize: 11, color: T.mute, margin: "2px 0 0" }}>Optional</p> : null}
          </div>
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: "24px 16px",
              borderRadius: 12,
              border: `2px dashed ${T.coral}55`,
              background: T.coralTint,
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 9999, background: T.coral, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="upload" size={20} color={T.white} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: T.navy, margin: 0 }}>Tap to upload certificate</p>
              <p style={{ fontSize: 12, color: T.mute, margin: "4px 0 0" }}>PDF or photo · multiple files OK</p>
            </div>
            <input type="file" accept={accept} multiple style={{ display: "none" }} onChange={(e) => addPhotos(slot.key, e.target.files)} />
          </label>
          {files.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{files.map((f, i) => renderPhotoThumb(slot.key, f, i))}</div>
          ) : null}
        </div>
      );
    }

    return (
      <div key={slot.key} style={{ border: `1px solid ${T.line}`, borderRadius: 10, padding: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: files.length ? 10 : 0, gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: T.ink }}>{slot.label}</span>
          <label style={{ cursor: "pointer", fontSize: 12, fontWeight: 500, color: T.coral, display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Icon name="image-plus" size={13} color={T.coral} /> Add photos
            <input type="file" accept={accept} multiple capture="environment" style={{ display: "none" }} onChange={(e) => addPhotos(slot.key, e.target.files)} />
          </label>
        </div>
        {slot.optional ? <p style={{ fontSize: 11, color: T.mute, margin: "0 0 8px" }}>Optional</p> : null}
        {files.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{files.map((f, i) => renderPhotoThumb(slot.key, f, i))}</div>
        ) : (
          <p style={{ fontSize: 11, color: T.mute, margin: 0 }}>No photos added</p>
        )}
      </div>
    );
  };

  const sectionCard = (title: string, children: React.ReactNode) => (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: 16,
        borderRadius: 12,
        border: `1px solid ${T.line}`,
        background: T.white,
      }}
    >
      <h3 style={sectionTitle}>{title}</h3>
      {children}
    </section>
  );

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

    setSubmitting(true);
    setProgress("Processing files…");
    try {
      for (const [slot, slotFiles] of Object.entries(photos)) {
        for (let i = 0; i < slotFiles.length; i++) {
          const prepared = await prepareUploadFile(slotFiles[i], slot, i);
          form.append(`photos[${slot}][]`, prepared);
        }
      }
      setProgress("Uploading report…");
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
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
      <header style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11.5, color: T.mute }}>Template</span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 0.4,
            padding: "3px 8px",
            borderRadius: 9999,
            background: T.blue50,
            color: T.blue,
          }}
        >
          {templateLabel}
        </span>
      </header>

      {spec.start.length > 0
        ? sectionCard(
            sections.start,
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{spec.start.map(renderField)}</div>
              {photoSlots.start.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 12, borderTop: `1px solid ${T.line}` }}>
                  {photoSlots.start.map(renderPhotoSlot)}
                </div>
              ) : null}
            </>,
          )
        : null}

      {sectionCard(
        sections.final,
        <>
          {certificateUploadFirst ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{photoSlots.final.map(renderPhotoSlot)}</div>
          ) : null}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{spec.final.map(renderField)}</div>
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              border: `1px solid ${T.line}`,
              background: T.paper2,
            }}
          >
            <Field label="Time spent on site">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Input type="number" placeholder="Hours" value={hours} onChange={setHours} style={{ flex: "1 1 100px", minWidth: 100 }} />
                <Input type="number" placeholder="Mins" value={minutes} onChange={setMinutes} style={{ flex: "1 1 100px", minWidth: 100 }} />
              </div>
            </Field>
          </div>
          {!certificateUploadFirst && photoSlots.final.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 12, borderTop: `1px solid ${T.line}` }}>
              {photoSlots.final.map(renderPhotoSlot)}
            </div>
          ) : null}
        </>,
      )}

      {error && (
        <div style={{ borderRadius: 8, background: "rgba(237,75,0,0.08)", border: `1px solid ${T.coral}`, padding: 10, fontSize: 12.5, color: T.coral }}>
          {error}
        </div>
      )}

      <Button variant="primary" size="lg" icon="send" onClick={() => void submit()} disabled={submitting} style={{ width: "100%" }}>
        {submitting ? progress || "Submitting…" : "Submit report"}
      </Button>
    </div>
  );
}
