import React, { useState, useEffect } from 'react';
import { BackgroundGradient } from './components/BackgroundGradient';
import { BookCover } from './components/BookCover';
import { ReaderView } from './components/ReaderView';
import { AudioPlayer } from './components/AudioPlayer';
import { AIContextDrawer } from './components/AIContextDrawer';
import { FocusModal } from './components/FocusModal';
import { SessionCompletion } from './components/SessionCompletion';
import { ChapterSelector } from './components/ChapterSelector';
import { GroupVideoCall } from './components/GroupVideoCall';
import { BOOKS } from './constants';
import { fetchChapter } from './services/bibleService';
import { ViewMode, Verse, Book, Chapter, RecordedSession } from './types';

export default function App() {
  // Navigation State
  const [currentBook, setCurrentBook] = useState<Book>(BOOKS[5]); // Default to Romans (index 5)
  const [currentChapterNum, setCurrentChapterNum] = useState(12);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.HOME);
  
  // Data State
  const [chapterData, setChapterData] = useState<Chapter | null>(null);
  const [loadingChapter, setLoadingChapter] = useState(false);

  // UI State
  const [showChapterSelector, setShowChapterSelector] = useState(false);
  const [selectorInitialTab, setSelectorInitialTab] = useState<'books' | 'chapters'>('chapters');
  
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  
  // Focus Session State
  const [focusDuration, setFocusDuration] = useState(0);

  // Recordings State (Lifted)
  const [recordings, setRecordings] = useState<RecordedSession[]>([]);

  // Fetch chapter content when book/chapter changes
  useEffect(() => {
    const loadContent = async () => {
      setLoadingChapter(true);
      const data = await fetchChapter(currentBook.id, currentChapterNum);
      setChapterData(data);
      setLoadingChapter(false);
    };

    // Optimization: Only fetch if we are about to read or already reading
    if (viewMode === ViewMode.READ || viewMode === ViewMode.FOCUS_SESSION || viewMode === ViewMode.HOME || viewMode === ViewMode.LISTEN) {
        loadContent();
    }
  }, [currentBook.id, currentChapterNum, viewMode]);

  // View Handlers
  const handleReadClick = () => {
    // Direct read without focus timer
    setViewMode(ViewMode.READ);
  };
  
  const handleStudyClick = () => {
    // Open Focus/Study Menu
    setViewMode(ViewMode.FOCUS_SETUP);
  }

  const handleStartFocus = (minutes: number) => {
    setFocusDuration(minutes);
    setViewMode(ViewMode.FOCUS_SESSION);
  };
  
  const handleStartGroupStudy = () => {
    setViewMode(ViewMode.GROUP_STUDY);
  };

  const handleCancelStudy = () => {
    setViewMode(ViewMode.HOME);
  };

  const handleFocusComplete = () => {
    setViewMode(ViewMode.SESSION_SUMMARY);
  };

  const handleListen = () => {
    setViewMode(ViewMode.LISTEN);
  };

  const handleBack = () => {
    setViewMode(ViewMode.HOME);
  };

  const handleVerseTap = (verse: Verse) => {
    setSelectedVerse(verse);
  };

  const handleCloseContext = () => {
    setSelectedVerse(null);
  };

  // Navigation Logic
  const handleNextBook = () => {
    const idx = BOOKS.findIndex(b => b.id === currentBook.id);
    const nextIdx = (idx + 1) % BOOKS.length;
    setCurrentBook(BOOKS[nextIdx]);
    setCurrentChapterNum(1); // Reset to ch 1
  };

  const handlePrevBook = () => {
    const idx = BOOKS.findIndex(b => b.id === currentBook.id);
    const prevIdx = (idx - 1 + BOOKS.length) % BOOKS.length;
    setCurrentBook(BOOKS[prevIdx]);
    setCurrentChapterNum(1);
  };

  const handleChapterSelect = (book: Book, chapter: number) => {
    setCurrentBook(book);
    setCurrentChapterNum(chapter);
    setShowChapterSelector(false);
    // If we select a chapter from home, maybe stay home? Or go to read?
    // Let's stay home so they can hit "Read" when ready, 
    // unless they were already reading.
    if (viewMode !== ViewMode.HOME) {
        setViewMode(ViewMode.READ);
    }
  };

  const handleOpenBooks = () => {
    setSelectorInitialTab('books');
    setShowChapterSelector(true);
  };

  const handleOpenChapters = () => {
    setSelectorInitialTab('chapters');
    setShowChapterSelector(true);
  };

  const handleNextChapter = () => {
      if (currentChapterNum < currentBook.chapterCount) {
          setCurrentChapterNum(prev => prev + 1);
      } else {
          // Go to next book
          handleNextBook();
      }
  };

  const handlePrevChapter = () => {
      if (currentChapterNum > 1) {
          setCurrentChapterNum(prev => prev - 1);
      } else {
          // Go to previous book? For now just stay.
      }
  };

  const handleRecordingComplete = (newRecording: RecordedSession) => {
      setRecordings(prev => [newRecording, ...prev]);
  };

  return (
    <div className="relative min-h-screen font-sans text-white selection:bg-emerald-500/30">
      <BackgroundGradient colorTheme={currentBook.themeColor} />

      {/* Main Content Area */}
      <main className="relative z-10">
        {viewMode === ViewMode.HOME && (
          <BookCover 
            book={currentBook} 
            currentChapter={currentChapterNum}
            onRead={handleReadClick}
            onListen={handleListen}
            onNextBook={handleNextBook}
            onPrevBook={handlePrevBook}
            onToggleChapterSelect={handleOpenChapters}
            onOpenBooks={handleOpenBooks}
            onOpenStudy={handleStudyClick}
          />
        )}

        {viewMode === ViewMode.FOCUS_SETUP && (
            <FocusModal 
                onStart={handleStartFocus}
                onStartGroup={handleStartGroupStudy}
                onCancel={handleCancelStudy}
            />
        )}

        {(viewMode === ViewMode.READ || viewMode === ViewMode.FOCUS_SESSION) && (
          <ReaderView 
            chapter={chapterData} 
            loading={loadingChapter}
            onBack={handleBack} 
            onVerseTap={handleVerseTap}
            focusMode={viewMode === ViewMode.FOCUS_SESSION}
            focusDuration={focusDuration}
            onFocusComplete={handleFocusComplete}
            onNextChapter={handleNextChapter}
            onPrevChapter={handlePrevChapter}
          />
        )}

        {viewMode === ViewMode.SESSION_SUMMARY && (
            <SessionCompletion 
                duration={focusDuration} 
                onHome={handleBack} 
            />
        )}

        {viewMode === ViewMode.LISTEN && (
          <AudioPlayer 
            book={currentBook}
            chapter={chapterData}
            onBack={handleBack} 
          />
        )}

        {viewMode === ViewMode.GROUP_STUDY && (
            <GroupVideoCall 
                onBack={handleBack} 
                recordings={recordings}
                onRecordingComplete={handleRecordingComplete}
            />
        )}
      </main>

      {/* Chapter Selector Drawer */}
      {showChapterSelector && (
          <ChapterSelector 
            currentBook={currentBook} 
            onSelect={handleChapterSelect} 
            onClose={() => setShowChapterSelector(false)} 
            initialTab={selectorInitialTab}
          />
      )}

      {/* Context Drawer (Overlays everything) */}
      <AIContextDrawer 
        verse={selectedVerse}
        bookName={currentBook.name}
        chapterNumber={currentChapterNum}
        onClose={handleCloseContext}
      />
    </div>
  );
}