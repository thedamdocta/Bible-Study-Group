
import React, { useEffect, useRef, useState } from 'react';
import { 
  ArrowLeft, Video, Mic, MicOff, VideoOff, Copy, Check, PhoneOff, Users, 
  BookOpen, ChevronRight, ChevronLeft, Layout, Circle, StopCircle, Film, Download,
  MessageSquare, Hand, Monitor, Share, X, Save, Trash2
} from 'lucide-react';
import { fetchChapter } from '../services/bibleService';
import { BOOKS } from '../constants';
import { Book, Chapter, RecordedSession } from '../types';

interface GroupVideoCallProps {
  onBack: () => void;
  recordings: RecordedSession[];
  onRecordingComplete: (session: RecordedSession) => void;
}

// PeerJS & Global Types
declare global {
  interface Window {
    Peer: any;
  }
}

interface PeerStream {
  id: string;
  stream: MediaStream;
  isHandRaised?: boolean;
}

interface PeerDataConnection {
  id: string;
  conn: any;
}

interface MediaConnection {
  peer: string;
  peerConnection: RTCPeerConnection;
  close: () => void;
  answer: (stream: MediaStream) => void;
  on: (event: string, cb: (stream: MediaStream) => void) => void;
}

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  isSystem?: boolean;
}

type SyncMessage = 
  | { type: 'NAVIGATE'; bookId: string; chapter: number }
  | { type: 'HIGHLIGHT'; verseNumber: number }
  | { type: 'CHAT'; text: string; senderId: string }
  | { type: 'HAND'; raised: boolean; senderId: string };

export const GroupVideoCall: React.FC<GroupVideoCallProps> = ({ onBack, recordings, onRecordingComplete }) => {
  // --- UI STATE ---
  const [view, setView] = useState<'menu' | 'setup' | 'call' | 'library'>('menu');
  const [mode, setMode] = useState<'grid' | 'study'>('grid');
  const [sidebarTab, setSidebarTab] = useState<'videos' | 'chat' | 'people'>('videos');
  const [isHost, setIsHost] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<string>('Initializing...');
  const [isCopied, setIsCopied] = useState(false);
  
  // --- MEDIA STATE ---
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<PeerStream[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);

  // --- RECORDING STATE ---
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  // Recording Save Modal State
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [recordingName, setRecordingName] = useState('');
  const [pendingBlob, setPendingBlob] = useState<{ blob: Blob, type: 'screen' | 'camera' } | null>(null);

  // --- CHAT STATE ---
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');

  // --- BIBLE SYNC STATE ---
  const [currentBook, setCurrentBook] = useState<Book>(BOOKS[42]); // Default John
  const [currentChapterNum, setCurrentChapterNum] = useState(1);
  const [chapterData, setChapterData] = useState<Chapter | null>(null);
  const [activeVerse, setActiveVerse] = useState<number | null>(null);
  const [isLoadingBible, setIsLoadingBible] = useState(false);

  // --- REFS ---
  const myPeerRef = useRef<any>(null);
  const connectionsRef = useRef<PeerDataConnection[]>([]);
  const activeCallsRef = useRef<MediaConnection[]>([]); 
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --------------------------------------------------------------------------
  // 1. INITIALIZE LOCAL MEDIA
  // --------------------------------------------------------------------------
  useEffect(() => {
    const startLocalVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Failed to get local stream", err);
        setConnectionStatus("Camera/Mic access denied");
      }
    };

    if (view === 'setup' || view === 'call') {
      if (!localStream) startLocalVideo();
    }

    return () => {
      if (view === 'menu' && localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
    };
  }, [view]);

  // --------------------------------------------------------------------------
  // 2. BIBLE DATA LOADING
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (mode === 'study') {
      const load = async () => {
        setIsLoadingBible(true);
        const data = await fetchChapter(currentBook.id, currentChapterNum);
        setChapterData(data);
        setIsLoadingBible(false);
      };
      load();
    }
  }, [currentBook.id, currentChapterNum, mode]);

  // --------------------------------------------------------------------------
  // 3. PEERJS LOGIC
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (view !== 'call' || !localStream || !window.Peer) return;

    const myId = isHost ? roomId : undefined; 
    const peer = new window.Peer(myId, { debug: 1 });

    peer.on('open', (id: string) => {
      setConnectionStatus(isHost ? 'Room Active' : 'Connected');
      myPeerRef.current = peer;

      if (!isHost) {
        connectToHost(peer, inputRoomId);
      }
    });

    peer.on('connection', (conn: any) => {
       setupDataConnection(conn);
    });

    peer.on('call', (call: any) => {
      activeCallsRef.current.push(call);
      call.answer(localStream);
      call.on('stream', (remoteStream: MediaStream) => {
        addRemoteStream(call.peer, remoteStream);
      });
      call.on('close', () => {
        activeCallsRef.current = activeCallsRef.current.filter(c => c.peer !== call.peer);
      });
    });

    peer.on('error', (err: any) => {
      if (err.type === 'unavailable-id') setConnectionStatus("ID Taken");
      else if (err.type === 'peer-unavailable') setConnectionStatus("Room Not Found");
      else setConnectionStatus("Error: " + err.type);
    });

    return () => peer.destroy();
  }, [view, isHost, roomId, localStream]);

  const connectToHost = (peer: any, hostId: string) => {
      setConnectionStatus("Joining...");
      const call = peer.call(hostId, localStream);
      if (call) {
        activeCallsRef.current.push(call);
        call.on('stream', (hostStream: MediaStream) => {
            setConnectionStatus("Connected");
            addRemoteStream(hostId, hostStream);
        });
        call.on('close', () => {
            removeRemoteStream(hostId);
            activeCallsRef.current = activeCallsRef.current.filter(c => c.peer !== hostId);
        });
      }
      const conn = peer.connect(hostId);
      setupDataConnection(conn);
  };

  const setupDataConnection = (conn: any) => {
      conn.on('open', () => {
          connectionsRef.current.push({ id: conn.peer, conn });
          if (isHost) {
              sendSyncData({ type: 'NAVIGATE', bookId: currentBook.id, chapter: currentChapterNum });
          }
      });
      conn.on('data', (data: SyncMessage) => handleIncomingData(data));
      conn.on('close', () => {
          connectionsRef.current = connectionsRef.current.filter(c => c.id !== conn.peer);
      });
  };

  const handleIncomingData = (data: SyncMessage) => {
      if (data.type === 'NAVIGATE') {
          const book = BOOKS.find(b => b.id === data.bookId);
          if (book) {
              setCurrentBook(book);
              setCurrentChapterNum(data.chapter);
              if (mode === 'grid') setMode('study'); 
          }
      } else if (data.type === 'HIGHLIGHT') {
          setActiveVerse(data.verseNumber);
          const el = document.getElementById(`verse-${data.verseNumber}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (data.type === 'CHAT') {
          setChatMessages(prev => [...prev, {
              id: Date.now().toString() + Math.random(),
              senderId: data.senderId,
              text: data.text,
              timestamp: new Date()
          }]);
      } else if (data.type === 'HAND') {
          setRemoteStreams(prev => prev.map(p => 
              p.id === data.senderId ? { ...p, isHandRaised: data.raised } : p
          ));
          if (data.raised) {
              setChatMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  senderId: 'System',
                  text: `Peer ${data.senderId.slice(-4)} raised their hand.`,
                  timestamp: new Date(),
                  isSystem: true
              }]);
          }
      }
  };

  const sendSyncData = (data: SyncMessage) => {
      connectionsRef.current.forEach(c => {
          if (c.conn.open) c.conn.send(data);
      });
  };

  const addRemoteStream = (id: string, stream: MediaStream) => {
    setRemoteStreams(prev => {
        if (prev.find(p => p.id === id)) return prev;
        return [...prev, { id, stream }];
    });
  };

  const removeRemoteStream = (id: string) => {
      setRemoteStreams(prev => prev.filter(p => p.id !== id));
  };

  // --------------------------------------------------------------------------
  // 4. SUITE ACTIONS
  // --------------------------------------------------------------------------
  const generateSecureRoomId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleCreateRoom = () => {
      const newId = generateSecureRoomId();
      setRoomId(newId);
      setIsHost(true);
      setView('setup');
  };

  const handleSendChat = () => {
      if (!chatInput.trim()) return;
      const myId = isHost ? 'Host' : 'Me';
      const msg: ChatMessage = { id: Date.now().toString(), senderId: myId, text: chatInput, timestamp: new Date() };
      setChatMessages(prev => [...prev, msg]);
      sendSyncData({ type: 'CHAT', text: chatInput, senderId: myPeerRef.current?.id || 'Unknown' });
      setChatInput('');
  };

  const toggleHandRaise = () => {
      const newState = !isHandRaised;
      setIsHandRaised(newState);
      sendSyncData({ type: 'HAND', raised: newState, senderId: myPeerRef.current?.id || 'Unknown' });
  };

  const toggleScreenShare = async () => {
      if (isScreenSharing) {
          try {
              const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
              replaceTrackInActiveCalls(cameraStream);
              setLocalStream(cameraStream);
              if (localVideoRef.current) localVideoRef.current.srcObject = cameraStream;
              setIsScreenSharing(false);
          } catch (e) {
              console.error("Failed to revert to camera", e);
          }
      } else {
          try {
              const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
              replaceTrackInActiveCalls(screenStream);
              setLocalStream(screenStream);
              if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
              setIsScreenSharing(true);
              screenStream.getVideoTracks()[0].onended = () => toggleScreenShare();
          } catch (err: any) {
              if (err.name === 'NotAllowedError' || err.message.includes('Permission denied')) return;
              console.error("Screen share failed", err);
          }
      }
  };

  const replaceTrackInActiveCalls = (newStream: MediaStream) => {
      const newVideoTrack = newStream.getVideoTracks()[0];
      activeCallsRef.current.forEach(call => {
          const sender = call.peerConnection.getSenders().find((s: any) => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(newVideoTrack);
      });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // --------------------------------------------------------------------------
  // 5. RECORDING LOGIC (MP4 + NAMING)
  // --------------------------------------------------------------------------
  const startRecording = async () => {
    let streamToRecord: MediaStream | null = null;
    let type: 'screen' | 'camera' = 'screen';

    // Detect mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
        if (localStream) {
            streamToRecord = localStream;
            type = 'camera';
        } else {
            alert("No camera stream available to record.");
            return;
        }
    } else {
        try {
            streamToRecord = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        } catch (err: any) {
            if (err.name === 'NotAllowedError') return; // User cancelled
            if (localStream) {
                streamToRecord = localStream;
                type = 'camera';
                console.log("Fallback to local camera recording");
            } else {
                return;
            }
        }
    }

    if (!streamToRecord) return;

    // Prioritize MP4
    let mimeType = 'video/mp4';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm';
        }
    }

    try {
        const recorder = new MediaRecorder(streamToRecord, { mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined });
        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
                chunksRef.current.push(e.data);
            }
        };

        recorder.onstop = () => {
            // Determine the final type (might fallback to default)
            const finalType = recorder.mimeType || 'video/webm';
            const blob = new Blob(chunksRef.current, { type: finalType });
            
            if (blob.size === 0) return;
            
            // Open Modal instead of saving immediately
            setPendingBlob({ blob, type });
            setRecordingName(`Study Session - ${new Date().toLocaleTimeString()}`);
            setShowSaveModal(true);
            
            if (type === 'screen') {
                streamToRecord!.getTracks().forEach(track => track.stop());
            }
        };

        recorder.start(1000); 
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
    } catch (e) {
        console.error("MediaRecorder failed", e);
        alert("Recording not supported on this browser.");
    }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
      }
  };

  const saveRecording = () => {
      if (!pendingBlob) return;
      
      const url = URL.createObjectURL(pendingBlob.blob);
      const newRec: RecordedSession = {
          id: Date.now().toString(),
          title: recordingName || 'Untitled Session',
          url,
          date: new Date(),
          duration: 'Session',
          type: pendingBlob.type
      };
      
      onRecordingComplete(newRec);
      setShowSaveModal(false);
      setPendingBlob(null);
  };

  const discardRecording = () => {
      setShowSaveModal(false);
      setPendingBlob(null);
  };

  // --------------------------------------------------------------------------
  // UI ACTIONS
  // --------------------------------------------------------------------------
  const toggleMute = () => {
    const newMutedState = !isMuted;
    if (localStream) localStream.getAudioTracks().forEach(track => { track.enabled = !newMutedState; });
    setIsMuted(newMutedState);
  };

  const toggleVideo = () => {
    const newVideoOffState = !isVideoOff;
    if (localStream) localStream.getVideoTracks().forEach(track => { track.enabled = !newVideoOffState; });
    setIsVideoOff(newVideoOffState);
  };

  const handleNextChapter = () => {
      let nextChap = currentChapterNum + 1;
      let nextBook = currentBook;
      if (nextChap > currentBook.chapterCount) {
          const idx = BOOKS.findIndex(b => b.id === currentBook.id);
          const nextIdx = (idx + 1) % BOOKS.length;
          nextBook = BOOKS[nextIdx];
          nextChap = 1;
      }
      setCurrentBook(nextBook);
      setCurrentChapterNum(nextChap);
      setActiveVerse(null);
      sendSyncData({ type: 'NAVIGATE', bookId: nextBook.id, chapter: nextChap });
  };

  const handleVerseClick = (verseNum: number) => {
      setActiveVerse(verseNum);
      sendSyncData({ type: 'HIGHLIGHT', verseNumber: verseNum });
  };

  const handleLeave = () => {
      if (myPeerRef.current) myPeerRef.current.destroy();
      if (localStream) {
          localStream.getTracks().forEach(track => track.stop());
          setLocalStream(null);
      }
      setRemoteStreams([]);
      setIsRecording(false);
      setView('menu');
      onBack();
  };

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, sidebarTab]);

  // --------------------------------------------------------------------------
  // RENDER VIEWS
  // --------------------------------------------------------------------------

  // SAVE MODAL
  if (showSaveModal) {
      return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-md bg-[#161616] border border-white/10 rounded-3xl p-8 shadow-2xl">
                <h2 className="text-2xl font-serif text-white mb-2">Save Recording</h2>
                <p className="text-white/50 text-sm mb-6">Give your session a name to save it to the library.</p>
                
                <div className="mb-6">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 block">Recording Name</label>
                    <input 
                        type="text" 
                        value={recordingName} 
                        onChange={(e) => setRecordingName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500"
                    />
                </div>

                <div className="flex gap-3">
                    <button onClick={discardRecording} className="flex-1 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white">Discard</button>
                    <button onClick={saveRecording} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2">
                        <Save size={18} /> Save
                    </button>
                </div>
            </div>
        </div>
      );
  }

  if (view === 'menu') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-fade-in">
        <div className="w-full max-w-md bg-[#161616] border border-white/10 rounded-3xl p-8 shadow-2xl relative text-center">
             <button onClick={onBack} className="absolute top-4 left-4 text-white/40 hover:text-white"><ArrowLeft size={20} /></button>
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30"><Video className="text-emerald-400" size={36} /></div>
            <h2 className="font-serif text-3xl text-white mb-2">Bible Study Suite</h2>
            <p className="text-white/50 text-sm mb-8">Collaborate, present, and study together.</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
                <button onClick={handleCreateRoom} className="p-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all flex flex-col items-center gap-2">Create Room</button>
                <button onClick={() => { setIsHost(false); setView('setup'); }} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold transition-all flex flex-col items-center gap-2">Join Room</button>
            </div>
            <button onClick={() => setView('library')} className="w-full py-3 rounded-xl bg-transparent border border-white/10 text-white/50 hover:text-white hover:bg-white/5 flex items-center justify-center gap-2"><Film size={16} /> Past Recordings</button>
        </div>
      </div>
    );
  }

  if (view === 'library') {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/95 animate-fade-in">
            <div className="w-full max-w-lg bg-[#161616] border border-white/10 rounded-3xl p-8 shadow-2xl relative h-[70vh] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => setView('menu')} className="text-white/40 hover:text-white"><ArrowLeft size={20} /></button>
                    <h2 className="font-serif text-2xl text-white">Library</h2><div className="w-5"></div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                    {recordings.map(rec => (
                        <div key={rec.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between group">
                            <div>
                                <div className="text-white font-medium">{rec.title}</div>
                                <div className="text-xs text-white/40">{rec.date.toLocaleString()} • {rec.type}</div>
                            </div>
                            <a 
                                href={rec.url} 
                                download={`${rec.title.replace(/\s+/g, '_')}.mp4`} 
                                className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors"
                                title="Download Video"
                            >
                                <Download size={16} />
                            </a>
                        </div>
                    ))}
                    {recordings.length === 0 && <p className="text-center text-white/30 mt-10">No recordings found.</p>}
                </div>
            </div>
        </div>
      );
  }

  if (view === 'setup') {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/95 animate-fade-in">
            <div className="w-full max-w-lg flex flex-col items-center">
                 <h2 className="font-serif text-2xl text-white mb-6">{isHost ? 'Hosting' : 'Joining'}</h2>
                 <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 mb-6 shadow-2xl">
                     <video ref={localVideoRef} autoPlay muted playsInline className={`w-full h-full object-cover transform scale-x-[-1] ${isVideoOff ? 'hidden' : ''}`} />
                 </div>
                 <div className="w-full bg-[#161616] p-6 rounded-2xl border border-white/10 mb-6">
                     {isHost ? (
                         <div className="text-center">
                             <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Room Code</p>
                             <div className="flex items-center justify-center gap-2">
                                <div className="text-sm font-mono text-emerald-400 bg-white/5 px-4 py-2 rounded-lg tracking-wide break-all">{roomId}</div>
                                <button onClick={copyRoomCode} className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-emerald-400 flex-shrink-0">
                                    {isCopied ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                             </div>
                         </div>
                     ) : (
                         <input type="text" value={inputRoomId} onChange={(e) => setInputRoomId(e.target.value)} placeholder="Enter Code" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500" />
                     )}
                 </div>
                 <div className="flex gap-4 w-full">
                     <button onClick={() => setView('menu')} className="flex-1 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold">Back</button>
                     <button onClick={() => { if(isHost || inputRoomId) setView('call'); }} className="flex-1 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold">Start</button>
                 </div>
            </div>
        </div>
      );
  }

  // 4. CALL VIEW
  return (
    <div className="fixed inset-0 z-[60] bg-[#050505] animate-fade-in flex flex-col">
        {/* TOP BAR */}
        <div className="h-16 border-b border-white/10 flex items-center justify-between px-4 bg-[#121214]">
             <div className="flex items-center gap-3">
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-2 max-w-[150px] md:max-w-xs">
                    <span className="text-xs text-white/40 uppercase tracking-wider hidden md:inline">Room:</span>
                    <span className="text-xs font-mono text-emerald-400 font-bold truncate">{isHost ? roomId : inputRoomId}</span>
                    <button onClick={copyRoomCode} className="text-white/30 hover:text-white"><Copy size={12} /></button>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold hidden md:block ${connectionStatus === 'Connected' || connectionStatus === 'Room Active' ? 'text-emerald-400 bg-emerald-500/10' : 'text-yellow-400 bg-yellow-500/10'}`}>{connectionStatus}</div>
             </div>

             <div className="flex gap-2">
                 <button onClick={() => { if(isRecording) stopRecording(); else startRecording(); }} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${isRecording ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                    {isRecording ? <StopCircle size={16} /> : <Circle size={16} fill="currentColor" className="text-red-500" />}
                    <span className="hidden md:inline">{isRecording ? 'Rec' : 'Record'}</span>
                 </button>
                 <button onClick={() => setMode(mode === 'grid' ? 'study' : 'grid')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${mode === 'study' ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                    {mode === 'study' ? <Layout size={16} /> : <BookOpen size={16} />}
                    <span className="hidden md:inline">{mode === 'study' ? 'Grid View' : 'Study Mode'}</span>
                 </button>
             </div>
        </div>

        {/* MAIN CONTENT SPLIT */}
        <div className="flex-1 flex overflow-hidden">
            {mode === 'study' && (
                <div className="flex-1 bg-[#0a0a0a] flex flex-col border-r border-white/10 min-w-0">
                    <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#0a0a0a]">
                        <h2 className="font-serif text-xl text-white">{currentBook.name} <span className="text-emerald-500">{currentChapterNum}</span></h2>
                        <button onClick={handleNextChapter} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors flex items-center gap-1 text-xs">Next <ChevronRight size={14} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                        {isLoadingBible ? <div className="text-center text-white/30 mt-10">Loading...</div> : (
                            <div className="max-w-3xl mx-auto space-y-4 pb-20">
                                {chapterData?.verses.map((v) => (
                                    <span 
                                        id={`verse-${v.number}`} key={v.number} onClick={() => handleVerseClick(v.number)}
                                        className={`inline leading-loose text-lg font-serif cursor-pointer transition-all duration-300 rounded px-1 decoration-clone ${activeVerse === v.number ? 'bg-emerald-500/30 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'text-white/80 hover:bg-white/5'}`}
                                    >
                                        <sup className="text-xs text-white/30 mr-1 select-none">{v.number}</sup>{v.text}{" "}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* SIDEBAR */}
            <div className={`transition-all duration-500 ease-in-out bg-[#121214] flex flex-col ${mode === 'study' ? 'w-80 border-l border-white/10' : 'w-full'}`}>
                {mode === 'study' && (
                    <div className="flex border-b border-white/10 bg-[#161618]">
                        <button onClick={() => setSidebarTab('videos')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${sidebarTab === 'videos' ? 'text-white border-b-2 border-emerald-500' : 'text-white/40 hover:text-white'}`}>Videos</button>
                        <button onClick={() => setSidebarTab('chat')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${sidebarTab === 'chat' ? 'text-white border-b-2 border-emerald-500' : 'text-white/40 hover:text-white'}`}>Chat</button>
                        <button onClick={() => setSidebarTab('people')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${sidebarTab === 'people' ? 'text-white border-b-2 border-emerald-500' : 'text-white/40 hover:text-white'}`}>People ({remoteStreams.length + 1})</button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 relative">
                    {/* VIDEOS */}
                    { (mode === 'grid' || sidebarTab === 'videos') && (
                        <div className={`grid gap-4 ${mode === 'study' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
                            <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-white/10 shadow-lg group">
                                <video ref={(el) => { if (el && localStream) el.srcObject = localStream; }} autoPlay muted playsInline className={`w-full h-full object-cover ${!isScreenSharing && 'transform scale-x-[-1]'} ${isVideoOff ? 'hidden' : ''}`} />
                                {isVideoOff && <div className="absolute inset-0 flex items-center justify-center text-white/30 font-bold">Camera Off</div>}
                                <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-xs font-bold text-white backdrop-blur-sm">You {isHost && '(Host)'}</div>
                                {isHandRaised && <div className="absolute top-2 right-2 p-1.5 bg-blue-500 rounded-full"><Hand size={14} className="text-white" /></div>}
                            </div>
                            {remoteStreams.map((peer) => (
                                <div key={peer.id} className="relative aspect-video bg-black rounded-xl overflow-hidden border border-white/10 shadow-lg">
                                    <VideoPlayer stream={peer.stream} />
                                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-xs font-bold text-white backdrop-blur-sm">Peer {peer.id.slice(-4)}</div>
                                    {peer.isHandRaised && <div className="absolute top-2 right-2 p-1.5 bg-blue-500 rounded-full"><Hand size={14} className="text-white" /></div>}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* CHAT */}
                    { mode === 'study' && sidebarTab === 'chat' && (
                        <div className="flex flex-col h-full">
                            <div className="flex-1 space-y-4 mb-4">
                                {chatMessages.map(msg => (
                                    <div key={msg.id} className={`flex flex-col ${msg.isSystem ? 'items-center' : msg.senderId === 'Me' || msg.senderId === 'Host' ? 'items-end' : 'items-start'}`}>
                                        {msg.isSystem ? (
                                            <span className="text-[10px] text-white/30 uppercase bg-white/5 px-2 py-1 rounded-full">{msg.text}</span>
                                        ) : (
                                            <div className={`max-w-[85%] p-3 rounded-xl text-sm ${msg.senderId === 'Me' || msg.senderId === 'Host' ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white/90'}`}>
                                                {msg.text}
                                            </div>
                                        )}
                                        {!msg.isSystem && <span className="text-[10px] text-white/20 mt-1">{msg.senderId} • {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>
                            <div className="relative">
                                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendChat()} placeholder="Type a message..." className="w-full bg-white/5 border border-white/10 rounded-full pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:border-emerald-500" />
                                <button onClick={handleSendChat} className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-300 p-1"><Share size={16} /></button>
                            </div>
                        </div>
                    )}

                    {/* PEOPLE */}
                    { mode === 'study' && sidebarTab === 'people' && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">You</div>
                                    <span className="text-sm text-white font-medium">You {isHost && '(Host)'}</span>
                                </div>
                                <div className="flex gap-2 text-white/40">
                                    {isHandRaised && <Hand size={14} className="text-blue-400" />}
                                    {isMuted ? <MicOff size={14} /> : <Mic size={14} className="text-emerald-400" />}
                                </div>
                            </div>
                            {remoteStreams.map(peer => (
                                <div key={peer.id} className="flex items-center justify-between p-3 bg-transparent rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/40 font-bold text-xs">P</div>
                                        <span className="text-sm text-white font-medium">Peer {peer.id.slice(-4)}</span>
                                    </div>
                                    <div className="flex gap-2 text-white/40">
                                        {peer.isHandRaised && <Hand size={14} className="text-blue-400" />}
                                        <Mic size={14} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* BOTTOM BAR - REDESIGNED */}
        <div className="h-24 bg-[#121214] border-t border-white/10 flex items-center justify-center gap-4 px-6 pb-4">
            <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-full border border-white/5">
                <button onClick={toggleMute} className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${isMuted ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`} title={isMuted ? "Unmute" : "Mute"}>
                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <button onClick={toggleVideo} className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${isVideoOff ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`} title={isVideoOff ? "Turn Video On" : "Turn Video Off"}>
                    {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                </button>
            </div>

            <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-full border border-white/5">
                <button onClick={toggleHandRaise} className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${isHandRaised ? 'bg-blue-500 text-white' : 'text-white hover:bg-white/10'}`} title="Raise Hand">
                    <Hand size={20} />
                </button>
                <button onClick={toggleScreenShare} className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${isScreenSharing ? 'bg-emerald-500 text-white' : 'text-white hover:bg-white/10'}`} title="Present Screen">
                    <Monitor size={20} />
                </button>
            </div>

            <button onClick={handleLeave} className="w-14 h-14 flex items-center justify-center rounded-3xl bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 transition-all ml-2" title="Leave Call">
                <PhoneOff size={24} />
            </button>
        </div>
    </div>
  );
};

// Helper for remote video
const VideoPlayer: React.FC<{ stream: MediaStream }> = ({ stream }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => { if (videoRef.current && stream) videoRef.current.srcObject = stream; }, [stream]);
    return <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />;
};
