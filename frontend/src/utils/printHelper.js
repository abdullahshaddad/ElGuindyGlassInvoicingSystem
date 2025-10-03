// src/utils/printHelper.js

/**
 * Print Helper Utility
 * Handles browser-based printing of PDFs and documents
 */

/**
 * Print a PDF from URL
 * @param {string} pdfUrl - URL or path to the PDF file
 * @param {string} jobName - Optional job name for the print queue
 * @returns {Promise<boolean>} - True if print dialog opened successfully
 */
export const printPDF = async (pdfUrl, jobName = 'Print Job') => {
    try {
        // Method 1: Open PDF in new window and trigger print
        const printWindow = window.open(pdfUrl, '_blank');

        if (!printWindow) {
            throw new Error('فشل في فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة.');
        }

        // Wait for PDF to load, then print
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();

                // Optional: Close window after printing
                printWindow.onafterprint = () => {
                    printWindow.close();
                };
            }, 500);
        };

        return true;
    } catch (error) {
        console.error('Print PDF error:', error);
        throw error;
    }
};

/**
 * Print PDF using iframe (alternative method)
 * @param {string} pdfUrl - URL or path to the PDF file
 * @returns {Promise<boolean>}
 */
export const printPDFViaIframe = async (pdfUrl) => {
    try {
        // Create hidden iframe
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = pdfUrl;

        document.body.appendChild(iframe);

        // Wait for load and print
        iframe.onload = () => {
            setTimeout(() => {
                try {
                    iframe.contentWindow.print();

                    // Remove iframe after print
                    setTimeout(() => {
                        document.body.removeChild(iframe);
                    }, 1000);
                } catch (e) {
                    console.error('Failed to print via iframe:', e);
                    document.body.removeChild(iframe);
                }
            }, 500);
        };

        return true;
    } catch (error) {
        console.error('Print via iframe error:', error);
        throw error;
    }
};

/**
 * Fetch PDF and print using Blob
 * Best for authenticated requests or CORS issues
 * @param {string} pdfUrl - URL to fetch PDF from
 * @param {Object} options - Fetch options (headers, etc.)
 * @returns {Promise<boolean>}
 */
export const fetchAndPrintPDF = async (pdfUrl, options = {}) => {
    try {
        // Fetch PDF with authentication
        const response = await fetch(pdfUrl, {
            ...options,
            headers: {
                'Authorization': localStorage.getItem('token')
                    ? `Bearer ${localStorage.getItem('token')}`
                    : '',
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch PDF: ${response.statusText}`);
        }

        // Convert to blob
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        // Create iframe and print
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = blobUrl;

        document.body.appendChild(iframe);

        iframe.onload = () => {
            setTimeout(() => {
                try {
                    iframe.contentWindow.print();

                    // Cleanup
                    setTimeout(() => {
                        document.body.removeChild(iframe);
                        URL.revokeObjectURL(blobUrl);
                    }, 1000);
                } catch (e) {
                    console.error('Failed to print:', e);
                    document.body.removeChild(iframe);
                    URL.revokeObjectURL(blobUrl);
                }
            }, 500);
        };

        return true;
    } catch (error) {
        console.error('Fetch and print error:', error);
        throw error;
    }
};

/**
 * Print HTML content directly
 * @param {string} htmlContent - HTML content to print
 * @param {string} title - Document title
 * @returns {Promise<boolean>}
 */
export const printHTML = (htmlContent, title = 'Print') => {
    try {
        const printWindow = window.open('', '_blank');

        if (!printWindow) {
            throw new Error('فشل في فتح نافذة الطباعة');
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>${title}</title>
                <style>
                    @media print {
                        body { margin: 0; padding: 20px; }
                        @page { margin: 1cm; }
                    }
                    body { 
                        font-family: 'Arial', sans-serif;
                        direction: rtl;
                    }
                </style>
            </head>
            <body>
                ${htmlContent}
            </body>
            </html>
        `);

        printWindow.document.close();

        setTimeout(() => {
            printWindow.print();
            printWindow.onafterprint = () => {
                printWindow.close();
            };
        }, 250);

        return true;
    } catch (error) {
        console.error('Print HTML error:', error);
        throw error;
    }
};

/**
 * Download PDF instead of printing (fallback)
 * @param {string} pdfUrl - URL to PDF
 * @param {string} filename - Filename for download
 */
export const downloadPDF = (pdfUrl, filename = 'document.pdf') => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export default {
    printPDF,
    printPDFViaIframe,
    fetchAndPrintPDF,
    printHTML,
    downloadPDF
};