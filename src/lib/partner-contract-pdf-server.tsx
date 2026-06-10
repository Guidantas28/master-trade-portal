import { renderToBuffer } from "@react-pdf/renderer";
import { loadFixfyLogoDataUrl } from "@/lib/contract-branding-server";
import {
  PartnerContractSignedPDF,
  type PartnerContractSignedPdfData,
} from "@/lib/pdf/partner-contract-signed-pdf";

export async function renderPartnerSignedContractPdf(
  data: PartnerContractSignedPdfData,
): Promise<Buffer> {
  const withLogo: PartnerContractSignedPdfData = {
    ...data,
    logoDataUrl: data.logoDataUrl ?? loadFixfyLogoDataUrl(),
  };
  const buffer = await renderToBuffer(<PartnerContractSignedPDF data={withLogo} />);
  return Buffer.from(buffer);
}
