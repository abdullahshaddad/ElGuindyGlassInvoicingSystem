// src/utils/printTemplates/invoiceTemplate.js
// Generates professional invoice HTML with native browser BiDi rendering.
// No pdf-lib — the browser handles Arabic/English/currency display perfectly.

// ── Formatting helpers ───────────────────────────────────────

const fmtNum = (n) => {
    const v = parseFloat(n || 0);
    return v === Math.floor(v) ? String(v) : v.toFixed(2);
};

const fmtCurrency = (n) => parseFloat(n || 0).toFixed(2);

const fmtDate = (ts) => {
    if (!ts) return '-';
    return new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date(ts));
};

const esc = (str) => {
    if (!str && str !== 0) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
};

const unitLabel = (u) => (u === 'MM' ? 'مم' : u === 'M' ? 'م' : 'سم');

const statusLabel = (s) =>
    ({ PAID: 'مدفوعة', PENDING: 'قيد الانتظار', PARTIALLY_PAID: 'مدفوعة جزئياً', CANCELLED: 'ملغاة' }[s] || s);

const statusClass = (s) =>
    ({ PAID: 'st-paid', CANCELLED: 'st-cancelled', PARTIALLY_PAID: 'st-partial' }[s] || 'st-pending');

const payMethodLabel = (m) =>
    ({ CASH: 'نقدي', CARD: 'بطاقة', BANK_TRANSFER: 'تحويل بنكي', CHECK: 'شيك', VODAFONE_CASH: 'فودافون كاش', OTHER: 'أخرى' }[m] || m);

const custTypeLabel = (t) =>
    ({ CASH: 'نقدي', COMPANY: 'شركة', REGULAR: 'عادي' }[t] || t);

const getOpDisplay = (op) => {
    const typeName = op.operationType?.ar || op.operationType?.code || 'عملية';
    const calcName = op.calculationMethod?.ar || '';
    const name = calcName ? `${typeName} - ${calcName}` : typeName;
    const parts = [name];
    if (op.manualMeters) parts.push(`(${fmtNum(op.manualMeters)} م.ط)`);
    if (op.price) parts.push(`${fmtCurrency(op.price)} ج.م`);
    return parts.join('، ');
};

const getDim = (line) => ({
    width: line.dimensions?.width ?? line.width,
    height: line.dimensions?.height ?? line.height,
    unit: line.dimensions?.measuringUnit ?? line.dimensionUnit,
});

// ── CSS ──────────────────────────────────────────────────────

const CSS = `
@font-face{font-family:'Amiri';src:url('/fonts/Amiri-Regular.ttf') format('truetype');font-weight:400;font-display:block}
@font-face{font-family:'Amiri';src:url('/fonts/Amiri-Bold.ttf') format('truetype');font-weight:700;font-display:block}
@page{size:A4;margin:12mm 15mm}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Amiri','Traditional Arabic','Arabic Typesetting',serif;color:#111827;font-size:10pt;direction:rtl;line-height:1.5;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{page-break-after:always;position:relative;min-height:calc(297mm - 24mm);padding-bottom:36pt}
.page:last-child{page-break-after:auto}
.hdr-top{text-align:center;margin-bottom:6pt}
.hdr-top-logo{height:50pt;max-width:160pt;object-fit:contain;margin-bottom:4pt}
.inv-num{font-size:18pt;font-weight:700;color:#122d5f;letter-spacing:.5pt;direction:ltr;display:inline-block}
.copy-lbl{font-size:8.5pt;color:#6b7280;margin-top:1pt}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8pt}
.hdr-r{text-align:right}
.hdr-l{text-align:left;direction:ltr}
.inv-title{font-size:14pt;font-weight:700;color:#122d5f;line-height:1.2}
.co-name{font-size:12pt;font-weight:700;color:#111827;margin-top:2pt}
.co-det{font-size:8.5pt;color:#6b7280;margin-top:1pt}
.inv-date{font-size:10pt;color:#6b7280}
.st-badge{display:inline-block;padding:2pt 8pt;border-radius:8pt;font-size:8.5pt;font-weight:700;margin-top:4pt}
.st-paid{background:rgba(5,150,105,.12);color:#059669}
.st-pending{background:rgba(107,114,128,.12);color:#6b7280}
.st-partial{background:rgba(217,140,13,.12);color:#d98c0d}
.st-cancelled{background:rgba(220,38,38,.12);color:#dc2626}
.blue-sep{border:none;border-top:2pt solid #122d5f;margin:8pt 0 14pt}
.cust-box{background:#f1f5f9;border:.5pt solid #e5e7eb;padding:8pt 12pt;margin-bottom:14pt;border-radius:3pt}
.cust-box h3{font-size:12pt;color:#122d5f;margin-bottom:6pt}
.cust-row{display:flex;gap:24pt;font-size:10pt;margin-bottom:3pt}
.cust-row .lbl{color:#6b7280}
.cust-row .val{font-weight:700;color:#111827;margin-right:4pt}
.sec-bar{background:#122d5f;color:#fff;padding:4pt 10pt;font-size:10pt;font-weight:700;border-radius:2pt 2pt 0 0}
.ltbl{width:100%;border-collapse:collapse;margin-bottom:14pt;table-layout:fixed}
.ltbl th{background:#f1f5f9;color:#6b7280;font-size:8.5pt;font-weight:700;padding:5pt 3pt;border-bottom:1pt solid #e5e7eb;text-align:center}
.ltbl td{padding:6pt 3pt;border-bottom:.3pt solid #e5e7eb;vertical-align:top;text-align:center;font-size:9pt}
.ltbl tbody tr:nth-child(even){background:#f8fafc}
.c-num{width:28pt}.c-glass{width:120pt;text-align:right!important}.c-dim{width:70pt}.c-area{width:55pt}.c-qty{width:35pt}.c-ops{width:130pt;text-align:right!important}.c-tot{width:77pt}
.g-name{font-weight:700;font-size:10pt}
.g-det{font-size:7.5pt;color:#6b7280;margin-top:1pt}
.dim-v{direction:ltr;display:inline-block}
.dim-u{font-size:7.5pt;color:#6b7280}
.area-u{font-size:7.5pt;color:#6b7280}
.qty-v{font-size:12pt;font-weight:700}
.op-ln{font-size:8pt;color:#111827;margin-bottom:1pt}
.line-note{font-size:7.5pt;color:#92400e;background:#fffbeb;padding:2pt 4pt;border-radius:2pt;margin-top:2pt;display:inline-block}
.lt-v{font-weight:700;color:#059669;font-size:10pt}
.lt-sub{font-size:7pt;color:#6b7280;margin-top:1pt}
.tot-wrap{display:flex;justify-content:flex-start;margin-bottom:14pt}
.tot-box{width:240pt;background:#f1f5f9;border:1pt solid #e5e7eb;padding:8pt 10pt;border-radius:3pt}
.tot-r{display:flex;justify-content:space-between;align-items:baseline;padding:3pt 0;font-size:10pt}
.tot-r .lbl{color:#6b7280}
.tot-r .val{font-weight:700;direction:ltr;text-align:left}
.tot-div{border:none;border-top:2pt solid #2563eb;margin:4pt 0}
.tot-rem{display:flex;justify-content:space-between;align-items:baseline;padding:3pt 0;font-size:12pt;font-weight:700}
.tot-rem .val{direction:ltr;text-align:left}
.c-green{color:#059669}.c-red{color:#dc2626}.c-dark{color:#111827}
.ptbl{width:100%;border-collapse:collapse;margin-bottom:14pt}
.ptbl th{background:#f1f5f9;color:#6b7280;font-size:8.5pt;font-weight:700;padding:4pt 8pt;border-bottom:.5pt solid #e5e7eb}
.ptbl td{padding:4pt 8pt;font-size:8.5pt;border-bottom:.3pt solid #e5e7eb}
.ptbl tbody tr:nth-child(even){background:#f8fafc}
.pay-amt{font-weight:700;color:#059669;direction:ltr}
.notes{background:#fffbeb;border:1pt solid #f2d96a;padding:8pt 10pt;margin-bottom:14pt;border-radius:3pt}
.notes h4{font-size:8.5pt;color:#92400e;margin-bottom:3pt}
.notes p{font-size:8.5pt;color:#78350f}
.ftr{border-top:.5pt solid #e5e7eb;padding-top:6pt;text-align:center;font-size:8.5pt;color:#6b7280;margin-top:auto}
.toolbar{position:fixed;top:0;left:0;right:0;background:#1e293b;color:#fff;padding:8px 16px;display:flex;align-items:center;gap:12px;z-index:1000;direction:rtl}
.toolbar button{background:#2563eb;color:#fff;border:none;padding:6px 20px;border-radius:6px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:700}
.toolbar button:hover{background:#1d4ed8}
.toolbar span{font-size:13px;color:#94a3b8}
@media print{.toolbar{display:none!important}.page{padding-bottom:0}}
@media screen{body{background:#94a3b8;padding-top:52px}.page{background:#fff;max-width:210mm;margin:8mm auto;padding:15mm;box-shadow:0 2px 12px rgba(0,0,0,.2)}}
`;

// ── Render one invoice copy ──────────────────────────────────

function renderCopy(invoice, lines, payments, customer, co, invNum, copyLabel, showNotes) {
    const stCls = statusClass(invoice.status);
    const stTxt = statusLabel(invoice.status);

    // Top section: logo + invoice number centered
    let h = `<div class="page">
  <div class="hdr-top">`;

    if (co.logoUrl) {
        h += `\n    <img class="hdr-top-logo" src="${esc(co.logoUrl)}" alt=""><br>`;
    }

    h += `\n    <div class="inv-num">${esc(invNum)}</div>`;
    h += `\n    <div class="copy-lbl">${esc(copyLabel)}</div>`;
    h += `\n  </div>`;

    // Second row: company info (right) + date/status (left)
    h += `\n  <div class="hdr">
    <div class="hdr-r">`;

    const companyName = co.companyNameArabic || co.companyName || '';
    if (companyName) h += `\n      <div class="co-name">${esc(companyName)}</div>`;
    if (co.address) h += `\n      <div class="co-det">${esc(co.address)}</div>`;
    if (co.phone) h += `\n      <div class="co-det">هاتف: <span dir="ltr">${esc(co.phone)}</span></div>`;
    if (co.taxId) h += `\n      <div class="co-det">س.ض: <span dir="ltr">${esc(co.taxId)}</span></div>`;

    h += `
    </div>
    <div class="hdr-l">
      <div class="inv-date">${esc(fmtDate(invoice.issueDate))}</div>
      <div class="st-badge ${stCls}">${esc(stTxt)}</div>
    </div>
  </div>
  <hr class="blue-sep">`;

    // Customer
    h += `
  <div class="cust-box">
    <h3>بيانات العميل</h3>
    <div class="cust-row">
      <div><span class="lbl">الاسم:</span> <span class="val">${esc(customer.name || '-')}</span></div>
      <div><span class="lbl">النوع:</span> <span class="val">${esc(custTypeLabel(customer.customerType))}</span></div>
    </div>`;
    if (customer.phone || customer.address) {
        h += `\n    <div class="cust-row">`;
        if (customer.phone) h += `\n      <div><span class="lbl">هاتف:</span> <span class="val" dir="ltr">${esc(customer.phone)}</span></div>`;
        if (customer.address) h += `\n      <div><span class="lbl">العنوان:</span> <span class="val">${esc(customer.address)}</span></div>`;
        h += `\n    </div>`;
    }
    h += `\n  </div>`;

    // Lines table
    h += `
  <div class="sec-bar">بنود الفاتورة (${lines.length})</div>
  <table class="ltbl">
    <thead><tr>
      <th class="c-num">#</th>
      <th class="c-glass">نوع الزجاج</th>
      <th class="c-dim">الأبعاد</th>
      <th class="c-area">المساحة</th>
      <th class="c-qty">الكمية</th>
      <th class="c-ops">العمليات</th>
      <th class="c-tot">الإجمالي</th>
    </tr></thead>
    <tbody>`;

    lines.forEach((line, idx) => {
        const gt = line.glassType || {};
        const ops = line.operations || [];
        const dim = getDim(line);

        let gc = `<div class="g-name">${esc(gt.name || 'زجاج')}</div>`;
        const tp = [];
        if (gt.thickness) tp.push(fmtNum(gt.thickness) + ' مم');
        if (gt.color) tp.push(gt.color);
        if (tp.length) gc += `<div class="g-det">${esc(tp.join(' | '))}</div>`;

        const dc = `<div class="dim-v">${esc(fmtNum(dim.width))} \u00D7 ${esc(fmtNum(dim.height))}</div><div class="dim-u">${esc(unitLabel(dim.unit))}</div>`;

        const av = line.areaM2 != null ? fmtNum(line.areaM2) : '-';
        const ac = `<div>${esc(av)}</div><div class="area-u">م\u00B2</div>`;

        let oc = '';
        if (ops.length > 0) {
            oc = ops.map(op => `<div class="op-ln">${esc(getOpDisplay(op))}</div>`).join('');
        } else {
            oc = '<span style="color:#6b7280">-</span>';
        }
        if (line.notes) {
            oc += `<div class="line-note">${esc(line.notes)}</div>`;
        }

        let tc = `<div class="lt-v">${esc(fmtCurrency(line.lineTotal))}</div>`;
        const opsTot = ops.reduce((s, op) => s + (parseFloat(op.price) || 0), 0);
        const gOnly = parseFloat(line.glassPrice) || 0;
        if (gOnly > 0 || opsTot > 0) {
            const sp = [];
            if (gOnly > 0) sp.push('زجاج ' + fmtCurrency(gOnly));
            if (opsTot > 0) sp.push('عمل ' + fmtCurrency(opsTot));
            tc += `<div class="lt-sub">${esc(sp.join(' + '))}</div>`;
        }

        h += `
      <tr>
        <td class="c-num">${idx + 1}</td>
        <td class="c-glass">${gc}</td>
        <td class="c-dim">${dc}</td>
        <td class="c-area">${ac}</td>
        <td class="c-qty"><div class="qty-v">${line.quantity || 1}</div></td>
        <td class="c-ops">${oc}</td>
        <td class="c-tot">${tc}</td>
      </tr>`;
    });

    h += `
    </tbody>
  </table>`;

    // Totals
    const rem = invoice.remainingBalance || 0;
    const remCls = rem > 0 ? 'c-red' : 'c-green';

    h += `
  <div class="tot-wrap">
    <div class="tot-box">
      <div class="tot-r">
        <span class="lbl">الإجمالي:</span>
        <span class="val c-dark">${esc(fmtCurrency(invoice.totalPrice))} ج.م</span>
      </div>
      <div class="tot-r">
        <span class="lbl">المدفوع:</span>
        <span class="val c-green">${esc(fmtCurrency(invoice.amountPaidNow))} ج.م</span>
      </div>
      <hr class="tot-div">
      <div class="tot-rem">
        <span class="lbl c-dark">المتبقي:</span>
        <span class="val ${remCls}">${esc(fmtCurrency(rem))} ج.م</span>
      </div>
    </div>
  </div>`;

    // Payments
    if (payments.length > 0) {
        h += `
  <div class="sec-bar">سجل المدفوعات (${payments.length})</div>
  <table class="ptbl">
    <thead><tr>
      <th style="text-align:right">التاريخ</th>
      <th style="text-align:center">طريقة الدفع</th>
      <th style="text-align:left">المبلغ</th>
    </tr></thead>
    <tbody>`;
        payments.forEach((p) => {
            h += `
      <tr>
        <td style="text-align:right">${esc(fmtDate(p.paymentDate))}</td>
        <td style="text-align:center">${esc(payMethodLabel(p.paymentMethod))}</td>
        <td style="text-align:left" class="pay-amt">${esc(fmtCurrency(p.amount))} ج.م</td>
      </tr>`;
        });
        h += `
    </tbody>
  </table>`;
    }

    // Notes (shop copy only)
    if (showNotes && invoice.notes) {
        h += `
  <div class="notes">
    <h4>ملاحظات</h4>
    <p>${esc(invoice.notes)}</p>
  </div>`;
    }

    // Footer
    const footerText = co.footerText || 'شكراً لتعاملكم معنا';
    h += `
  <div class="ftr">${esc(footerText)}</div>
</div>`;

    return h;
}

// ── Main export ──────────────────────────────────────────────

/**
 * Generate invoice as a complete HTML document string.
 * Produces 2 page sections: client copy + shop copy.
 * Browser's native BiDi handles all Arabic/English/currency rendering.
 *
 * @param {Object} invoice  - Full invoice with customer, lines, payments
 * @param {Object} company  - Company profile
 * @returns {string} Complete HTML document
 */
export function generateInvoiceHTML(invoice, company) {
    const lines = invoice.lines || [];
    const payments = invoice.payments || [];
    const customer = invoice.customer || {};
    const co = company || {};
    const invNum = invoice.readableId || String(invoice.invoiceNumber ?? '');

    const clientCopy = renderCopy(invoice, lines, payments, customer, co, invNum, 'نسخة العميل', false);
    const shopCopy = renderCopy(invoice, lines, payments, customer, co, invNum, 'نسخة المحل', true);

    return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>فاتورة ${esc(invNum)}</title>
<style>${CSS}</style>
</head>
<body>
<div class="toolbar">
  <button onclick="window.print()">طباعة</button>
  <span>معاينة الفاتورة</span>
</div>
${clientCopy}
${shopCopy}
</body>
</html>`;
}
