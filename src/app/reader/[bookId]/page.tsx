"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { getBookById } from "@/lib/books";
import ReaderToolbar from "@/components/ReaderToolbar";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

const PdfReader = dynamic(() => import("@/components/PdfReader"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[calc(100vh-3.5rem)] w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="animate-spin text-amber-600 dark:text-amber-500" size={32} />
        <span className="text-sm text-slate-500 font-medium">Initializing reader engine...</span>
      </div>
    </div>
  ),
});

export default function ReaderPage({ params }: { params: Promise<{ bookId: string }> }) {
  const resolvedParams = use(params);
  const bookId = resolvedParams.bookId;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const book = getBookById(bookId);
  const { progress, loading: progressLoading, saveProgress, saveProgressImmediately } = useReadingProgress(
    user?.uid,
    bookId
  );

  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [readingMode, setReadingMode] = useState<"page" | "scroll">("page");

  // Adjust default scale on mobile to fit page width
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setScale(0.55);
    }
  }, []);

  // Sync initial page once progress is loaded
  useEffect(() => {
    if (progress && progress.currentPage) {
      setActivePage(progress.currentPage);
    }
  }, [progressLoading, progress]);

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Toggle Fullscreen handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Sync fullscreen state if changed externally (e.g. Escape key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handlePageChange = (page: number, total?: number) => {
    setActivePage(page);
    if (total) {
      setTotalPages(total);
    }
    // Trigger debounced save progress
    saveProgress(page, total || totalPages, book?.title || "Untitled Book");
  };

  const handleSaveImmediately = (page: number, total: number) => {
    saveProgressImmediately(page, total, book?.title || "Untitled Book");
  };

  if (authLoading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="animate-spin text-amber-600 dark:text-amber-500" size={32} />
          <span className="text-sm text-slate-500 font-medium">Checking authorization...</span>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-md">
          <AlertCircle className="text-red-500" size={40} />
          <h2 className="font-serif font-bold text-xl text-slate-800 dark:text-slate-105">Book Not Found</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            The book you are looking for doesn't exist in our catalog.
          </p>
          <Link
            href="/"
            className="rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
          >
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  // Wait for reading progress to load to avoid resetting page to 1
  if (progressLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="animate-spin text-amber-600 dark:text-amber-500" size={32} />
          <span className="text-sm text-slate-500 font-medium">Syncing reading progress...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <ReaderToolbar
        title={book.title}
        currentPage={activePage}
        totalPages={totalPages}
        onPageChange={(page) => handlePageChange(page, totalPages)}
        scale={scale}
        onScaleChange={setScale}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        readingMode={readingMode}
        onReadingModeChange={setReadingMode}
      />
      <main className="flex-grow flex flex-col">
        <PdfReader
          file={book.file}
          initialPage={activePage}
          scale={scale}
          onPageChange={handlePageChange}
          onSaveImmediately={handleSaveImmediately}
          readingMode={readingMode}
        />
      </main>
    </div>
  );
}
