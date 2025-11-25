export const audioService = {
  speak: (text: string, onEnd?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // Cancel any existing speech to clear the queue
    window.speechSynthesis.cancel();

    // 1. Chunking Logic
    // Split text into sentences to avoid browser character limits (often ~32kb or 15s timeouts).
    // This regex splits by punctuation (. ! ?) but keeps the punctuation.
    const chunks = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];

    let voices = window.speechSynthesis.getVoices();
    
    const startSpeaking = () => {
        // Attempt to pick a high-quality English voice
        const preferredVoice = voices.find(v => 
          v.name.includes("Google US English") || 
          v.name.includes("Samantha") ||
          v.name.includes("Zira") ||
          v.lang.startsWith("en-US")
        );

        // 2. Queue all chunks
        chunks.forEach((chunk, index) => {
            const utterance = new SpeechSynthesisUtterance(chunk.trim());
            
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }
            
            utterance.rate = 0.9; // Slightly slower for reading
            utterance.pitch = 1.0;

            // Only trigger onEnd callback when the *last* chunk finishes
            if (index === chunks.length - 1) {
                utterance.onend = () => {
                    if (onEnd) onEnd();
                };
            }

            // Handle errors
            utterance.onerror = (e) => {
                // Ignore 'interrupted' or 'canceled' errors as they are expected when user clicks pause/stop
                if (e.error === 'interrupted' || e.error === 'canceled') return;
                
                console.error("Speech Error Details:", e.error);
                
                // If the last chunk errors out, we should still probably reset the UI state
                if (index === chunks.length - 1 && onEnd) {
                    onEnd();
                }
            };

            window.speechSynthesis.speak(utterance);
        });
    };

    // Chrome loads voices asynchronously, so we must wait for them
    if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
            voices = window.speechSynthesis.getVoices();
            startSpeaking();
        };
    } else {
        startSpeaking();
    }
  },

  pause: () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.pause();
    }
  },

  resume: () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.resume();
    }
  },

  stop: () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
  },

  isPlaying: () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        return window.speechSynthesis.speaking && !window.speechSynthesis.paused;
    }
    return false;
  }
};