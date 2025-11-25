import React, { useEffect, useState } from 'react';
import { CheckCircle, Home } from 'lucide-react';

interface SessionCompletionProps {
  duration: number; // in minutes
  onHome: () => void;
}

export const SessionCompletion: React.FC<SessionCompletionProps> = ({ duration, onHome }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Animation stages
    setTimeout(() => setStage(1), 500); // Fade in text
    setTimeout(() => setStage(2), 1500); // Grow roots
    setTimeout(() => setStage(3), 3500); // Show stats
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#050505] flex flex-col items-center justify-center p-6 animate-fade-in">
        
        {/* Roots Visualization - SVG Animation */}
        <div className={`relative w-64 h-64 mb-12 transition-opacity duration-1000 ${stage >= 1 ? 'opacity-100' : 'opacity-0'}`}>
            <svg viewBox="0 0 200 200" className="w-full h-full text-emerald-500/80 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                 <g stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round">
                    {/* Main Trunk */}
                    <path d="M100 180 V 100" className={`transition-all duration-[2000ms] ease-out ${stage >= 2 ? 'dash-draw' : 'dash-hide'}`} style={{strokeDasharray: 80, strokeDashoffset: stage >= 2 ? 0 : 80}} />
                    
                    {/* Left Branches */}
                    <path d="M100 140 Q 70 120 60 90" className={`transition-all duration-[2000ms] delay-500 ease-out`} style={{opacity: stage >= 2 ? 1 : 0}} />
                    <path d="M60 90 Q 50 70 40 80" className={`transition-all duration-[2000ms] delay-700 ease-out`} style={{opacity: stage >= 2 ? 1 : 0}} />
                    
                    {/* Right Branches */}
                    <path d="M100 120 Q 130 100 140 70" className={`transition-all duration-[2000ms] delay-300 ease-out`} style={{opacity: stage >= 2 ? 1 : 0}} />
                    <path d="M140 70 Q 160 50 170 60" className={`transition-all duration-[2000ms] delay-1000 ease-out`} style={{opacity: stage >= 2 ? 1 : 0}} />
                 </g>
                 {/* Glow center */}
                 <circle cx="100" cy="100" r="2" className={`fill-white transition-all duration-1000 delay-[2500ms] ${stage >= 2 ? 'opacity-100 scale-150' : 'opacity-0'}`} />
            </svg>
        </div>

        <div className={`text-center transition-all duration-1000 transform ${stage >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <h2 className="font-serif text-3xl md:text-4xl text-white mb-2">Deep Work</h2>
            <p className="text-white/50 text-sm mb-8">You spent {duration} minutes dwelling in the Word.</p>
            
            <div className="flex gap-4 justify-center">
                <div className="px-6 py-4 bg-white/5 rounded-2xl border border-white/10">
                    <span className="block text-2xl font-bold text-emerald-400">1</span>
                    <span className="text-xs text-white/40 uppercase">Session</span>
                </div>
                <div className="px-6 py-4 bg-white/5 rounded-2xl border border-white/10">
                    <span className="block text-2xl font-bold text-emerald-400">{duration}</span>
                    <span className="text-xs text-white/40 uppercase">Minutes</span>
                </div>
            </div>

            <button 
                onClick={onHome}
                className="mt-12 group flex items-center gap-2 mx-auto px-8 py-3 bg-white text-black rounded-full font-semibold hover:scale-105 transition-transform"
            >
                <Home size={18} />
                <span>Return Home</span>
            </button>
        </div>
    </div>
  );
};