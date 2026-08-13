import { useState, useEffect, useCallback } from "react";
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface HighlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Highlight {
  id: string;
  pageNumber: number;
  text: string;
  color: "yellow" | "green" | "pink" | "blue" | "purple";
  rects: HighlightRect[];
  createdAt?: any;
}

export function useHighlights(userId: string | undefined, bookId: string) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !bookId) {
      setHighlights([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const colRef = collection(db, "users", userId, "books", bookId, "highlights");
    const q = query(colRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Highlight[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Highlight);
        });
        setHighlights(list);
        setLoading(false);
      },
      (error) => {
        console.error("Error syncing highlights:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, bookId]);

  const addHighlight = useCallback(
    async (pageNumber: number, text: string, color: "yellow" | "green" | "pink" | "blue" | "purple", rects: HighlightRect[]) => {
      if (!userId || !bookId) return;

      try {
        const id = `hl-${Math.random().toString(36).substring(2, 11)}`;
        const docRef = doc(db, "users", userId, "books", bookId, "highlights", id);
        await setDoc(docRef, {
          pageNumber,
          text,
          color,
          rects,
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error adding highlight:", error);
      }
    },
    [userId, bookId]
  );

  const deleteHighlight = useCallback(
    async (highlightId: string) => {
      if (!userId || !bookId) return;

      try {
        const docRef = doc(db, "users", userId, "books", bookId, "highlights", highlightId);
        await deleteDoc(docRef);
      } catch (error) {
        console.error("Error deleting highlight:", error);
      }
    },
    [userId, bookId]
  );

  return { highlights, loading, addHighlight, deleteHighlight };
}
