"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut, AlertCircle } from "lucide-react";
import "react-pdf/dist/Page/TextLayer.css";
import { Highlight, HighlightRect } from "@/hooks/useHighlights";

// Configure PDF.js worker using the official unpkg CDN matching the current pdf.js version
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfReaderProps {
  file: string;
  initialPage: number;
  scale: number;
  onPageChange: (page: number, total: number) => void;
  onSaveImmediately: (page: number, total: number) => void;
  readingMode: "page" | "scroll";
  showOverlay?: boolean;
  isFullscreen?: boolean;
  highlights: Highlight[];
  onAddHighlight: (pageNumber: number, text: string, color: "yellow" | "green" | "pink" | "blue" | "purple", rects: HighlightRect[]) => Promise<void>;
  onDeleteHighlight: (highlightId: string) => Promise<void>;
}

export default function PdfReader({
  file,
  initialPage,
  scale,
  onPageChange,
  onSaveImmediately,
  readingMode,
  showOverlay = true,
  isFullscreen = false,
  highlights = [],
  onAddHighlight,
  onDeleteHighlight,
}: PdfReaderProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(initialPage || 1);
  const [loading, setLoading] = useState(true);

  // Setup options for standard fonts and cmaps using unpkg CDN matching pdf.js version
  const options = useMemo(() => ({
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
  }), []);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(() => {
    if (typeof window !== "undefined") {
      return Math.min(window.innerWidth, 896); // Capped at max-w-4xl (896px)
    }
    return 0;
  });

  // Track container width dynamically for responsive PDF rendering
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerWidth(entries[0].contentRect.width);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const resolvedWidth = readingMode === "scroll" 
    ? Math.min(containerWidth, 672) // Capped at max-w-2xl (672px)
    : Math.min(containerWidth, 896); // Capped at max-w-4xl (896px)

  // Highlighter States
  const [selectedText, setSelectedText] = useState<string>("");
  const [selectionRects, setSelectionRects] = useState<HighlightRect[]>([]);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const selectedPageNumRef = useRef<number>(1);

  const handleSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setMenuPosition(null);
      return;
    }

    const text = selection.toString();
    const range = selection.getRangeAt(0);

    // Ensure selection is inside the PDF page
    let node = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode!;
    }
    const htmlElement = node as HTMLElement;
    if (!htmlElement.closest(".react-pdf__Page")) {
      return;
    }

    const pageEl = htmlElement.closest(".react-pdf__Page") as HTMLElement;
    
    let pageNum = pageNumber;
    if (readingMode === "scroll") {
      const pageWrapper = htmlElement.closest("[id^='page-']") as HTMLElement;
      if (pageWrapper) {
        pageNum = parseInt(pageWrapper.id.replace("page-", ""), 10);
      }
    }

    const pageRect = pageEl.getBoundingClientRect();
    const clientRects = range.getClientRects();
    const relativeRects: HighlightRect[] = Array.from(clientRects).map((rect) => ({
      left: (rect.left - pageRect.left) / scale,
      top: (rect.top - pageRect.top) / scale,
      width: rect.width / scale,
      height: rect.height / scale,
    }));

    const rangeRect = range.getBoundingClientRect();
    const menuX = rangeRect.left + rangeRect.width / 2;
    const menuY = rangeRect.top - 48;

    setSelectedText(text);
    setSelectionRects(relativeRects);
    setMenuPosition({ x: menuX, y: menuY });
    selectedPageNumRef.current = pageNum;
  };

  const handleCreateHighlight = async (color: "yellow" | "green" | "pink" | "blue" | "purple") => {
    if (!selectedText || selectionRects.length === 0) return;

    await onAddHighlight(
      selectedPageNumRef.current,
      selectedText,
      color,
      selectionRects
    );

    window.getSelection()?.removeAllRanges();
    setMenuPosition(null);
    setSelectedText("");
    setSelectionRects([]);
  };

  const renderPageHighlights = (pageNum: number) => {
    const pageHighlights = highlights.filter((hl) => hl.pageNumber === pageNum);

    return pageHighlights.map((hl) => {
      return hl.rects.map((rect, idx) => (
        <div
          key={`${hl.id}-${idx}`}
          onClick={(e) => {
            e.stopPropagation();
            const confirmDelete = window.confirm("Hapus highlight ini?");
            if (confirmDelete) {
              onDeleteHighlight(hl.id);
            }
          }}
          className={`absolute cursor-pointer mix-blend-multiply dark:mix-blend-screen opacity-50 dark:opacity-40 transition-opacity hover:opacity-75 z-10 ${
            hl.color === "yellow" ? "bg-yellow-400" :
            hl.color === "green" ? "bg-green-400" :
            hl.color === "pink" ? "bg-pink-400" :
            hl.color === "blue" ? "bg-sky-400" : "bg-purple-400"
          }`}
          style={{
            left: `${rect.left * scale}px`,
            top: `${rect.top * scale}px`,
            width: `${rect.width * scale}px`,
            height: `${rect.height * scale}px`,
          }}
          title={`Highlight: "${hl.text}" (Klik untuk hapus)`}
        />
      ));
    });
  };

  // Swipe States for Pagination Mode
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [slideAnimation, setSlideAnimation] = useState<string>("");

  const currentPageRef = useRef(pageNumber);
  const totalPagesRef = useRef(numPages);

  // Sync refs with state changes
  useEffect(() => {
    currentPageRef.current = pageNumber;
  }, [pageNumber]);

  useEffect(() => {
    totalPagesRef.current = numPages;
  }, [numPages]);

  // Sync external page changes (e.g. user types page in Toolbar)
  useEffect(() => {
    if (initialPage && initialPage !== pageNumber) {
      setSlideAnimation(initialPage > pageNumber ? "animate-slide-in-right" : "animate-slide-in-left");
      setPageNumber(initialPage);
    }
  }, [initialPage]);

  // Save progress immediately on window close, unmount, or switching tabs
  useEffect(() => {
    const handleSave = () => {
      if (currentPageRef.current > 0) {
        onSaveImmediately(currentPageRef.current, totalPagesRef.current);
      }
    };

    window.addEventListener("beforeunload", handleSave);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleSave();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      handleSave(); // save progress when component unmounts
      window.removeEventListener("beforeunload", handleSave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [onSaveImmediately]);

  // Intersection Observer for Scroll Mode to update active page indicator in header
  useEffect(() => {
    if (readingMode !== "scroll" || numPages === 0) return;

    const observerOptions = {
      root: null, // Viewport
      rootMargin: "-25% 0px -55% 0px", // focus on the upper middle region
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const pg = parseInt(entry.target.id.replace("page-", ""), 10);
          if (!isNaN(pg) && pg !== pageNumber) {
            setPageNumber(pg);
            onPageChange(pg, numPages);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all container divs
    for (let pg = 1; pg <= numPages; pg++) {
      const el = document.getElementById(`page-${pg}`);
      if (el) observer.observe(el);
    }

    return () => {
      observer.disconnect();
    };
  }, [readingMode, numPages, onPageChange]);

  // Scroll to active page when switching to Scroll Mode
  useEffect(() => {
    if (readingMode === "scroll" && numPages > 0) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`page-${pageNumber}`);
        if (el) {
          el.scrollIntoView({ behavior: "instant", block: "start" });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [readingMode, numPages]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
    onPageChange(pageNumber, numPages);
  }

  function onDocumentLoadError(err: Error) {
    console.error("PDF load error:", err);
    setError("Failed to load PDF book. Please check if the file exists.");
    setLoading(false);
  }

  const changePage = (offset: number) => {
    const newPage = pageNumber + offset;
    if (newPage >= 1 && newPage <= numPages) {
      setSlideAnimation(offset > 0 ? "animate-slide-in-right" : "animate-slide-in-left");
      setPageNumber(newPage);
      onPageChange(newPage, numPages);
    }
  };

  // Touch handlers for mobile swipes in page mode
  const handleTouchStart = (e: React.TouchEvent) => {
    if (readingMode !== "page") return;
    setTouchStartX(e.touches[0].clientX);
    setIsDragging(true);
    setSlideAnimation(""); // Reset transition classes on touch start
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (readingMode !== "page" || touchStartX === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX;
    
    // Apply resistance if trying to swipe past first or last page
    if (pageNumber === 1 && diff > 0) {
      setOffsetX(diff / 3);
    } else if (pageNumber === numPages && diff < 0) {
      setOffsetX(diff / 3);
    } else {
      setOffsetX(diff);
    }
  };

  const handleTouchEnd = () => {
    if (readingMode !== "page" || touchStartX === null) return;
    setIsDragging(false);
    
    const threshold = 70; // swipe threshold in px
    if (offsetX < -threshold && pageNumber < numPages) {
      // Swipe Left -> Next Page
      setSlideAnimation("animate-slide-in-right");
      const newPage = pageNumber + 1;
      setPageNumber(newPage);
      onPageChange(newPage, numPages);
    } else if (offsetX > threshold && pageNumber > 1) {
      // Swipe Right -> Prev Page
      setSlideAnimation("animate-slide-in-left");
      const newPage = pageNumber - 1;
      setPageNumber(newPage);
      onPageChange(newPage, numPages);
    }
    
    setOffsetX(0);
    setTouchStartX(null);
  };

  // Keyboard controls: ArrowLeft/ArrowRight to paginate (Only in Page mode)
  useEffect(() => {
    if (readingMode !== "page") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        changePage(-1);
      } else if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        changePage(1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pageNumber, numPages, readingMode]);

  return (
    <div className="flex flex-col items-center justify-between flex-grow w-full bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-3.5rem)] py-0 sm:py-6 relative">
      {/* PDF Viewport Area */}
      <div 
        ref={containerRef}
        onMouseUp={handleSelection}
        onTouchEnd={handleSelection}
        className="flex-grow flex items-center justify-start sm:justify-center w-full px-0 sm:px-4 overflow-auto no-scrollbar max-w-4xl"
      >
        {error ? (
          <div className="flex flex-col items-center gap-3 p-6 text-center max-w-sm rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50">
            <AlertCircle className="text-red-600 dark:text-red-400" size={32} />
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Unable to load Book</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
          </div>
        ) : readingMode === "page" ? (
          /* Pagination Mode: Single Page with Swipe and Click Navigation */
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              transform: `translateX(${offsetX}px)`,
              transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            className={`bg-white dark:bg-slate-900 shadow-none sm:shadow-md rounded-none sm:rounded-lg border-0 sm:border border-slate-200 dark:border-slate-800 p-0 sm:p-4 transition-colors duration-300 w-full sm:w-auto ${isDragging ? "select-none" : ""} ${slideAnimation}`}
          >
            <Document
              file={file}
              options={options}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex flex-col items-center gap-2 py-20 px-10">
                  <Loader2 className="animate-spin text-amber-600 dark:text-amber-500" size={28} />
                  <span className="text-xs text-slate-500 font-medium">Opening book...</span>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                width={resolvedWidth ? resolvedWidth * scale : undefined}
                renderTextLayer={true}
                renderAnnotationLayer={false}
                className="max-w-full relative"
                loading={
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-amber-600 dark:text-amber-500" size={24} />
                  </div>
                }
              >
                {renderPageHighlights(pageNumber)}
              </Page>
            </Document>
          </div>
        ) : (
          /* Continuous Scroll Mode: Vertical stacking list of pages */
          <div className="flex flex-col items-center w-full max-w-2xl px-0 sm:px-2 py-0 sm:py-2 overflow-y-auto no-scrollbar">
            <Document
              file={file}
              options={options}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex flex-col items-center gap-2 py-20 px-10">
                  <Loader2 className="animate-spin text-amber-600 dark:text-amber-500" size={28} />
                  <span className="text-xs text-slate-500 font-medium">Opening book...</span>
                </div>
              }
            >
              {Array.from({ length: numPages }, (_, i) => i + 1).map((pg) => {
                // Pruning check: only render PDF page canvas for active page and its immediate neighbors (prev & next)
                const isPageVisible = Math.abs(pg - pageNumber) <= 1;
                
                return (
                  <div
                    key={pg}
                    id={`page-${pg}`}
                    className="my-1 sm:my-5 shadow-none sm:shadow bg-white dark:bg-slate-900 border-0 sm:border border-slate-200 dark:border-slate-800 rounded-none sm:rounded-lg overflow-hidden w-full transition-colors duration-300"
                    style={{ minHeight: `${550 * scale}px` }}
                  >
                    {isPageVisible ? (
                      <Page
                        pageNumber={pg}
                        width={resolvedWidth ? resolvedWidth * scale : undefined}
                        renderTextLayer={true}
                        renderAnnotationLayer={false}
                        className="w-full flex justify-center relative"
                        loading={
                          <div className="flex items-center justify-center py-20" style={{ height: `${550 * scale}px` }}>
                            <Loader2 className="animate-spin text-amber-600 dark:text-amber-500" size={24} />
                          </div>
                        }
                      >
                        {renderPageHighlights(pg)}
                      </Page>
                    ) : (
                      <div
                        className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-xs gap-1 select-none font-mono"
                        style={{ height: `${550 * scale}px` }}
                      >
                        <Loader2 className="animate-spin text-slate-200 dark:text-slate-800" size={16} />
                        <span>Halaman {pg}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </Document>
          </div>
        )}
      </div>

      {/* Floating Bottom Nav Controls (Only shown in Pagination Mode) */}
      {!error && !loading && numPages > 0 && readingMode === "page" && (
        <div 
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-white/90 dark:bg-slate-900/90 shadow-lg backdrop-blur border border-slate-200 dark:border-slate-800 px-5 py-2.5 rounded-full select-none transition-all duration-300 ${
            !showOverlay && isFullscreen 
              ? "translate-y-24 opacity-0 pointer-events-none" 
              : "translate-y-0 opacity-100"
          }`}
        >
          <button
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 transition-colors cursor-pointer"
            title="Previous Page (ArrowLeft)"
          >
            <ChevronLeft size={20} />
          </button>
          
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
            {pageNumber} / {numPages}
          </span>

          <button
            onClick={() => changePage(1)}
            disabled={pageNumber >= numPages}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 transition-colors cursor-pointer"
            title="Next Page (ArrowRight)"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Floating Highlight Toolbar */}
      {menuPosition && (
        <div 
          onMouseDown={(e) => e.preventDefault()}
          className="fixed z-50 flex items-center gap-2 bg-slate-900/95 dark:bg-slate-950/95 text-white shadow-xl px-3 py-1.5 rounded-full border border-slate-700 backdrop-blur"
          style={{ 
            left: `${menuPosition.x}px`, 
            top: `${menuPosition.y}px`, 
            transform: "translateX(-50%)" 
          }}
        >
          {["yellow", "green", "pink", "blue", "purple"].map((color) => {
            const colorClasses: Record<string, string> = {
              yellow: "bg-yellow-400 border-yellow-300 hover:bg-yellow-300",
              green: "bg-green-400 border-green-300 hover:bg-green-300",
              pink: "bg-pink-400 border-pink-300 hover:bg-pink-300",
              blue: "bg-sky-400 border-sky-300 hover:bg-sky-300",
              purple: "bg-purple-400 border-purple-300 hover:bg-purple-300",
            };
            return (
              <button
                key={color}
                onClick={() => handleCreateHighlight(color as any)}
                className={`w-6 h-6 rounded-full border cursor-pointer transition-transform hover:scale-110 active:scale-95 ${colorClasses[color]}`}
                title={`Highlight ${color}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
