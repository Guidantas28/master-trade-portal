/** Fixfy brand mark for partner contract HTML (portal read modal + signed PDF body). */
export function fixfyLogoHtml(): string {
  return `<span class="fixfy-logo-wrap" style="display:inline-flex;align-items:center;gap:8px;"><img src="/fixfy-icon.png" alt="Fixfy" class="fixfy-logo-img" style="height:32px;width:auto;display:block;" /><span style="font-weight:800;font-size:16pt;letter-spacing:-0.02em;line-height:1;"><span style="color:#020040;">fix</span><span style="color:#ED4B00;">fy</span></span></span>`;
}

/** Inject logo and normalise legacy FIXFY text headers in stored contract HTML. */
export function hydrateContractHtml(html: string): string {
  const logo = fixfyLogoHtml();
  return html
    .replace(/\{\{FIXFY_LOGO\}\}/g, logo)
    .replace(/<div class="logo">FIXFY<\/div>/gi, `<div class="logo">${logo}</div>`);
}
