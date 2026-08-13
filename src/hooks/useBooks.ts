import { useState, useEffect, useCallback } from "react";
import { collection, doc, getDocs, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getBooks as getStaticBooks } from "@/lib/books";

export interface MergedBook {
  id: string;
  title: string;
  author: string;
  file: string;
  isCustom: boolean;
  currentPage: number;
  totalPages: number;
  lastOpenedAt?: any;
  updatedAt?: any;
}

export function useBooks(userId: string | undefined) {
  const [books, setBooks] = useState<MergedBook[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBooks = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // 1. Get static books list
      const staticBooks = getStaticBooks();

      // 2. Fetch all books (progress + custom metadata) from Firestore
      const colRef = collection(db, "users", userId, "books");
      const querySnapshot = await getDocs(colRef);
      
      const firestoreDocs: Record<string, any> = {};
      const customBooksList: MergedBook[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        firestoreDocs[doc.id] = data;

        if (data.isCustom) {
          customBooksList.push({
            id: doc.id,
            title: data.title || "Untitled Book",
            author: data.author || "Penulis Tidak Dikenal",
            file: data.file || "",
            isCustom: true,
            currentPage: data.currentPage || 0,
            totalPages: data.totalPages || 0,
            lastOpenedAt: data.lastOpenedAt,
            updatedAt: data.updatedAt,
          });
        }
      });

      // 3. Merge static books with progress from Firestore
      const mergedStaticBooks: MergedBook[] = staticBooks.map((sb) => {
        const progressDoc = firestoreDocs[sb.id];
        return {
          id: sb.id,
          title: sb.title,
          author: sb.author,
          file: sb.file,
          isCustom: false,
          currentPage: progressDoc?.currentPage || 0,
          totalPages: progressDoc?.totalPages || 0,
          lastOpenedAt: progressDoc?.lastOpenedAt || null,
          updatedAt: progressDoc?.updatedAt || null,
        };
      });

      // Combine both lists
      const combined = [...mergedStaticBooks, ...customBooksList];
      
      // Sort by updatedAt timestamp so recently active/modified books come first
      combined.sort((a, b) => {
        const timeA = a.updatedAt?.seconds || 0;
        const timeB = b.updatedAt?.seconds || 0;
        return timeB - timeA;
      });

      setBooks(combined);
    } catch (error) {
      console.error("Error loading books list:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBooks();
  }, [userId, fetchBooks]);

  // Create Book (Simulate upload and save Firestore doc)
  const createBook = useCallback(
    async (
      title: string,
      author: string,
      file: File,
      onProgress?: (progress: number) => void
    ) => {
      if (!userId) throw new Error("User not authenticated");

      return new Promise<void>((resolve, reject) => {
        let pct = 0;
        
        // Simulate upload progress (0% to 100%)
        const interval = setInterval(async () => {
          pct += 10;
          if (onProgress) onProgress(Math.min(pct, 100));

          if (pct >= 100) {
            clearInterval(interval);
            try {
              // Generate custom book ID
              const bookId = `custom-${Math.random().toString(36).substring(2, 11)}`;
              
              // We simulate the file URL path relative to public/books/
              // In the future, this is where you can do Vercel Blob upload and get the URL!
              const mockFileUrl = `/books/${file.name}`; 

              // Save metadata to Firestore
              const docRef = doc(db, "users", userId, "books", bookId);
              await setDoc(docRef, {
                bookId,
                title,
                author,
                file: mockFileUrl,
                isCustom: true,
                currentPage: 0,
                totalPages: 0,
                updatedAt: serverTimestamp(),
              });

              // Refresh lists
              await fetchBooks();
              resolve();
            } catch (err) {
              console.error("Firestore document write error:", err);
              reject(err);
            }
          }
        }, 80); // Quick simulation (800ms total)
      });
    },
    [userId, fetchBooks]
  );

  // Update custom book metadata or PDF file
  const updateBook = useCallback(
    async (
      bookId: string,
      title: string,
      author: string,
      file?: File,
      onProgress?: (progress: number) => void
    ) => {
      if (!userId) throw new Error("User not authenticated");

      const docRef = doc(db, "users", userId, "books", bookId);

      if (file) {
        // If file is provided, simulate upload progress
        return new Promise<void>((resolve, reject) => {
          let pct = 0;
          const interval = setInterval(async () => {
            pct += 10;
            if (onProgress) onProgress(Math.min(pct, 100));

            if (pct >= 100) {
              clearInterval(interval);
              try {
                const mockFileUrl = `/books/${file.name}`;
                
                await setDoc(
                  docRef,
                  {
                    title,
                    author,
                    file: mockFileUrl,
                    updatedAt: serverTimestamp(),
                  },
                  { merge: true }
                );

                await fetchBooks();
                resolve();
              } catch (err) {
                reject(err);
              }
            }
          }, 80);
        });
      } else {
        // Just update text metadata
        await setDoc(
          docRef,
          {
            title,
            author,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        await fetchBooks();
      }
    },
    [userId, fetchBooks]
  );

  // Delete custom book
  const deleteBook = useCallback(
    async (bookId: string) => {
      if (!userId) throw new Error("User not authenticated");

      try {
        // Delete Firestore Document
        const docRef = doc(db, "users", userId, "books", bookId);
        await deleteDoc(docRef);

        // Refresh lists
        await fetchBooks();
      } catch (err) {
        console.error("Error deleting book:", err);
        throw err;
      }
    },
    [userId, fetchBooks]
  );

  return { books, loading, refetch: fetchBooks, createBook, updateBook, deleteBook };
}
