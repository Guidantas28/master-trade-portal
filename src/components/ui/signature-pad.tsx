"use client";

// Signature capture via react-signature-canvas — emits a PNG data URL after each stroke.

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { T } from "@/lib/tokens";

export function SignaturePad({ onChange, height = 160 }: { onChange: (dataUrl: string | null) => void; height?: number }) {
  const padRef = useRef<SignatureCanvas | null>(null);
  const [hasInk, setHasInk] = useState(false);

  const notify = () => {
    if (!padRef.current || padRef.current.isEmpty()) {
      setHasInk(false);
      onChange(null);
      return;
    }
    setHasInk(true);
    onChange(padRef.current.toDataURL("image/png"));
  };

  const clear = () => {
    padRef.current?.clear();
    setHasInk(false);
    onChange(null);
  };

  return (
    <div>
      <div style={{ position: "relative", border: `1.5px dashed ${T.lineStrong}`, borderRadius: 10, background: T.white, overflow: "hidden" }}>
        <SignatureCanvas
          ref={padRef}
          penColor={T.ink}
          minWidth={1.5}
          maxWidth={2.5}
          canvasProps={{
            width: 480,
            height,
            style: { width: "100%", height, touchAction: "none", display: "block", cursor: "crosshair" },
          }}
          onEnd={notify}
        />
        {!hasInk && (
          <span style={{ position: "absolute", top: "50%", left: 0, right: 0, transform: "translateY(-50%)", textAlign: "center", color: T.mute, fontSize: 13, pointerEvents: "none" }}>
            Sign here
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={clear}
        style={{ marginTop: 8, padding: 0, background: "transparent", border: "none", color: T.coral, fontFamily: T.sans, fontSize: 12, fontWeight: 500, cursor: "pointer" }}
      >
        Clear
      </button>
    </div>
  );
}
