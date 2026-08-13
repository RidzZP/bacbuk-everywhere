import React from "react";
import Link from "next/link";
import { BookOpen, Edit, Trash2 } from "lucide-react";
import { MergedBook } from "@/hooks/useBooks";
import ProgressBar from "./ProgressBar";

interface BookCardProps {
  book: MergedBook;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function BookCard({ book, onEdit, onDelete }: BookCardProps) {
  const currentPage = book.currentPage || 0;
  const totalPages = book.totalPages || 0;
  const hasProgress = currentPage > 0 && totalPages > 0;
  
  // Minimalist cover backgrounds based on book id
  const getCoverGradient = (id: string) => {
    if (id.startsWith("custom-")) {
      // Pick a gradient based on the hash of the custom id to keep it consistent
      const charCodeSum = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const mod = charCodeSum % 3;
      if (mod === 0) return "from-amber-50 to-orange-100 dark:from-amber-950/30 dark:to-orange-950/20 border-orange-200 dark:border-orange-900/50";
      if (mod === 1) return "from-sky-50 to-indigo-100 dark:from-sky-950/30 dark:to-indigo-950/20 border-sky-200 dark:border-sky-900/50";
      return "from-emerald-50 to-teal-100 dark:from-emerald-950/30 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-900/50";
    }

    switch (id) {
      case "atomic-habits":
        return "from-amber-50 to-orange-100 dark:from-amber-950/30 dark:to-orange-950/20 border-orange-200 dark:border-orange-900/50";
      case "deep-work":
        return "from-sky-50 to-indigo-100 dark:from-sky-950/30 dark:to-indigo-950/20 border-sky-200 dark:border-sky-900/50";
      case "psychology-of-money":
        return "from-emerald-50 to-teal-100 dark:from-emerald-950/30 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-900/50";
      default:
        return "from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-800";
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col sm:flex-row gap-5 hover:shadow-lg transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-700 group">
      {/* Book Cover */}
      <div className={`w-full sm:w-32 h-44 rounded-xl border flex flex-col justify-between p-4 bg-gradient-to-br ${getCoverGradient(book.id)} transition-all duration-300 group-hover:scale-[1.02] shadow-sm relative overflow-hidden shrink-0`}>
        {/* Subtle decorative elements for Kindle style */}
        <div className="absolute top-0 left-0 w-1.5 h-full bg-black/5 dark:bg-white/5 shadow-inner" />
        
        <div className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 dark:text-slate-500">
          Readable Book
        </div>
        <div className="my-auto">
          <h4 className="font-serif font-bold text-slate-800 dark:text-slate-200 text-sm leading-snug line-clamp-3">
            {book.title}
          </h4>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 italic font-medium">
            {book.author}
          </p>
        </div>
        <div className="flex justify-between items-center text-slate-400 dark:text-slate-500">
          <BookOpen size={14} />
          <span className="text-[9px] font-mono tracking-wider">
            {book.isCustom ? "USER" : "V1.0"}
          </span>
        </div>
      </div>

      {/* Book Information */}
      <div className="flex flex-col justify-between flex-grow">
        <div>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {book.isCustom ? "Buku Kustom" : "Buku Bawaan"}
            </span>
            {book.isCustom && (
              <div className="flex gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onEdit();
                    }}
                    className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Ubah Buku"
                  >
                    <Edit size={14} />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onDelete();
                    }}
                    className="p-1 rounded text-slate-400 hover:text-red-650 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Hapus Buku"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
          <h3 className="font-serif font-bold text-lg sm:text-xl text-slate-800 dark:text-slate-100 mt-2 leading-snug">
            {book.title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 italic mt-0.5">
            by {book.author}
          </p>
        </div>

        {/* Progress and Button */}
        <div className="mt-6 sm:mt-0 space-y-4">
          {hasProgress ? (
            <ProgressBar value={currentPage} max={totalPages} showText={true} />
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Belum mulai membaca
            </p>
          )}

          <Link
            href={`/reader/${book.id}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors duration-200 text-center cursor-pointer shadow-sm shadow-slate-950/10"
          >
            <BookOpen size={14} />
            {hasProgress ? "Lanjutkan Membaca" : "Mulai Membaca"}
          </Link>
        </div>
      </div>
    </div>
  );
}
