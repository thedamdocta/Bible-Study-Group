import React, { useState } from 'react';
import { Book } from '../types';
import { BOOKS } from '../constants';
import { X, ChevronRight, ChevronLeft, Book as BookIcon, Grid } from 'lucide-react';

interface ChapterSelectorProps {
  currentBook: Book;
  onSelect: (book: Book, chapter: number) => void;
  onClose: () => void;
  initialTab?: 'books' | 'chapters';
}

export const ChapterSelector: React.FC<ChapterSelectorProps> = ({ 
  currentBook, 
  onSelect, 
  onClose,
  initialTab = 'chapters' 
}) => {
  const [activeTab, setActiveTab] = useState<'books' | 'chapters'>(initialTab);
  const [selectedBook, setSelectedBook] = useState<Book>(currentBook);

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
    setActiveTab('chapters');
  };

  const handleChapterClick = (chapter: number) => {
    onSelect(selectedBook, chapter);
  };

  const handlePrevBook = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIndex = BOOKS.findIndex(b => b.id === selectedBook.id);
    const prevIndex = (currentIndex - 1 + BOOKS.length) % BOOKS.length;
    setSelectedBook(BOOKS[prevIndex]);
  };

  const handleNextBook = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIndex = BOOKS.findIndex(b => b.id === selectedBook.id);
    const nextIndex = (currentIndex + 1) % BOOKS.length;
    setSelectedBook(BOOKS[nextIndex]);
  };

  // Group books by testament
  const oldTestamentBooks = BOOKS.filter(b => b.testament === 'Old');
  const newTestamentBooks = BOOKS.filter(b => b.testament === 'New');

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto animate-fade-in" 
        onClick={(e) => {
            e.stopPropagation();
            onClose();
        }}
      />
      
      {/* Drawer */}
      <div 
        className="relative z-10 pointer-events-auto w-full max-w-xl bg-[#121214] border-t border-white/10 rounded-t-3xl shadow-2xl h-[92vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div className="flex gap-4">
             <button 
                onClick={() => setActiveTab('books')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'books' ? 'bg-white text-black' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
             >
                <BookIcon size={16} /> Books
             </button>
             <button 
                onClick={() => setActiveTab('chapters')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'chapters' ? 'bg-white text-black' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
             >
                <Grid size={16} /> {selectedBook.name}
             </button>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-20">
          {activeTab === 'books' ? (
            <div className="space-y-6">
              {/* Old Testament */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4 sticky top-0 bg-[#121214] py-2 z-10">Old Testament</h3>
                {oldTestamentBooks.map((book) => (
                    <button
                    key={book.id}
                    onClick={() => handleBookClick(book)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${book.id === selectedBook.id ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-white/60'}`}
                    >
                    <span className="font-serif text-lg">{book.name}</span>
                    {book.id === selectedBook.id && <ChevronRight size={18} className="text-emerald-500" />}
                    </button>
                ))}
              </div>

              {/* New Testament */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4 sticky top-0 bg-[#121214] py-2 z-10">New Testament</h3>
                {newTestamentBooks.map((book) => (
                    <button
                    key={book.id}
                    onClick={() => handleBookClick(book)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${book.id === selectedBook.id ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-white/60'}`}
                    >
                    <span className="font-serif text-lg">{book.name}</span>
                    {book.id === selectedBook.id && <ChevronRight size={18} className="text-emerald-500" />}
                    </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
               <div className="flex items-center justify-between mb-8 pt-4">
                  <button 
                    onClick={handlePrevBook}
                    className="p-3 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors"
                  >
                    <ChevronLeft size={28} />
                  </button>
                  
                  <div className="text-center">
                      <h2 key={selectedBook.id} className="font-serif text-4xl text-white mb-2 animate-fade-in">{selectedBook.name}</h2>
                      <p className="text-white/40 text-sm">Select a chapter</p>
                  </div>

                  <button 
                    onClick={handleNextBook}
                    className="p-3 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors"
                  >
                    <ChevronRight size={28} />
                  </button>
               </div>
               
               <div className="grid grid-cols-4 md:grid-cols-5 gap-4">
                 {Array.from({ length: selectedBook.chapterCount }, (_, i) => i + 1).map((num) => (
                   <button
                     key={num}
                     onClick={() => handleChapterClick(num)}
                     className="aspect-square flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 hover:scale-105 hover:border-emerald-500/50 border border-transparent transition-all"
                   >
                     <span className="font-sans text-xl font-medium text-white/80">{num}</span>
                   </button>
                 ))}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};