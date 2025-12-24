
/**
 * Resemble AI Audio Service
 * Provides high-fidelity, cinematic narration for Scripture.
 */

const RESEMBLE_API_KEY = import.meta.env.RESEMBLE_API_KEY || process.env.RESEMBLE_API_KEY;
const VOICE_UUID = import.meta.env.RESEMBLE_VOICE_UUID || process.env.RESEMBLE_VOICE_UUID; 

class ResembleAudioService {
  private audio: HTMLAudioElement | null = null;
  private isSystemSpeaking = false;
  private currentUrl: string | null = null;
  private audioQueue: string[] = [];
  private isProcessingQueue = false;
  private onEndCallback: (() => void) | null = null;

  /**
   * Narrates text using Resemble AI premium voices.
   * Handles text chunking to stay within Resemble's Sync API limits.
   */
  async speak(text: string, onEnd?: () => void) {
    this.stop();
    this.onEndCallback = onEnd || null;

    // Split text into chunks (Resemble Sync has limits, typically ~1000 chars)
    // We split by sentences to maintain natural flow.
    const chunks = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    this.audioQueue = chunks.map(c => c.trim()).filter(c => c.length > 0);
    
    if (this.audioQueue.length === 0) return;

    this.isProcessingQueue = true;
    this.playNextInQueue();
  }

  private async playNextInQueue() {
    if (this.audioQueue.length === 0) {
      this.isProcessingQueue = false;
      if (this.onEndCallback) this.onEndCallback();
      return;
    }

    const nextText = this.audioQueue.shift()!;
    
    try {
      const response = await fetch('https://f.cluster.resemble.ai/synthesize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEMBLE_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept-Encoding': 'gzip',
        },
        body: JSON.stringify({
          voice_uuid: VOICE_UUID,
          data: nextText,
          output_format: 'mp3',
          sample_rate: 48000
        }),
      });

      if (!response.ok) {
        throw new Error(`Resemble API Error: ${response.status}`);
      }

      const blob = await response.blob();
      this.cleanup();
      this.currentUrl = URL.createObjectURL(blob);
      
      this.audio = new Audio(this.currentUrl);
      this.audio.onended = () => {
        this.playNextInQueue();
      };
      
      await this.audio.play();
      this.isSystemSpeaking = false;
    } catch (error) {
      console.warn('Resemble AI Chunk failed, falling back to System Speech for remainder:', error);
      // Re-add failed text and rest of queue to system speech
      const remainingText = [nextText, ...this.audioQueue].join(' ');
      this.audioQueue = [];
      this.isProcessingQueue = false;
      this.fallbackToSystemSpeech(remainingText, this.onEndCallback || undefined);
    }
  }

  private fallbackToSystemSpeech(text: string, onEnd?: () => void) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const chunks = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    
    const startSpeaking = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes("Google US English") || 
        v.name.includes("Natural") ||
        v.lang.startsWith("en-US")
      );

      chunks.forEach((chunk, index) => {
        const utterance = new SpeechSynthesisUtterance(chunk.trim());
        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.rate = 0.85; 
        
        if (index === chunks.length - 1) {
          utterance.onend = () => {
            this.isSystemSpeaking = false;
            if (onEnd) onEnd();
          };
        }
        window.speechSynthesis.speak(utterance);
      });
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = startSpeaking;
    } else {
      startSpeaking();
    }
    this.isSystemSpeaking = true;
  }

  pause() {
    if (this.audio) this.audio.pause();
    else if (this.isSystemSpeaking) window.speechSynthesis.pause();
  }

  resume() {
    if (this.audio) this.audio.play();
    else if (this.isSystemSpeaking) window.speechSynthesis.resume();
  }

  stop() {
    this.audioQueue = [];
    this.isProcessingQueue = false;
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      this.isSystemSpeaking = false;
    }
    this.cleanup();
  }

  private cleanup() {
    if (this.currentUrl) {
      URL.revokeObjectURL(this.currentUrl);
      this.currentUrl = null;
    }
  }

  isPlaying(): boolean {
    if (this.audio) return !this.audio.paused;
    if (window.speechSynthesis) return window.speechSynthesis.speaking;
    return this.isProcessingQueue;
  }
}

export const audioService = new ResembleAudioService();
