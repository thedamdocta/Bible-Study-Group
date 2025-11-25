import React from 'react';
import { Book } from '../types';
import { Play, BookOpen, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface BookCoverProps {
  book: Book;
  currentChapter: number;
  onRead: () => void;
  onListen: () => void;
  onNextBook: () => void;
  onPrevBook: () => void;
  onToggleChapterSelect: () => void;
  onOpenBooks: () => void;
  onOpenStudy: () => void;
}

export const BookCover: React.FC<BookCoverProps> = ({ 
    book, 
    currentChapter,
    onRead, 
    onListen, 
    onNextBook, 
    onPrevBook,
    onToggleChapterSelect,
    onOpenBooks,
    onOpenStudy
}) => {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center h-[85vh] px-6 text-center animate-fade-in">
      <div className="absolute top-1/2 left-4 -translate-y-1/2">
        <button onClick={onPrevBook} className="p-3 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md text-white/50 hover:text-white transition-all">
            <ChevronLeft size={24} />
        </button>
      </div>
      <div className="absolute top-1/2 right-4 -translate-y-1/2">
        <button onClick={onNextBook} className="p-3 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md text-white/50 hover:text-white transition-all">
            <ChevronRight size={24} />
        </button>
      </div>

      <div className="flex space-x-4 mb-6 text-xs tracking-[0.2em] font-medium text-white/60 uppercase">
        <button className="border-b border-white/20 pb-1 hover:text-white transition-colors">Bible</button>
        <button onClick={onOpenBooks} className="text-white/30 hover:text-white hover:border-b border-white/20 pb-1 transition-all">Books</button>
        <button onClick={onOpenStudy} className="text-white/30 hover:text-white hover:border-b border-white/20 pb-1 transition-all">Study</button>
      </div>

      <div key={book.id} className="animate-fade-in flex flex-col items-center">
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-tight font-medium text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 drop-shadow-2xl">
            {book.name}
          </h1>

          <div className="mt-8 mb-12 flex justify-center">
            <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleChapterSelect();
                }}
                className="px-5 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-md text-sm text-white/90 hover:bg-white/10 hover:border-white/40 transition-all flex items-center gap-2 group"
            >
              <span className="tracking-wide">Chapter {currentChapter}</span>
              <ChevronDown size={14} className="text-white/50 group-hover:text-white transition-colors" />
            </button>
          </div>
      </div>

      <div className="flex items-center gap-6">
        <button 
          onClick={onRead}
          className="group flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-sans font-semibold tracking-wide hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
        >
          <BookOpen size={20} className="text-black" />
          READ
        </button>

        <button 
          onClick={onListen}
          className="group flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-lg border border-white/10 rounded-full font-sans font-semibold tracking-wide hover:bg-white/20 transition-all"
        >
          <Play size={20} fill="currentColor" />
          LISTEN
        </button>
      </div>
    </div>
  );
};