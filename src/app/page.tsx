"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useBooks, MergedBook } from "@/hooks/useBooks";
import BookCard from "@/components/BookCard";
import BookFormModal from "@/components/BookFormModal";
import { BookOpen, LogOut, Search, Loader2, Download, Plus } from "lucide-react";

export default function LibraryPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const { books, loading: booksLoading, createBook, updateBook, deleteBook } = useBooks(user?.uid);

  const [searchQuery, setSearchQuery] = useState("");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // CRUD Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<MergedBook | null>(null);

  // Redirect to login if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Track PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleOpenAddModal = () => {
    setSelectedBook(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (book: MergedBook) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  const handleDeleteBook = async (book: MergedBook) => {
    const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus buku "${book.title}"?`);
    if (!confirmDelete) return;

    try {
      await deleteBook(book.id);
    } catch (err) {
      alert("Gagal menghapus buku. Silakan coba lagi.");
    }
  };

  const handleFormSubmit = async (
    title: string,
    author: string,
    file?: File,
    onProgress?: (pct: number) => void
  ) => {
    if (selectedBook) {
      await updateBook(selectedBook.id, title, author, file, onProgress);
    } else {
      if (!file) throw new Error("File PDF wajib diunggah.");
      await createBook(title, author, file, onProgress);
    }
  };

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400">
            <BookOpen size={20} />
          </div>
          <div>
            <h1 className="font-serif font-bold text-base leading-none">Bacbuk Everywhere</h1>
            <span className="text-[9px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">Library</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Add Book Button */}
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Tambah Buku</span>
          </button>

          {/* PWA Install Button */}
          {isInstallable && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Download size={14} />
              <span>Pasang Aplikasi (PWA)</span>
            </button>
          )}

          {/* User profile and Sign Out */}
          <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-2 sm:pl-4">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 line-clamp-1 max-w-[120px]">
                {user.displayName || "Reader"}
              </span>
              <span className="text-[9px] text-slate-400 font-mono">
                {user.email}
              </span>
            </div>
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "Avatar"}
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-200 dark:border-amber-900/50">
                {(user.displayName || "R").charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors cursor-pointer"
              title="Keluar Akun"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-8">
        {/* Search Bar */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Cari buku berdasarkan judul atau penulis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-amber-600 dark:focus:border-amber-500 focus:ring-1 focus:ring-amber-600 dark:focus:ring-amber-500 text-sm placeholder-slate-400 transition-all shadow-sm"
          />
        </div>

        {/* Content list */}
        {booksLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <Loader2 className="animate-spin text-amber-600 dark:text-amber-500" size={28} />
            <span className="text-xs text-slate-400 font-medium">Sinkronisasi perpustakaan...</span>
          </div>
        ) : filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onEdit={() => handleOpenEditModal(book)}
                onDelete={() => handleDeleteBook(book)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-8 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4">
              <BookOpen size={24} />
            </div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">Buku tidak ditemukan</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 leading-relaxed">
              Kami tidak dapat menemukan buku dengan kata kunci "{searchQuery}". Coba gunakan nama lain.
            </p>
          </div>
        )}
      </main>

      {/* Book Form Modal (Add / Edit) */}
      <BookFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        editBook={
          selectedBook
            ? { title: selectedBook.title, author: selectedBook.author }
            : null
        }
      />
    </div>
  );
}
