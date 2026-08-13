"use client";

import React, { useState, useEffect } from "react";
import { X, Upload, FileText, Loader2 } from "lucide-react";

interface BookFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, author: string, file?: File, onProgress?: (pct: number) => void) => Promise<void>;
  editBook?: {
    title: string;
    author: string;
  } | null;
}

export default function BookFormModal({ isOpen, onClose, onSubmit, editBook = null }: BookFormModalProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!editBook;

  useEffect(() => {
    if (isOpen) {
      if (editBook) {
        setTitle(editBook.title);
        setAuthor(editBook.author);
      } else {
        setTitle("");
        setAuthor("");
      }
      setFile(null);
      setProgress(0);
      setUploading(false);
      setError(null);
    }
  }, [isOpen, editBook]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        setError("File harus berupa dokumen PDF");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) {
      setError("Judul dan Penulis wajib diisi");
      return;
    }
    if (!isEdit && !file) {
      setError("Silakan pilih file PDF buku");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      await onSubmit(title.trim(), author.trim(), file || undefined, (pct) => {
        setProgress(pct);
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal menyimpan buku. Silakan coba lagi.");
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-slate-100">
            {isEdit ? "Ubah Detail Buku" : "Tambah Buku Baru"}
          </h3>
          <button
            onClick={onClose}
            disabled={uploading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 rounded-lg p-1 disabled:opacity-40 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              JUDUL BUKU
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
              placeholder="Masukkan judul buku"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:border-amber-600 dark:focus:border-amber-500 focus:ring-1 focus:ring-amber-600 dark:focus:ring-amber-500 text-sm placeholder-slate-400 disabled:opacity-60"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              NAMA PENULIS
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              disabled={uploading}
              placeholder="Masukkan nama penulis"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:border-amber-600 dark:focus:border-amber-500 focus:ring-1 focus:ring-amber-600 dark:focus:ring-amber-500 text-sm placeholder-slate-400 disabled:opacity-60"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              FILE PDF BUKU {isEdit && <span className="text-[10px] text-slate-400 font-normal">(Kosongkan jika tidak diganti)</span>}
            </label>
            
            <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500/80 rounded-2xl p-6 transition-colors flex flex-col items-center justify-center text-center cursor-pointer group">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="text-amber-600 dark:text-amber-500" size={32} />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 line-clamp-1 max-w-[240px]">
                    {file.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {Math.round((file.size / (1024 * 1024)) * 100) / 100} MB
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors" size={28} />
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Klik atau seret file PDF Anda ke sini
                  </span>
                  <span className="text-[10px] text-slate-400">PDF maksimal 20MB</span>
                </div>
              )}
            </div>
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-semibold text-amber-700 dark:text-amber-500">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="animate-spin" size={14} />
                  Mengunggah PDF...
                </span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 dark:bg-amber-500 rounded-full transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-40 cursor-pointer"
            >
              {isEdit ? "Simpan Perubahan" : "Simpan Buku"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
