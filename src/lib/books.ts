import booksData from "@/data/books.json";

export interface Book {
  id: string;
  title: string;
  author: string;
  file: string;
}

export function getBooks(): Book[] {
  return booksData as Book[];
}

export function getBookById(id: string): Book | undefined {
  return (booksData as Book[]).find((b) => b.id === id);
}
