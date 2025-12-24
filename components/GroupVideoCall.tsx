import React, { useEffect, useRef, useState } from 'react';
import { 
  ArrowLeft, Video, Mic, MicOff, VideoOff, Copy, Check, PhoneOff, Users, 
  BookOpen, ChevronRight, ChevronLeft, Layout, Circle, StopCircle, Film, Download,
  MessageSquare, Hand, Monitor, Share, X, Save, GripHorizontal, Minimize2, Maximize2, Move, Send
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

type PipSize = 'sm' | 'md' | 'lg';

export const GroupVideoCall: React.FC<GroupVideoCallProps> = ({ onBack, recordings, onRecordingComplete }) => {
  // --- UI STATE ---
  const [view, setView] = useState<'menu' | 'setup' | 'call' | 'library'>('menu');
  const [mode, setMode] = useState<'grid' | 'study'>('grid');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<string>('Initializing...');
  const [isCopied, setIsCopied] = useState(false);
  
  // Floating Window State
  const [pipSize, setPipSize] = useState<PipSize>('md');
  const [isPipCollapsed, setIsPipCollapsed] = useState(false);
  
  // Refs for Direct DOM Manipulation
  const pipRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  
  // --- MEDIA STATE ---
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null); // Ref to access stream in callbacks without re-running effects
  const [remoteStreams, setRemoteStreams] = useState<PeerStream[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);

  // --- RECORDING STATE ---
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
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

  // Sync ref with state
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // --------------------------------------------------------------------------
  // DRAG LOGIC
  // --------------------------------------------------------------------------
  const handleDragStart = (e: React.MouseEvent) => {
      if (mode !== 'study' || !pipRef.current) return;
      isDragging.current = true;
      const rect = pipRef.current.getBoundingClientRect();
      dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
  };

  const handleDragMove = (e: MouseEvent) => {
      if (!isDragging.current || !pipRef.current) return;
      e.preventDefault();
      const x = e.clientX - dragOffset.current.x;
      const y = e.clientY - dragOffset.current.y;
      
      pipRef.current.style.left = `${x}px`;
      pipRef.current.style.top = `${y}px`;
      pipRef.current.style.transform = 'none'; 
      pipRef.current.style.bottom = 'auto';
      pipRef.current.style.right = 'auto';
      
      const dims = getWindowDimensions();
      pipRef.current.style.width = dims.width;
      pipRef.current.style.height = dims.height;
  };

  const handleDragEnd = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
  };

  // --------------------------------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------------------------------
  useEffect(() => {
    const startLocalVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
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

  useEffect(() => {
    if (view !== 'call' || !window.Peer) return;

    const myId = isHost ? roomId : undefined; 
    const peer = new window.Peer(myId, { debug: 1 });

    peer.on('open', (id: string) => {
      setConnectionStatus(isHost ? 'Room Active' : 'Connected');
      myPeerRef.current = peer;
      if (!isHost) connectToHost(peer, inputRoomId);
    });

    peer.on('connection', (conn: any) => setupDataConnection(conn));

    peer.on('call', (call: any) => {
      activeCallsRef.current.push(call);
      // Answer with the current stream from ref to avoid stale closures
      if (localStreamRef.current) {
        call.answer(localStreamRef.current);
      }
      call.on('stream', (remoteStream: MediaStream) => addRemoteStream(call.peer, remoteStream));
      call.on('close', () => activeCallsRef.current = activeCallsRef.current.filter(c => c.peer !== call.peer));
    });

    peer.on('disconnected', () => {
        setConnectionStatus("Reconnecting...");
        peer.reconnect();
    });

    peer.on('error', (err: any) => {
      if (err.type === 'unavailable-id') setConnectionStatus("ID Taken");
      else if (err.type === 'peer-unavailable') setConnectionStatus("Room Not Found");
      else setConnectionStatus("Error: " + err.type);
    });

    return () => peer.destroy();
  }, [view, isHost, roomId]); // Removed localStream from deps to prevent reconnection loops

  // Helper Functions
  const connectToHost = (peer: any, hostId: string) => {
      setConnectionStatus("Joining...");
      // Ensure we have a stream before calling
      if (!localStreamRef.current) {
          console.warn("No local stream available when trying to connect");
          // Proceeding might be okay if we just want to watch, but typically we want to send stream
      }
      
      const call = peer.call(hostId, localStreamRef.current!);
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
          if (isHost) sendSyncData({ type: 'NAVIGATE', bookId: currentBook.id, chapter: currentChapterNum });
      });
      conn.on('data', (data: SyncMessage) => handleIncomingData(data));
      conn.on('close', () => connectionsRef.current = connectionsRef.current.filter(c => c.id !== conn.peer));
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
          setRemoteStreams(prev => prev.map(p => p.id === data.senderId ? { ...p, isHandRaised: data.raised } : p));
          if (data.raised) {
              setChatMessages(prev => [...prev, { id: Date.now().toString(), senderId: 'System', text: `Peer ${data.senderId.slice(-4)} raised hand.`, timestamp: new Date(), isSystem: true }]);
          }
      }
  };

  const sendSyncData = (data: SyncMessage) => {
      connectionsRef.current.forEach(c => { if (c.conn.open) c.conn.send(data); });
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

  // Actions
  const handleCreateRoom = () => {
      const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
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
          } catch (e) { console.error(e); }
      } else {
          try {
              const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
              replaceTrackInActiveCalls(screenStream);
              setLocalStream(screenStream);
              if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
              setIsScreenSharing(true);
              screenStream.getVideoTracks()[0].onended = () => toggleScreenShare();
          } catch (err: any) { if (err.name !== 'NotAllowedError') console.error(err); }
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

  const startRecording = async () => {
    let streamToRecord: MediaStream | null = null;
    let type: 'screen' | 'camera' = 'screen';
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
        if (localStream) { streamToRecord = localStream; type = 'camera'; } 
        else { alert("No camera available."); return; }
    } else {
        try {
            streamToRecord = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        } catch (err: any) {
            if (err.name === 'NotAllowedError') return;
            if (localStream) { streamToRecord = localStream; type = 'camera'; }
            else return;
        }
    }

    if (!streamToRecord) return;

    let mimeType = 'video/mp4';
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';

    try {
        const recorder = new MediaRecorder(streamToRecord, { mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined });
        chunksRef.current = [];
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
            if (blob.size === 0) return;
            setPendingBlob({ blob, type });
            setRecordingName(`Study Session - ${new Date().toLocaleTimeString()}`);
            setShowSaveModal(true);
            if (type === 'screen') streamToRecord!.getTracks().forEach(track => track.stop());
        };
        recorder.start(1000); 
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
    } catch (e) { console.error(e); alert("Recording failed."); }
  };

  const stopRecording = () => { if (mediaRecorderRef.current && isRecording) { mediaRecorderRef.current.stop(); setIsRecording(false); } };
  const saveRecording = () => {
      if (!pendingBlob) return;
      onRecordingComplete({ id: Date.now().toString(), title: recordingName || 'Untitled', url: URL.createObjectURL(pendingBlob.blob), date: new Date(), duration: 'Session', type: pendingBlob.type });
      setShowSaveModal(false); setPendingBlob(null);
  };

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
      if (localStream) { localStream.getTracks().forEach(track => track.stop()); setLocalStream(null); }
      setRemoteStreams([]); setIsRecording(false); setView('menu'); onBack();
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, isChatOpen]);

  const getWindowDimensions = () => {
      if (isPipCollapsed) return { width: 'auto', height: 'auto' };
      if (pipSize === 'sm') return { width: '220px', height: '160px' };
      if (pipSize === 'md') return { width: '300px', height: '220px' };
      if (pipSize === 'lg') return { width: '480px', height: '360px' };
      return { width: '300px', height: '220px' };
  };

  const { width, height } = getWindowDimensions();

  // Renders... 
  if (showSaveModal) return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in pointer-events-auto">
            <div className="w-full max-w-md bg-[#161616] border border-white/10 rounded-3xl p-8 shadow-2xl">
                <h2 className="text-2xl font-serif text-white mb-2">Save Recording</h2>
                <div className="mb-6"><label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 block">Name</label><input type="text" value={recordingName} onChange={(e) => setRecordingName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500"/></div>
                <div className="flex gap-3"><button onClick={() => setShowSaveModal(false)} className="flex-1 py-3 rounded-xl text-white/60 hover:bg-white/5">Discard</button><button onClick={saveRecording} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold">Save</button></div>
            </div>
        </div>
  );

  if (view === 'menu' || view === 'setup' || view === 'library') {
      if (view === 'library') {
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/95">
                <div className="w-full max-w-lg bg-[#161616] border border-white/10 rounded-3xl p-8 h-[70vh] flex flex-col">
                    <button onClick={() => setView('menu')} className="mb-4 text-white/50"><ArrowLeft /></button>
                    <h2 className="text-2xl font-serif text-white mb-6">Library</h2>
                    <div className="flex-1 overflow-y-auto space-y-3">
                        {recordings.map(r => (
                            <div key={r.id} className="p-4 bg-white/5 rounded-xl flex justify-between items-center">
                                <div><div className="text-white">{r.title}</div><div className="text-xs text-white/40">{r.date.toLocaleDateString()}</div></div>
                                <a href={r.url} download={`${r.title}.mp4`} className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg"><Download size={16}/></a>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          )
      }
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
            <div className="w-full max-w-md bg-[#161616] border border-white/10 rounded-3xl p-8 text-center">
                {view === 'setup' && <button onClick={() => setView('menu')} className="absolute top-6 left-6 text-white/40"><ArrowLeft /></button>}
                {view === 'menu' && <button onClick={onBack} className="absolute top-6 left-6 text-white/40"><ArrowLeft /></button>}
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6"><Video className="text-emerald-400" size={36} /></div>
                <h2 className="font-serif text-3xl text-white mb-2">{view === 'setup' ? (isHost ? 'Hosting' : 'Joining') : 'Bible Study Suite'}</h2>
                
                {view === 'menu' ? (
                    <>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <button onClick={handleCreateRoom} className="p-6 rounded-2xl bg-emerald-600 text-white font-bold">Create</button>
                            <button onClick={() => { setIsHost(false); setView('setup'); }} className="p-6 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold">Join</button>
                        </div>
                        <button onClick={() => setView('library')} className="w-full py-3 rounded-xl border border-white/10 text-white/50 hover:text-white">Past Recordings</button>
                    </>
                ) : (
                    <>
                        <div className="relative w-full aspect-video bg-black rounded-2xl mb-6 overflow-hidden">
                            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                        </div>
                        {isHost ? (
                            <div className="mb-6"><p className="text-xs text-white/40 uppercase mb-2">Room Code</p><div className="flex items-center justify-center gap-2"><div className="bg-white/5 px-4 py-2 rounded text-emerald-400 font-mono text-xs">{roomId}</div><button onClick={copyRoomCode}><Copy size={16} className="text-white/50" /></button></div></div>
                        ) : (
                            <input type="text" value={inputRoomId} onChange={(e) => setInputRoomId(e.target.value)} placeholder="Enter Code" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 mb-6 text-white text-center" />
                        )}
                        <button onClick={() => { if(isHost || inputRoomId) setView('call'); }} className="w-full py-4 rounded-xl bg-emerald-600 text-white font-bold">Start Meeting</button>
                    </>
                )}
            </div>
        </div>
      );
  }

  // CALL VIEW
  return (
    <div className={`fixed inset-0 z-[60] animate-fade-in flex flex-col overflow-hidden ${mode === 'study' ? 'pointer-events-none' : 'bg-[#050505] pointer-events-auto'}`}>
        
        {/* FULLSCREEN BIBLE LAYER (Z-0) */}
        {mode === 'study' && (
            <div className="absolute inset-0 z-0 bg-transparent flex flex-col pt-16 pb-24 pointer-events-auto">
                <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#0a0a0a]/90 backdrop-blur-sm sticky top-0 z-10">
                    <h2 className="font-serif text-xl text-white">{currentBook.name} <span className="text-emerald-500">{currentChapterNum}</span></h2>
                    <button onClick={handleNextChapter} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors flex items-center gap-1 text-xs">Next <ChevronRight size={14} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar max-w-4xl mx-auto w-full bg-[#0a0a0a]">
                    {isLoadingBible ? <div className="text-center text-white/30 mt-10">Loading...</div> : (
                        <div className="space-y-4 pb-32">
                            {chapterData?.verses.map((v) => (
                                <span 
                                    id={`verse-${v.number}`} key={v.number} onClick={() => handleVerseClick(v.number)}
                                    className={`inline leading-loose text-lg md:text-2xl font-serif cursor-pointer transition-all duration-300 rounded px-1 decoration-clone ${activeVerse === v.number ? 'bg-emerald-500/30 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'text-white/80 hover:bg-white/5'}`}
                                >
                                    <sup className="text-xs text-white/30 mr-1 select-none">{v.number}</sup>{v.text}{" "}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* FLOATING VIDEO WINDOW (Z-100) - VIDEO ONLY */}
        <div 
            ref={pipRef}
            className={`
                z-[100] flex flex-col bg-[#121214] border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden transition-[width,height] duration-300 ease-in-out pointer-events-auto
                ${mode === 'grid' ? 'fixed inset-0 m-0 rounded-none w-auto h-auto' : 'fixed'}
            `}
            style={mode === 'study' ? { left: '20px', top: '80px', width, height } : {}}
        >
            {/* Window Header */}
            <div 
                className="flex items-center justify-between p-2 bg-white/5 cursor-grab active:cursor-grabbing border-b border-white/10 select-none"
                onMouseDown={mode === 'study' ? handleDragStart : undefined}
            >
                <div className="flex items-center gap-2 text-[10px] font-bold text-white/50 uppercase tracking-widest">
                    {mode === 'study' && <GripHorizontal size={14} />}
                    <span>Video Feed</span>
                </div>
                <div className="flex gap-2">
                    {mode === 'study' && (
                        <div className="flex bg-black/20 rounded-md p-0.5">
                            <button onClick={() => setPipSize('sm')} className={`px-2 py-0.5 text-[10px] rounded ${pipSize==='sm' ? 'bg-white/20 text-white' : 'text-white/30'}`}>S</button>
                            <button onClick={() => setPipSize('md')} className={`px-2 py-0.5 text-[10px] rounded ${pipSize==='md' ? 'bg-white/20 text-white' : 'text-white/30'}`}>M</button>
                            <button onClick={() => setPipSize('lg')} className={`px-2 py-0.5 text-[10px] rounded ${pipSize==='lg' ? 'bg-white/20 text-white' : 'text-white/30'}`}>L</button>
                        </div>
                    )}
                    {mode === 'study' && (
                        <button onClick={() => setIsPipCollapsed(!isPipCollapsed)} className="p-1 hover:bg-white/10 rounded text-white/50">
                            {isPipCollapsed ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Video Content */}
            {!isPipCollapsed && (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 relative bg-[#121214]">
                    <div className={`grid gap-2 ${mode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 p-4' : (pipSize === 'sm' ? 'grid-cols-1' : 'grid-cols-2')}`}>
                        <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-white/10 shadow-lg group">
                            <video ref={(el) => { if (el && localStream) el.srcObject = localStream; }} autoPlay muted playsInline className={`w-full h-full object-cover ${!isScreenSharing && 'transform scale-x-[-1]'} ${isVideoOff ? 'hidden' : ''}`} />
                            {isVideoOff && <div className="absolute inset-0 flex items-center justify-center text-white/30 text-xs font-bold">Off</div>}
                            <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] font-bold text-white backdrop-blur-sm">You</div>
                        </div>
                        {remoteStreams.map((peer) => (
                            <div key={peer.id} className="relative aspect-video bg-black rounded-lg overflow-hidden border border-white/10 shadow-lg">
                                <VideoPlayer stream={peer.stream} />
                                <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] font-bold text-white backdrop-blur-sm">Peer</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* CHAT DRAWER (Z-90) */}
        {isChatOpen && (
            <div className="fixed bottom-24 right-4 z-[90] w-80 h-96 bg-[#161618] border border-white/10 rounded-2xl shadow-2xl flex flex-col pointer-events-auto animate-slide-up">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <span className="text-xs font-bold text-white uppercase tracking-widest">Chat</span>
                    <button onClick={() => setIsChatOpen(false)}><X size={16} className="text-white/50 hover:text-white"/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatMessages.map(msg => (
                        <div key={msg.id} className={`flex flex-col ${msg.isSystem ? 'items-center' : msg.senderId === 'Me' || msg.senderId === 'Host' ? 'items-end' : 'items-start'}`}>
                            {!msg.isSystem ? (
                                <div className={`max-w-[90%] p-2 rounded-xl text-xs ${msg.senderId === 'Me' || msg.senderId === 'Host' ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white/90'}`}>
                                    {msg.text}
                                </div>
                            ) : (
                                <span className="text-[9px] text-white/30 uppercase bg-white/5 px-2 py-0.5 rounded-full">{msg.text}</span>
                            )}
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
                <div className="p-3 border-t border-white/10">
                    <div className="relative">
                        <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendChat()} placeholder="Message..." className="w-full bg-white/5 border border-white/10 rounded-full pl-3 pr-10 py-2 text-xs text-white focus:outline-none focus:border-emerald-500" />
                        <button onClick={handleSendChat} className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-300"><Send size={14} /></button>
                    </div>
                </div>
            </div>
        )}

        {/* TOP BAR */}
        <div className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-4 bg-gradient-to-b from-black/90 to-transparent z-[90] pointer-events-none">
             <div className="pointer-events-auto flex items-center gap-3">
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-2 backdrop-blur-md">
                    <span className="text-xs font-mono text-emerald-400 font-bold truncate max-w-[100px]">{isHost ? roomId : inputRoomId}</span>
                    <button onClick={copyRoomCode} className="text-white/30 hover:text-white"><Copy size={12} /></button>
                </div>
             </div>
             <div className="pointer-events-auto flex gap-2">
                 <button onClick={() => { if(isRecording) stopRecording(); else startRecording(); }} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md transition-all ${isRecording ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                    {isRecording ? <StopCircle size={14} /> : <Circle size={14} fill="currentColor" className="text-red-500" />}
                    <span className="hidden md:inline">{isRecording ? 'Rec' : 'Record'}</span>
                 </button>
                 <button onClick={() => setMode(mode === 'grid' ? 'study' : 'grid')} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md transition-all ${mode === 'study' ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                    {mode === 'study' ? <Layout size={14} /> : <BookOpen size={14} />}
                    <span className="hidden md:inline">{mode === 'study' ? 'Grid View' : 'Study Mode'}</span>
                 </button>
             </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black via-black/90 to-transparent flex items-center justify-center gap-4 px-6 pb-4 z-[90] pointer-events-auto">
            <div className="flex items-center gap-2 p-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/5">
                <button onClick={toggleMute} className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${isMuted ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>{isMuted ? <MicOff size={20} /> : <Mic size={20} />}</button>
                <button onClick={toggleVideo} className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${isVideoOff ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>{isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}</button>
            </div>
            <div className="flex items-center gap-2 p-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/5">
                <button onClick={() => setIsChatOpen(!isChatOpen)} className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${isChatOpen ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}><MessageSquare size={20} /></button>
                <button onClick={toggleHandRaise} className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${isHandRaised ? 'bg-blue-500 text-white' : 'text-white hover:bg-white/10'}`}><Hand size={20} /></button>
                <button onClick={toggleScreenShare} className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${isScreenSharing ? 'bg-emerald-500 text-white' : 'text-white hover:bg-white/10'}`}><Monitor size={20} /></button>
            </div>
            <button onClick={handleLeave} className="w-14 h-14 flex items-center justify-center rounded-3xl bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 transition-all ml-2"><PhoneOff size={24} /></button>
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