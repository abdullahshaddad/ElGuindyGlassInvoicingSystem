// src/utils/printTemplates/stickerTemplate.js
// Generates factory sticker HTML — compact grid layout (label | value).

// ── Helpers ──────────────────────────────────────────────────

const fmtDim = (n) => {
    const v = parseFloat(n || 0);
    return v === Math.floor(v) ? String(Math.floor(v)) : v.toFixed(1);
};

const fmtPrice = (n) => parseFloat(n || 0).toFixed(2);

const esc = (str) => {
    if (!str && str !== 0) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
};

const unitLabel = (u) => (u === 'MM' ? 'مم' : u === 'M' ? 'م' : 'سم');

const getOpDisplay = (op) => {
    const typeName = op.operationType?.ar || op.operationType?.code || 'عملية';
    const calcName = op.calculationMethod?.ar || '';
    let name = calcName ? `${typeName} - ${calcName}` : typeName;
    if (op.manualMeters) name += ` (${fmtPrice(op.manualMeters)}م)`;
    if (op.price) name += `، ${fmtPrice(op.price)} ج.م`;
    return name;
};

// ── CSS ──────────────────────────────────────────────────────

const CSS = `
@font-face{font-family:'Amiri';src:url('/fonts/Amiri-Regular.ttf') format('truetype');font-weight:400;font-display:block}
@font-face{font-family:'Amiri';src:url('/fonts/Amiri-Bold.ttf') format('truetype');font-weight:700;font-display:block}
@page{size:140mm 99mm;margin:0}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Amiri','Traditional Arabic',serif;color:#111827;direction:rtl;-webkit-print-color-adjust:exact;print-color-adjust:exact;margin:0}
.sticker{page-break-after:always;width:140mm;height:99mm;padding:3mm;display:flex;flex-direction:column;overflow:hidden}
.sticker:last-child{page-break-after:auto}
.s-hdr{background:#111827;color:#fff;text-align:center;padding:5pt 0;font-size:14pt;font-weight:700;letter-spacing:1pt;direction:ltr;flex-shrink:0}
.sg{width:100%;border-collapse:collapse;flex:1}
.sg td{border:.5pt solid #d1d5db;padding:3pt 6pt;vertical-align:middle}
.sg .lbl{background:#f3f4f6;color:#374151;font-size:8.5pt;font-weight:700;width:28%;white-space:nowrap}
.sg .val{color:#111827;font-size:10pt}
.sg .val-big{color:#111827;font-size:18pt;font-weight:700;direction:ltr;text-align:center}
.sg .val-qty{color:#312e81;font-size:22pt;font-weight:700;text-align:center}
.sg .val-ops{font-size:9pt;color:#581c87}
.sg .val-notes{font-size:8.5pt;color:#92400e}
.toolbar{position:fixed;top:0;left:0;right:0;background:#1e293b;color:#fff;padding:8px 16px;display:flex;align-items:center;gap:12px;z-index:1000;direction:rtl}
.toolbar button{background:#2563eb;color:#fff;border:none;padding:6px 20px;border-radius:6px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:700}
.toolbar button:hover{background:#1d4ed8}
.toolbar span{font-size:13px;color:#94a3b8}
@media print{.toolbar{display:none!important}body{margin:0!important;padding:0!important}}
@media screen{body{background:#94a3b8;padding-top:52px}.sticker{background:#fff;margin:6mm auto;box-shadow:0 2px 12px rgba(0,0,0,.2)}}
`;

// ── Render one sticker ───────────────────────────────────────

function renderSticker(invoice, line, lineIndex, totalLines) {
    const gt = line.glassType || {};
    const ops = line.operations || [];
    const customer = invoice.customer || {};
    const invNum = invoice.readableId || String(invoice.invoiceNumber ?? '');

    const dimW = line.dimensions?.width ?? line.width;
    const dimH = line.dimensions?.height ?? line.height;
    const dimU = line.dimensions?.measuringUnit ?? line.dimensionUnit;

    // Glass detail text
    const detParts = [];
    if (gt.thickness) detParts.push(gt.thickness + ' مم');
    if (gt.color) detParts.push(gt.color);
    const glassDetail = detParts.length ? ` (${detParts.join(' | ')})` : '';

    // Line indicator
    let lineCell = '';
    if (lineIndex != null && totalLines != null) {
        lineCell = `<td class="lbl">بند</td><td class="val" style="direction:ltr;text-align:center">${lineIndex + 1} / ${totalLines}</td>`;
    } else {
        lineCell = `<td class="lbl"></td><td class="val"></td>`;
    }

    // Operations rows
    let opsRow = '';
    if (ops.length > 0) {
        const opsText = ops.map(op => esc(getOpDisplay(op))).join('<br>');
        opsRow = `<tr><td class="lbl">العمليات</td><td class="val val-ops" colspan="3">${opsText}</td></tr>`;
    }

    // Notes row
    let notesRow = '';
    if (line.notes) {
        notesRow = `<tr><td class="lbl">ملاحظات</td><td class="val val-notes" colspan="3">${esc(line.notes)}</td></tr>`;
    }

    return `<div class="sticker">
  <div class="s-hdr">${esc(invNum)}</div>
  <table class="sg">
    <tr>
      <td class="lbl">العميل</td>
      <td class="val" style="font-weight:700">${esc(customer.name || 'عميل')}</td>
      ${lineCell}
    </tr>
    <tr>
      <td class="lbl">نوع الزجاج</td>
      <td class="val" colspan="3" style="font-weight:700">${esc((gt.name || 'زجاج') + glassDetail)}</td>
    </tr>
    <tr>
      <td class="lbl">الأبعاد</td>
      <td class="val val-big">${esc(fmtDim(dimW))} \u00D7 ${esc(fmtDim(dimH))} <span style="font-size:9pt;font-weight:400">${esc(unitLabel(dimU))}</span></td>
      <td class="lbl">الكمية</td>
      <td class="val val-qty">${line.quantity || 1} <span style="font-size:9pt;font-weight:400">قطعة</span></td>
    </tr>
    ${opsRow}
    ${notesRow}
  </table>
</div>`;
}

function wrapHtml(stickersHtml, title) {
    return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>${esc(title)}</title>
<style>${CSS}</style>
</head>
<body>
<div class="toolbar">
  <button onclick="window.print()">طباعة</button>
  <span>معاينة الملصقات</span>
</div>
${stickersHtml}
</body>
</html>`;
}

// ── Public API ───────────────────────────────────────────────

export function generateStickerHTML(invoice, lineId) {
    const lines = invoice.lines || [];
    const line = lines.find(l => l._id === lineId);
    if (!line) throw new Error('Invoice line not found');

    const invNum = invoice.readableId || String(invoice.invoiceNumber ?? '');
    return wrapHtml(renderSticker(invoice, line), `ملصق ${invNum}`);
}

export function generateAllStickersHTML(invoice) {
    const lines = invoice.lines || [];
    if (lines.length === 0) throw new Error('Invoice has no lines');

    const invNum = invoice.readableId || String(invoice.invoiceNumber ?? '');
    const totalLines = lines.length;

    let stickersHtml = '';
    for (let idx = 0; idx < lines.length; idx++) {
        const line = lines[idx];
        const qty = line.quantity || 1;
        for (let i = 0; i < qty; i++) {
            stickersHtml += renderSticker(invoice, line, idx, totalLines);
        }
    }

    return wrapHtml(stickersHtml, `ملصقات ${invNum}`);
}
