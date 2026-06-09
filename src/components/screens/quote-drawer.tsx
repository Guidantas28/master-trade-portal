"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { T } from "@/lib/tokens";
import { Badge, Button, Field, Icon, IconButton, Input } from "@/components/ui/primitives";
import { formatGBP, formatGBPdec } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { submitBid } from "@/lib/queries/quotes";
import {
  bidFormValuesFromNotes,
  buildBidProposalFromForm,
  validateBidSubmitForm,
  type BidSubmitFormValues,
} from "@/lib/quote-bid-payload";
import type { QuoteRequest, QuoteRequestStatus } from "@/types";
import type { ToastInput } from "@/components/ui/toast";

type ShowToast = (t: ToastInput) => void;

export type QuoteDrawerDetail = {
  id: string;
  reference?: string;
  title: string;
  scope: string;
  propertyAddress: string;
  postcode: string;
  clientName: string;
  serviceType: string;
  images: string[];
  quoteStatus: string;
  deadline: string;
  bidDeadlineAt?: string | null;
  bidWindowHours?: number;
  myBid?: { amount?: number; status?: string; notes?: string | null } | null;
};

type Phase = "detail" | "bid";

export function QuoteDrawer({
  quote,
  listStatus,
  partnerId,
  partnerName,
  initialPhase = "detail",
  onClose,
  onShowToast,
  onChanged,
}: {
  quote: QuoteRequest;
  listStatus: QuoteRequestStatus;
  partnerId: string;
  partnerName: string;
  initialPhase?: Phase;
  onClose: () => void;
  onShowToast: ShowToast;
  onChanged: () => void;
}) {
  const [closing, setClosing] = useState(false);
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [detail, setDetail] = useState<QuoteDrawerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [declining, setDeclining] = useState(false);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/quotes/${encodeURIComponent(quote.id)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load quote");
      setDetail(json as QuoteDrawerDetail);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load quote");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [quote.id]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 200);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const decline = async () => {
    setDeclining(true);
    try {
      const res = await fetch("/api/quotes/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: quote.id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Could not decline");
      onShowToast({ icon: "x", text: "Quote declined — moved to Lost." });
      onChanged();
      handleClose();
    } catch (e) {
      onShowToast({
        icon: "alert-triangle",
        tone: "coral",
        text: e instanceof Error ? e.message : "Could not decline",
      });
    } finally {
      setDeclining(false);
    }
  };

  const canBid = listStatus === "to-quote" || listStatus === "submitted";
  const showDecline = listStatus === "to-quote";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        animation: closing ? "fx-fade-in 200ms reverse" : "fx-fade-in 200ms",
      }}
    >
      <div
        onClick={handleClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(2,0,64,0.48)",
          backdropFilter: "blur(4px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 640,
          maxWidth: "94vw",
          background: T.white,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-24px 0 48px rgba(2,0,64,0.16)",
          animation: closing
            ? "fx-slide-right 200ms cubic-bezier(0.2,0,0,1) reverse"
            : "fx-slide-right 220ms cubic-bezier(0.2,0,0,1)",
        }}
      >
        <div style={{ borderBottom: `1px solid ${T.line}`, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <IconButton icon="x" size={32} tone="ghost" onClick={handleClose} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, color: T.mute, display: "flex", alignItems: "center", gap: 8 }}>
              <span className="fx-mono">{detail?.reference ?? quote.reference ?? quote.id.slice(0, 8)}</span>
              {detail?.serviceType ? (
                <>
                  <span>·</span>
                  <span>{detail.serviceType}</span>
                </>
              ) : null}
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 500,
                color: T.navy,
                marginTop: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {detail?.title ?? quote.title}
            </div>
          </div>
          {phase === "bid" ? (
            <Badge tone="soft" size="sm">
              {listStatus === "submitted" ? "Update bid" : "Submit quote"}
            </Badge>
          ) : null}
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "20px 20px 8px" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.mute, fontSize: 13 }}>
              <Icon name="loader" size={14} /> Loading details…
            </div>
          ) : loadError ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
              <p style={{ fontSize: 13, color: T.coral }}>{loadError}</p>
              <Button variant="secondary" size="sm" icon="refresh-cw" onClick={loadDetail}>
                Retry
              </Button>
            </div>
          ) : phase === "bid" && detail ? (
            <QuoteBidFormBody
              quote={quote}
              detail={detail}
              listStatus={listStatus}
              partnerId={partnerId}
              partnerName={partnerName}
              onShowToast={onShowToast}
              onSubmitted={() => {
                onChanged();
                handleClose();
              }}
            />
          ) : detail ? (
            <QuoteDetailBody detail={detail} listStatus={listStatus} />
          ) : null}
        </div>

        {phase === "detail" && !loading && !loadError && detail && (
          <div
            style={{
              padding: 16,
              borderTop: `1px solid ${T.line}`,
              background: T.paper,
              display: "flex",
              gap: 10,
              flexShrink: 0,
            }}
          >
            {showDecline ? (
              <Button variant="secondary" onClick={decline} disabled={declining} style={{ flex: 1 }}>
                {declining ? "Declining…" : "Decline"}
              </Button>
            ) : (
              <div style={{ flex: 1 }} />
            )}
            {canBid ? (
              <Button variant="primary" icon="send" onClick={() => setPhase("bid")} style={{ flex: 1 }}>
                {listStatus === "submitted" ? "Update bid" : "Submit quote"}
              </Button>
            ) : (
              <Button variant="secondary" onClick={handleClose} style={{ flex: 1 }}>
                Close
              </Button>
            )}
          </div>
        )}

        {phase === "bid" && detail && (
          <div
            style={{
              padding: 16,
              borderTop: `1px solid ${T.line}`,
              background: T.paper,
              display: "flex",
              gap: 10,
            }}
          >
            <Button variant="secondary" onClick={() => setPhase("detail")} style={{ flex: 1 }}>
              Back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function QuoteDetailBody({
  detail,
  listStatus,
}: {
  detail: QuoteDrawerDetail;
  listStatus: QuoteRequestStatus;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {listStatus === "to-quote" && detail.bidWindowHours ? (
        <div
          style={{
            padding: 14,
            borderRadius: 10,
            background: "#FFF7ED",
            border: "1px solid #F3D9A4",
            fontSize: 13,
            lineHeight: 1.5,
            color: T.ink,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9A6B00", textTransform: "uppercase", marginBottom: 4 }}>
            Bid deadline
          </div>
          This quote expires in <strong>{detail.bidWindowHours} hours</strong>
          {detail.deadline !== "—" ? (
            <>
              {" "}
              — submit by <strong>{detail.deadline}</strong>
            </>
          ) : null}
          .
        </div>
      ) : null}

      <section>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: T.mute, textTransform: "uppercase", marginBottom: 10 }}>
          Opportunity details
        </p>
        <div style={{ border: `1px solid ${T.line}`, borderRadius: 10, overflow: "hidden" }}>
          <DetailRow label="Client" value={detail.clientName} />
          <DetailRow label="Address" value={detail.propertyAddress || "—"} sub={detail.postcode} />
          <DetailRow label="Type of work" value={detail.serviceType || detail.title} last />
        </div>
      </section>

      {detail.scope ? (
        <section>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: T.mute, textTransform: "uppercase", marginBottom: 8 }}>
            Scope
          </p>
          <div
            style={{
              padding: 14,
              borderRadius: 10,
              background: T.paper,
              fontSize: 14,
              lineHeight: 1.55,
              color: T.ink,
              whiteSpace: "pre-wrap",
            }}
          >
            {detail.scope}
          </div>
        </section>
      ) : null}

      <section>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: T.mute, textTransform: "uppercase", marginBottom: 10 }}>
          Site photos
        </p>
        {detail.images.length === 0 ? (
          <p style={{ fontSize: 13, color: T.mute, fontStyle: "italic" }}>No site photos attached from the office.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
            {detail.images.map((url, i) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  borderRadius: 10,
                  overflow: "hidden",
                  border: `1px solid ${T.line}`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Site photo ${i + 1}`}
                  style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }}
                />
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function DetailRow({
  label,
  value,
  sub,
  last,
}: {
  label: string;
  value: string;
  sub?: string;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "120px 1fr",
        gap: 8,
        padding: "12px 14px",
        borderBottom: last ? undefined : `1px solid ${T.line}`,
        fontSize: 14,
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 700, color: T.mute, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </span>
      <span style={{ color: T.ink, lineHeight: 1.45 }}>
        {value}
        {sub ? (
          <>
            <br />
            <span style={{ color: T.slate, fontSize: 13 }}>{sub}</span>
          </>
        ) : null}
      </span>
    </div>
  );
}

function QuoteBidFormBody({
  quote,
  detail,
  listStatus,
  partnerId,
  partnerName,
  onShowToast,
  onSubmitted,
}: {
  quote: QuoteRequest;
  detail: QuoteDrawerDetail;
  listStatus: QuoteRequestStatus;
  partnerId: string;
  partnerName: string;
  onShowToast: ShowToast;
  onSubmitted: () => void;
}) {
  const isUpdate = listStatus === "submitted";
  const initial = bidFormValuesFromNotes(detail.myBid?.notes ?? quote.myBidNotes);
  const [labour, setLabour] = useState(initial.labourCost ?? "");
  const [materials, setMaterials] = useState(initial.materialsCost ?? "");
  const [labourNotes, setLabourNotes] = useState(initial.labourDescription ?? "");
  const [materialsNotes, setMaterialsNotes] = useState(initial.materialsDescription ?? "");
  const [scope, setScope] = useState(initial.scope ?? detail.scope ?? "");
  const [startDate1, setStartDate1] = useState(initial.startDate1 ?? "");
  const [startDate2, setStartDate2] = useState(initial.startDate2 ?? "");
  const [coverNote, setCoverNote] = useState(initial.coverNote ?? "");
  const [submitting, setSubmitting] = useState(false);
  const total = (parseFloat(labour) || 0) + (parseFloat(materials) || 0);

  const textareaStyle = {
    width: "100%",
    minHeight: 70,
    padding: 10,
    borderRadius: 8,
    border: `1px solid ${T.line}`,
    fontFamily: T.sans,
    fontSize: 13,
    color: T.ink,
    outline: "none",
    resize: "vertical" as const,
    boxSizing: "border-box" as const,
  };

  const send = async () => {
    const form: BidSubmitFormValues = {
      labourCost: labour,
      materialsCost: materials,
      labourDescription: labourNotes,
      materialsDescription: materialsNotes,
      scope,
      startDate1,
      startDate2,
      coverNote,
    };
    const err = validateBidSubmitForm(form);
    if (err) {
      onShowToast({ icon: "alert-triangle", tone: "coral", text: err });
      return;
    }
    setSubmitting(true);
    try {
      const payload = buildBidProposalFromForm(form);
      await submitBid(createClient(), {
        quoteId: quote.id,
        partnerId,
        partnerName,
        amount: total,
        payload,
      });
      onShowToast({
        icon: "send",
        text: isUpdate
          ? "Bid updated. We'll notify you when the customer decides."
          : "Quote submitted. We'll notify you when the customer decides.",
      });
      onSubmitted();
    } catch (e) {
      onShowToast({
        icon: "alert-triangle",
        tone: "coral",
        text: e instanceof Error ? e.message : "Couldn't submit quote",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 8 }}>
      <p style={{ fontSize: 12, color: T.mute, lineHeight: 1.45 }}>
        Required fields match Fixfy OS — labour and materials notes, scope, and two start dates so the office can send the
        customer proposal after approval.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Labour (£ inc VAT) *">
          <Input value={labour} onChange={setLabour} prefix="£" />
        </Field>
        <Field label="Materials (£ inc VAT) *">
          <Input value={materials} onChange={setMaterials} prefix="£" />
        </Field>
      </div>

      <Field label="Labour line notes *">
        <textarea
          value={labourNotes}
          onChange={(e) => setLabourNotes(e.target.value)}
          placeholder="What labour includes — hours, trades on site, prep, clean-down…"
          style={textareaStyle}
        />
      </Field>

      <Field label="Materials line notes *">
        <textarea
          value={materialsNotes}
          onChange={(e) => setMaterialsNotes(e.target.value)}
          placeholder="Materials included, allowances, or state if customer supplies materials…"
          style={textareaStyle}
        />
      </Field>

      <div
        style={{
          padding: 14,
          background: T.paper,
          borderRadius: 10,
          border: `1px solid ${T.line}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: T.mute, letterSpacing: 0.4 }}>YOUR TOTAL</div>
          <div style={{ fontFamily: T.mono, fontSize: 28, fontWeight: 500, color: T.navy }}>{formatGBPdec(total)}</div>
        </div>
        <div style={{ fontSize: 12, color: T.mute, textAlign: "right" }}>
          <div>Net-7 from sign-off</div>
          <div className="fx-mono">~{formatGBP(total * 0.83)} after VAT</div>
        </div>
      </div>

      <Field label="Scope of work (for customer email / PDF) *">
        <textarea
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          placeholder="Describe the work you will carry out, assumptions, and exclusions…"
          style={{ ...textareaStyle, minHeight: 90 }}
        />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Start date option 1 *">
          <input type="date" value={startDate1} onChange={(e) => setStartDate1(e.target.value)} style={dateInputStyle} />
        </Field>
        <Field label="Start date option 2 *">
          <input type="date" value={startDate2} onChange={(e) => setStartDate2(e.target.value)} style={dateInputStyle} />
        </Field>
      </div>

      <Field label="Additional note (optional)">
        <textarea
          value={coverNote}
          onChange={(e) => setCoverNote(e.target.value)}
          placeholder="Anything else the customer should know — site visit recommended, access notes…"
          style={textareaStyle}
        />
      </Field>

      <Button variant="primary" icon="send" onClick={send} disabled={submitting || total <= 0} style={{ width: "100%" }}>
        {submitting ? "Sending…" : isUpdate ? "Update bid" : "Send quote"}
      </Button>
    </div>
  );
}

const dateInputStyle: CSSProperties = {
  width: "100%",
  padding: "9px 10px",
  borderRadius: 8,
  border: `1px solid ${T.line}`,
  fontFamily: T.sans,
  fontSize: 13,
  color: T.ink,
  boxSizing: "border-box",
};
