/**
 * PDFViewerModal
 *
 * Opens a specific page of an uploaded PDF and highlights the quoted passage.
 * Triggered from evidence blocks in IssueDetailPanel.
 */
import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerModalProps {
  documentId: string;
  documentName: string;
  page: number;
  quote: string | null;
  onClose: () => void;
}

export default function PDFViewerModal({ documentId, documentName, page, quote, onClose }: PDFViewerModalProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(page);
  const [highlighted, setHighlighted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const pdfUrl = `/api/documents/${documentId}/file`;

  // After page renders, find and highlight the quote text in the text layer
  useEffect(() => {
    if (!quote || highlighted) return;
    const timer = setTimeout(() => {
      const textLayer = containerRef.current?.querySelector('.react-pdf__Page__textContent');
      if (!textLayer) return;
      const spans = Array.from(textLayer.querySelectorAll('span'));
      // Normalise quote for matching
      const normalised = quote.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 80);
      let matched = false;
      for (const span of spans) {
        const text = span.textContent?.toLowerCase().replace(/\s+/g, ' ').trim() ?? '';
        if (normalised && text && normalised.includes(text.slice(0, 20)) && text.length > 10) {
          (span as HTMLElement).style.backgroundColor = 'rgba(250, 204, 21, 0.5)';
          (span as HTMLElement).style.borderRadius = '2px';
          if (!matched) {
            span.scrollIntoView({ behavior: 'smooth', block: 'center' });
            matched = true;
          }
        }
      }
      if (matched) setHighlighted(true);
    }, 600); // wait for text layer to render
    return () => clearTimeout(timer);
  }, [currentPage, quote, highlighted]);

  // Reset highlight state when page changes
  useEffect(() => { setHighlighted(false); }, [currentPage]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="relative bg-white rounded-xl shadow-2xl w-[780px] max-w-[95vw] h-[88vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 shrink-0">
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 text-sm truncate">{documentName}</p>
            {quote && (
              <p className="text-xs text-amber-700 mt-0.5 truncate">
                Highlighted: "{quote.slice(0, 80)}{quote.length > 80 ? '…' : ''}"
              </p>
            )}
          </div>
          <button onClick={onClose} className="ml-4 shrink-0 text-slate-400 hover:text-slate-700 text-lg font-bold transition-colors">✕</button>
        </div>

        {/* PDF */}
        <div ref={containerRef} className="flex-1 overflow-auto bg-slate-100 flex justify-center p-4">
          <Document
            file={pdfUrl}
            onLoadSuccess={({ numPages }: { numPages: number }) => setNumPages(numPages)}
            loading={<div className="flex items-center justify-center h-full text-slate-500 text-sm">Loading PDF…</div>}
            error={<div className="flex items-center justify-center h-full text-red-500 text-sm">Could not load PDF.</div>}
          >
            <Page
              pageNumber={currentPage}
              width={700}
              renderTextLayer={true}
              renderAnnotationLayer={false}
            />
          </Document>
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-white shrink-0 rounded-b-xl">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
          <span className="text-sm text-slate-600">Page {currentPage} of {numPages || '…'}</span>
          <button
            onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
            disabled={currentPage >= numPages}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
