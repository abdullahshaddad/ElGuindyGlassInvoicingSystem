// src/services/printService.js
// Generates invoice/sticker HTML and opens in a new tab for printing.
// Uses browser's native rendering for perfect Arabic BiDi support.

import {useConvex} from "convex/react";
import {api} from "@convex/_generated/api";
import {useCallback} from "react";
import {generateInvoiceHTML} from "@utils/printTemplates/invoiceTemplate";
import {generateStickerHTML, generateAllStickersHTML} from "@utils/printTemplates/stickerTemplate";

/**
 * Opens a new browser tab immediately (to avoid popup-blocker),
 * shows a loading page while data is fetched.
 */
function openLoadingTab(title) {
    const win = window.open('', '_blank');
    if (!win) {
        throw new Error('فشل في فتح نافذة المعاينة. يرجى السماح بالنوافذ المنبثقة.');
    }
    win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><title>${title}</title>
<style>
body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f8fafc;direction:rtl}
.spinner{width:48px;height:48px;border:4px solid #e2e8f0;border-top-color:#3b82f6;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 16px}
@keyframes spin{to{transform:rotate(360deg)}}
.text{color:#64748b;font-size:16px;text-align:center}
</style></head>
<body><div><div class="spinner"></div><div class="text">جاري إنشاء الملف...</div></div></body>
</html>`);
    win.document.close();
    return win;
}

/**
 * Replace the loading tab content with generated HTML.
 * Injects a <base> tag so font URLs (/fonts/...) resolve correctly
 * even though the tab's URL is about:blank.
 */
function showHtmlInTab(win, html) {
    const baseTag = `<base href="${window.location.origin}/">`;
    const injected = html.replace('<head>', `<head>\n${baseTag}`);
    win.document.open();
    win.document.write(injected);
    win.document.close();
}

/**
 * Show an error message in the loading tab.
 */
function showErrorInTab(win, message) {
    try {
        win.document.open();
        win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>خطأ</title>
<style>body{font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#fef2f2;text-align:center;direction:rtl}</style></head>
<body><div><h2 style="color:#dc2626">حدث خطأ</h2><p style="color:#991b1b">${message}</p></div></body></html>`);
        win.document.close();
    } catch (e) {
        // Tab may have navigated away
    }
}

// ══════════════════════════════════════════════════════════════
// Hook
// ══════════════════════════════════════════════════════════════

/**
 * Hook that provides print functions for invoices and stickers.
 *
 * Usage:
 *   const { printInvoice, printSticker, printAllStickers } = usePrintInvoice();
 *   await printInvoice(invoiceId, 'CLIENT');
 *   await printSticker(invoiceId, lineId);
 *   await printAllStickers(invoiceId);
 */
export function usePrintInvoice() {
    const convex = useConvex();

    /**
     * Generate and open an invoice in a new tab for printing.
     */
    const printInvoice = useCallback(async (invoiceId, type = 'CLIENT') => {
        const win = openLoadingTab('فاتورة...');
        try {
            const [invoice, companyProfile] = await Promise.all([
                convex.query(api.invoices.queries.getInvoice, {invoiceId}),
                convex.query(api.companyProfile.queries.getCompanyProfile, {}),
            ]);
            if (!invoice) {
                showErrorInTab(win, 'الفاتورة غير موجودة');
                return;
            }
            const html = generateInvoiceHTML(invoice, companyProfile);
            showHtmlInTab(win, html);
        } catch (err) {
            console.error('Print invoice error:', err);
            showErrorInTab(win, err.message || 'خطأ غير متوقع');
            throw err;
        }
    }, [convex]);

    /**
     * Generate and open a single-line sticker in a new tab.
     */
    const printSticker = useCallback(async (invoiceId, lineId) => {
        const win = openLoadingTab('ملصق...');
        try {
            const invoice = await convex.query(api.invoices.queries.getInvoice, {invoiceId});
            if (!invoice) {
                showErrorInTab(win, 'الفاتورة غير موجودة');
                return;
            }
            const html = generateStickerHTML(invoice, lineId);
            showHtmlInTab(win, html);
        } catch (err) {
            console.error('Print sticker error:', err);
            showErrorInTab(win, err.message || 'خطأ غير متوقع');
            throw err;
        }
    }, [convex]);

    /**
     * Generate and open stickers for all lines (one per piece).
     */
    const printAllStickers = useCallback(async (invoiceId) => {
        const win = openLoadingTab('ملصقات...');
        try {
            const invoice = await convex.query(api.invoices.queries.getInvoice, {invoiceId});
            if (!invoice) {
                showErrorInTab(win, 'الفاتورة غير موجودة');
                return;
            }
            const html = generateAllStickersHTML(invoice);
            showHtmlInTab(win, html);
        } catch (err) {
            console.error('Print all stickers error:', err);
            showErrorInTab(win, err.message || 'خطأ غير متوقع');
            throw err;
        }
    }, [convex]);

    return {printInvoice, printSticker, printAllStickers};
}
