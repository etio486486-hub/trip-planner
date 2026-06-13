function buildExportElement(title: string, content: string): HTMLDivElement {
  const div = document.createElement("div");
  div.style.cssText =
    "position:fixed;left:-9999px;top:0;width:640px;padding:32px;font-family:system-ui,sans-serif;font-size:14px;line-height:1.6;background:#fff;color:#18181b";
  div.innerHTML = `
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700">${escapeHtml(title)}</h1>
    <pre style="margin:0;white-space:pre-wrap;font-family:inherit;font-size:13px">${escapeHtml(content)}</pre>
    <p style="margin-top:24px;font-size:11px;color:#a1a1aa">— Trip Planner —</p>
  `;
  document.body.appendChild(div);
  return div;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, "_").slice(0, 80) || "export";
}

async function renderToCanvas(title: string, content: string) {
  const el = buildExportElement(title, content);
  try {
    const html2canvas = (await import("html2canvas")).default;
    return await html2canvas(el, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
    });
  } finally {
    el.remove();
  }
}

export async function downloadShareTextAsPdf(
  title: string,
  content: string
): Promise<void> {
  const canvas = await renderToCanvas(title, content);
  const imgData = canvas.toDataURL("image/png");
  const { jsPDF } = await import("jspdf");

  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * contentWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(imgData, "PNG", margin, position, contentWidth, imgHeight);
  heightLeft -= pageHeight - margin * 2;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + margin;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", margin, position, contentWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;
  }

  pdf.save(`${sanitizeFilename(title)}.pdf`);
}

export async function downloadShareTextAsImage(
  title: string,
  content: string
): Promise<void> {
  const canvas = await renderToCanvas(title, content);
  const link = document.createElement("a");
  link.download = `${sanitizeFilename(title)}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
