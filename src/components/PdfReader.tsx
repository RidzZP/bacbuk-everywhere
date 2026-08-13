"use client";

import React, { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";

// Configure PDF.js worker using the local file in public/
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface PdfReaderProps {
  file: string;
  initialPage: number;
  scale: number;
  onPageChange: (page: number, total: number) => void;
  onSaveImmediately: (page: number, total: number) => void;
  readingMode: "page" | "scroll";
}

export default function PdfReader({
  file,
  initialPage,
  scale,
  onPageChange,
  onSaveImmediately,
  readingMode,
}: PdfReaderProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(initialPage || 1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <div className="flex flex-col items-center justify-between flex-grow w-full bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-3.5rem)] py-6 relative">
      {/* PDF Viewport Area */}
      <div className="flex-grow flex items-center justify-center w-full px-4 overflow-auto max-w-4xl">
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
            className={`bg-white dark:bg-slate-900 shadow-md rounded-lg border border-slate-200 dark:border-slate-800 p-2 sm:p-4 transition-colors duration-300 select-none ${slideAnimation}`}
          >
            <Document
              file={file}
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
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="max-w-full"
                loading={
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-amber-600 dark:text-amber-500" size={24} />
                  </div>
                }
              />
            </Document>
          </div>
        ) : (
          /* Continuous Scroll Mode: Vertical stacking list of pages */
          <div className="flex flex-col items-center w-full max-w-2xl px-2 py-2">
            <Document
              file={file}
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
                    className="my-5 shadow bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden w-full transition-colors duration-300"
                    style={{ minHeight: `${550 * scale}px` }}
                  >
                    {isPageVisible ? (
                      <Page
                        pageNumber={pg}
                        scale={scale}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="w-full flex justify-center"
                        loading={
                          <div className="flex items-center justify-center py-20" style={{ height: `${550 * scale}px` }}>
                            <Loader2 className="animate-spin text-amber-600 dark:text-amber-500" size={24} />
                          </div>
                        }
                      />
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
        <div className="sticky bottom-4 z-40 mt-4 flex items-center gap-4 bg-white/90 dark:bg-slate-900/90 shadow-lg backdrop-blur border border-slate-200 dark:border-slate-800 px-5 py-2.5 rounded-full select-none">
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
    </div>
  );
}
