"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { user, loading, loginWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push("/");
    }
  }, [user, loading, router]);

  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoginError(null);
    try {
      await loginWithGoogle();
      router.push("/");
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error?.code === "auth/unauthorized-domain") {
        setLoginError("Domain ini belum diotorisasi di Firebase Console. Harap tambahkan domain Vercel ini ke menu Authorized Domains.");
      } else if (error?.code === "auth/popup-blocked") {
        setLoginError("Popup diblokir oleh browser. Harap izinkan popup untuk situs ini.");
      } else {
        setLoginError(error?.message || "Gagal masuk menggunakan Google.");
      }
    }
  };

  if (loading || user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="animate-spin text-amber-600 dark:text-amber-500" size={32} />
          <span className="text-sm text-slate-500 font-medium">Loading session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 sm:p-10 shadow-xl transition-all duration-300">
        <div className="flex flex-col items-center text-center">
          {/* Logo */}
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 mb-6">
            <BookOpen size={32} />
          </div>

          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-800 dark:text-slate-100 tracking-tight">
            Readable Books
          </h1>
          <p className="text-xs uppercase tracking-widest font-semibold text-slate-400 dark:text-slate-500 mt-1">
            Personal Cloud Reader
          </p>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 leading-relaxed max-w-xs">
            Sync your reading progress across all your devices. Kindle-like experience on the web.
          </p>

          {loginError && (
            <div className="mt-4 p-3 text-xs bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-650 dark:text-red-400 font-medium max-w-xs text-left">
              {loginError}
            </div>
          )}

          <button
            onClick={handleLogin}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-950 px-5 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
          >
            {/* Custom Google Icon */}
            <svg className="w-4 h-4 mr-1 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.5 3.77v3.13h4.05c2.37-2.18 3.74-5.39 3.74-8.75z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-4.05-3.13c-1.12.75-2.56 1.2-3.88 1.2-3.0 0-5.54-2.03-6.44-4.76H1.38v3.24C3.36 21.6 7.39 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.56 14.4c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18V6.8H1.38A11.96 11.96 0 0 0 0 12c0 1.92.45 3.74 1.38 5.38l3.2-2.5-1.02-.48z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.93 1.19 15.22 0 12 0 7.39 0 3.36 2.4 1.38 5.38l4.18 3.24c.9-2.73 3.44-4.75 6.44-4.75z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>

          <div className="mt-10 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            Next.js 15 PWA App • Powered by Firebase
          </div>
        </div>
      </div>
    </div>
  );
}
