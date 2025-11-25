import { Chapter, Verse } from '../types';

const BASE_URL = 'https://bible-api.com';

interface ApiResponse {
  reference: string;
  verses: {
    book_id: string;
    book_name: string;
    chapter: number;
    verse: number;
    text: string;
  }[];
  text: string;
}

export const fetchChapter = async (bookId: string, chapter: number): Promise<Chapter> => {
  try {
    // bible-api.com expects 'john+3' format
    const response = await fetch(`${BASE_URL}/${bookId}+${chapter}?translation=web`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch chapter');
    }

    const data: ApiResponse = await response.json();

    const verses: Verse[] = data.verses.map(v => ({
      number: v.verse,
      text: v.text.trim()
    }));

    return {
      bookId: bookId,
      chapterNumber: chapter,
      content: data.text,
      verses: verses,
      reference: data.reference
    };
  } catch (error) {
    console.error('Error fetching chapter:', error);
    // Fallback error chapter
    return {
      bookId,
      chapterNumber: chapter,
      content: "Could not load content. Please check your connection.",
      verses: [{ number: 1, text: "Could not load content." }],
      reference: "Error"
    };
  }
};