import React, { useEffect, useState, useRef } from 'react';
import { Chapter, Verse } from '../types';
import { ArrowLeft, MoreHorizontal, Sun, Type, StopCircle, ChevronRight, ChevronLeft } from 'lucide-react';

interface ReaderViewProps {
  chapter: Chapter | null;
  loading: boolean;
  onBack: () => void;
  onVerseTap: (verse: Verse) => void;
  focusMode?: boolean;
  focusDuration?: number; // minutes
  onFocusComplete?: () => void;
  onNextChapter: () => void;
  onPrevChapter: () => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({ 
  chapter, 
  loading,
  onBack, 
  onVerseTap, 
  focusMode = false, 
  focusDuration = 0,
  onFocusComplete,
  onNextChapter,
  onPrevChapter
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
  const timerRef = useRef<number | null>(null);

  // Scroll to top when chapter changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [chapter]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (focusMode && timeLeft > 0) {
        timerRef.current = window.setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    if (onFocusComplete) onFocusComplete();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }
    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [focusMode, timeLeft, onFocusComplete]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="relative z-10 min-h-screen bg-black/80 backdrop-blur-xl animate-slide-up">
      {/* Sticky Header */}
      <div className={`sticky top-0 z-20 flex items-center justify-between px-6 py-4 transition-all duration-300 ${scrolled ? 'bg-black/95 backdrop-blur-md border-b border-white/5' : 'bg-transparent'}`}>
        {!focusMode ? (
            <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white/70">
                <ArrowLeft size={24} />
            </button>
        ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-mono text-emerald-400">{formatTime(timeLeft)}</span>
            </div>
        )}
        
        <div className={`text-sm font-sans tracking-widest uppercase text-white/90 transition-opacity ${scrolled && chapter ? 'opacity-100' : 'opacity-0'}`}>
           {chapter?.reference || 'Read'}
        </div>
        
        <div className="flex gap-4">
           {!focusMode && <button className="text-white/50 hover:text-white"><Type size={20} /></button>}
           {focusMode ? (
               <button onClick={onBack} className="text-white/30 hover:text-red-400 transition-colors flex items-center gap-1 text-xs uppercase tracking-widest">
                   <StopCircle size={16} /> End
               </button>
           ) : (
               <button className="text-white/50 hover:text-white"><MoreHorizontal size={20} /></button>
           )}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 pt-4 pb-32">
        {loading ? (
           <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-8 h-8 border-2 border-white/20 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-white/40 text-sm animate-pulse">Loading Scripture...</p>
           </div>
        ) : chapter ? (
            <>
                <div className="text-center mb-12">
                   <h2 className="font-sans text-sm text-white/50 uppercase tracking-widest mb-2">{chapter.reference.split(' ')[0]}</h2>
                   <h1 className="font-serif text-5xl text-white">{chapter.chapterNumber}</h1>
                </div>

                <div className="font-serif text-lg md:text-xl leading-loose text-white/90 space-y-6">
                  {chapter.verses.map((verse) => (
                    <span 
                      key={verse.number} 
                      className="inline hover:bg-white/10 rounded cursor-pointer transition-colors duration-200 decoration-clone p-0.5"
                      onClick={() => onVerseTap(verse)}
                    >
                      <sup className="text-[10px] text-white/40 mr-1 font-sans select-none align-super">{verse.number}</sup>
                      {verse.text}{" "}
                    </span>
                  ))}
                </div>
            </>
        ) : (
            <div className="text-center py-20 text-white/50">Content not found.</div>
        )}
        
        {!focusMode && !loading && (
            <div className="mt-24 pt-8 border-t border-white/10 flex justify-between text-white/50 text-sm font-sans">
                <button onClick={onPrevChapter} className="flex items-center gap-2 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-colors">
                    <ChevronLeft size={16} /> Previous
                </button>
                <button onClick={onNextChapter} className="flex items-center gap-2 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-colors">
                    Next <ChevronRight size={16} />
                </button>
            </div>
        )}
      </div>
    </div>
  );
};