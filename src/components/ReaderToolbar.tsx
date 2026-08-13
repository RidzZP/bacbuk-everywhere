import React from "react";
import Link from "next/link";
import { ArrowLeft, ZoomIn, ZoomOut, Maximize2, Minimize2, ChevronsUpDown, BookOpen } from "lucide-react";

interface ReaderToolbarProps {
  title: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  scale: number;
  onScaleChange: (scale: number) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  readingMode: "page" | "scroll";
  onReadingModeChange: (mode: "page" | "scroll") => void;
}

export default function ReaderToolbar({
  title,
  currentPage,
  totalPages,
  onPageChange,
  scale,
  onScaleChange,
  isFullscreen,
  onToggleFullscreen,
  readingMode,
  onReadingModeChange,
}: ReaderToolbarProps) {
  const handlePageInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const val = parseInt(e.currentTarget.value, 10);
      if (!isNaN(val) && val >= 1 && val <= totalPages) {
        onPageChange(val);
      } else {
        e.currentTarget.value = currentPage.toString();
      }
      e.currentTarget.blur();
    }
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between h-14 px-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      {/* Left side: Back to library */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <span className="font-serif font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[120px] sm:max-w-xs md:max-w-md">
          {title}
        </span>
      </div>

      {/* Middle: Page navigation input */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <span className="hidden sm:inline">Page</span>
        <input
          type="text"
          defaultValue={currentPage}
          key={currentPage} // Force input redraw when page changes
          onKeyDown={handlePageInput}
          onBlur={(e) => {
            e.target.value = currentPage.toString();
          }}
          className="w-10 h-7 text-center rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
        />
        <span>of {totalPages || "-"}</span>
      </div>

      {/* Right side: Zoom, Mode Toggle and Fullscreen */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={() => onScaleChange(Math.max(scale - 0.25, 0.5))}
          disabled={scale <= 0.5}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <span className="text-[10px] font-mono text-slate-400 select-none w-10 text-center hidden sm:inline">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => onScaleChange(Math.min(scale + 0.25, 2.5))}
          disabled={scale >= 2.5}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        
        <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

        {/* Reading Mode Toggle */}
        <button
          onClick={() => onReadingModeChange(readingMode === "page" ? "scroll" : "page")}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          title={readingMode === "page" ? "Ubah ke Mode Gulir (Scroll)" : "Ubah ke Mode Paginasi (Buku)"}
        >
          {readingMode === "page" ? <ChevronsUpDown size={16} /> : <BookOpen size={16} />}
        </button>

        <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

        <button
          onClick={onToggleFullscreen}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>
    </header>
  );
}
