import { useState, useEffect, useCallback, useRef } from "react";
import { doc, getDoc, setDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface BookProgress {
  bookId: string;
  title: string;
  currentPage: number;
  totalPages: number;
  lastOpenedAt?: any;
  updatedAt?: any;
}

// Hook to load/save reading progress for a single book
export function useReadingProgress(userId: string | undefined, bookId: string) {
  const [progress, setProgress] = useState<BookProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<BookProgress | null>(null);

  // Maintain ref of progress state to use in event handlers (e.g. unmount, visibilitychange) without closure issues
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  // Fetch progress on load
  useEffect(() => {
    if (!userId || !bookId) {
      setLoading(false);
      return;
    }

    const fetchProgress = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "users", userId, "books", bookId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as BookProgress;
          setProgress(data);
          progressRef.current = data;
        } else {
          setProgress(null);
          progressRef.current = null;
        }
      } catch (error) {
        console.error("Error fetching reading progress:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [userId, bookId]);

  // Save progress function (debounced)
  const saveProgress = useCallback(
    async (currentPage: number, totalPages: number, title: string) => {
      if (!userId || !bookId) return;

      const newProgress: BookProgress = {
        bookId,
        title,
        currentPage,
        totalPages,
      };
      setProgress(newProgress);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        try {
          const docRef = doc(db, "users", userId, "books", bookId);
          await setDoc(
            docRef,
            {
              bookId,
              title,
              currentPage,
              totalPages,
              lastOpenedAt: progressRef.current?.lastOpenedAt || serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (error) {
          console.error("Error saving reading progress:", error);
        }
      }, 1000); // 1000ms debounce
    },
    [userId, bookId]
  );

  // Save progress immediately (e.g. for window close, page change, unload)
  const saveProgressImmediately = useCallback(
    async (currentPage: number, totalPages: number, title: string) => {
      if (!userId || !bookId) return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      try {
        const docRef = doc(db, "users", userId, "books", bookId);
        await setDoc(
          docRef,
          {
            bookId,
            title,
            currentPage,
            totalPages,
            lastOpenedAt: progressRef.current?.lastOpenedAt || serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (error) {
        console.error("Error saving reading progress immediately:", error);
      }
    },
    [userId, bookId]
  );

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return { progress, loading, saveProgress, saveProgressImmediately };
}

// Hook to load progress for all books (Library page)
export function useAllReadingProgress(userId: string | undefined) {
  const [allProgress, setAllProgress] = useState<Record<string, BookProgress>>({});
  const [loading, setLoading] = useState(true);

  const fetchAllProgress = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const colRef = collection(db, "users", userId, "books");
      const querySnapshot = await getDocs(colRef);
      const progressMap: Record<string, BookProgress> = {};
      querySnapshot.forEach((doc) => {
        progressMap[doc.id] = doc.data() as BookProgress;
      });
      setAllProgress(progressMap);
    } catch (error) {
      console.error("Error fetching all reading progress:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAllProgress();
  }, [userId, fetchAllProgress]);

  return { allProgress, loading, refetch: fetchAllProgress };
}
