"use client";

import jsQR from "jsqr";
import { useState, type ChangeEvent, type FormEvent } from "react";

type AddPayload = {
  uri?: string;
  issuer?: string;
  label?: string;
  secret?: string;
};

type Props = {
  onAdd: (payload: AddPayload) => Promise<string | null>;
  onClose: () => void;
};

export default function AddAccountModal({ onAdd, onClose }: Props) {
  const [mode, setMode] = useState<"manual" | "qr">("manual");
  const [issuer, setIssuer] = useState("");
  const [label, setLabel] = useState("");
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const err = await onAdd({ issuer, label, secret });
    setSubmitting(false);
    if (err) setError(err);
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSubmitting(true);
    try {
      const uri = await decodeQrFromFile(file);
      const err = await onAdd({ uri });
      if (err) setError(err);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read QR code.");
    } finally {
      setSubmitting(false);
      e.target.value = "";
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-panel p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Add account</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-900"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 flex gap-2 rounded-lg bg-neutral-100 p-1 text-sm">
          <button
            className={`flex-1 rounded-md py-1.5 ${
              mode === "manual" ? "bg-accent text-white" : "text-neutral-500"
            }`}
            onClick={() => setMode("manual")}
          >
            Enter secret
          </button>
          <button
            className={`flex-1 rounded-md py-1.5 ${
              mode === "qr" ? "bg-accent text-white" : "text-neutral-500"
            }`}
            onClick={() => setMode("qr")}
          >
            Upload QR image
          </button>
        </div>

        {mode === "manual" ? (
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-neutral-500">
                Service (e.g. GitHub)
              </label>
              <input
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                className="w-full rounded-lg border border-border bg-neutral-100 px-3 py-2 text-neutral-900 outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-neutral-500">
                Account (e.g. you@email.com)
              </label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full rounded-lg border border-border bg-neutral-100 px-3 py-2 text-neutral-900 outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-neutral-500">
                Secret key (base32)
              </label>
              <input
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-neutral-100 px-3 py-2 font-mono text-neutral-900 outline-none focus:border-accent"
                placeholder="JBSWY3DPEHPK3PXP"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-accent py-2.5 font-medium text-white disabled:opacity-50"
            >
              {submitting ? "Adding…" : "Add account"}
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-neutral-500">
              Upload a screenshot of the setup QR code shown by the other
              app or website.
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFile}
              disabled={submitting}
              className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-2 file:text-white"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            {submitting && (
              <p className="text-sm text-neutral-500">Reading…</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

async function decodeQrFromFile(file: File): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      resolve(image);
      URL.revokeObjectURL(url);
    };
    image.onerror = () => reject(new Error("Could not load image."));
    image.src = url;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported in this browser.");
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const result = jsQR(imageData.data, imageData.width, imageData.height);
  if (!result) throw new Error("No QR code found in that image.");
  return result.data;
}
