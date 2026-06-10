import { readFileSync } from "fs";
import { join } from "path";

let cachedLogoDataUrl: string | null = null;

/** Fixfy icon as data URL for @react-pdf/renderer (server only). */
export function loadFixfyLogoDataUrl(): string {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  const bytes = readFileSync(join(process.cwd(), "public/fixfy-icon.png"));
  cachedLogoDataUrl = `data:image/png;base64,${bytes.toString("base64")}`;
  return cachedLogoDataUrl;
}
