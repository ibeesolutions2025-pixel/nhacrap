
import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, 
  Settings, 
  Activity, 
  Volume2, 
  Download, 
  Music, 
  Sliders, 
  Mic, 
  Dna,
  Play,
  Pause,
  Layers,
  Monitor,
  RefreshCcw
} from 'lucide-react';
import { analyzeAndGenerateScore } from './services/geminiService';
import { AppState, VideoFile } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [result, setResult] = useState<any>(null);
  const [vocalVolume, setVocalVolume] = useState(0.4); // Mặc định vocal nhỏ hơn để nghe rõ nhạc
  const [musicVolume, setMusicVolume] = useState(0.9); // Nhạc nền to hơn
  const [isPlaying, setIsPlaying] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const musicAudioRef = useRef<AudioBufferSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideo({ file, previewUrl: URL.createObjectURL(file) });
    setAppState(AppState.PROCESSING);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const data = await analyzeAndGenerateScore(base64, file.type);
        setResult(data);
        setAppState(AppState.COMPLETE);
      } catch (err) {
        console.error(err);
        setAppState(AppState.IDLE);
      }
    };
  };

  const playMasteredSession = async () => {
    if (!result?.musicAudioData) return;
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = audioContextRef.current;

    const binary = atob(result.musicAudioData);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const dataInt16 = new Int16Array(bytes.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

    if (musicAudioRef.current) {
      try { musicAudioRef.current.stop(); } catch(e) {}
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gainNode = ctx.createGain();
    gainNode.gain.value = musicVolume;
    gainNodeRef.current = gainNode;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.volume = vocalVolume;
      videoRef.current.play();
    }
    
    source.start(0);
    musicAudioRef.current = source;
    setIsPlaying(true);
  };

  const stopPlayback = () => {
    if (musicAudioRef.current) {
      try { musicAudioRef.current.stop(); } catch(e) {}
    }
    if (videoRef.current) videoRef.current.pause();
    setIsPlaying(false);
  };

  useEffect(() => {
    if (gainNodeRef.current) gainNodeRef.current.gain.value = musicVolume;
    if (videoRef.current) videoRef.current.volume = vocalVolume;
  }, [musicVolume, vocalVolume]);

  const reset = () => {
    stopPlayback();
    setAppState(AppState.IDLE);
    setVideo(null);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-[#020205] text-white p-4 md:p-8 font-sans">
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-8 glass p-4 rounded-2xl border border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
            <Music className="text-white" size={20} />
          </div>
          <div>
            <h1 className="font-orbitron text-lg font-bold tracking-widest uppercase">RapCinematic <span className="text-violet-500">Free</span></h1>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">AI Beats Engine v1.0</p>
          </div>
        </div>
        <button onClick={reset} className="p-2 hover:bg-white/5 rounded-full transition-colors flex items-center gap-2 text-zinc-400 text-xs">
          <RefreshCcw size={14} /> Reset
        </button>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="relative aspect-video rounded-3xl overflow-hidden bg-zinc-900 border border-white/5 shadow-2xl group">
            {video ? (
              <>
                <video 
                  ref={videoRef}
                  src={video.previewUrl} 
                  className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`}
                  loop
                />
                {isPlaying && (
                  <div className="absolute inset-0 pointer-events-none flex items-end justify-center p-12 gap-1 opacity-50">
                    {[...Array(30)].map((_, i) => (
                      <div 
                        key={i} 
                        className="w-full bg-violet-500 rounded-full animate-pulse"
                        style={{ height: `${Math.random() * 80}%`, animationDuration: `${0.3 + Math.random()}s` }}
                      />
                    ))}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800/50 transition-all" onClick={() => document.getElementById('file-upload')?.click()}>
                <div className="w-16 h-16 bg-violet-600/10 rounded-full flex items-center justify-center mb-4 border border-violet-500/20">
                  <Mic size={24} className="text-violet-500" />
                </div>
                <p className="text-zinc-400 font-bold text-xs tracking-widest uppercase">Tải lên video Rap để tạo nhạc nền</p>
              </div>
            )}
            <input id="file-upload" type="file" hidden accept="video/*" onChange={handleUpload} />

            {appState === AppState.PROCESSING && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-6">
                <Dna className="text-violet-500 animate-spin mb-4" size={48} />
                <h2 className="text-xl font-orbitron font-bold">Đang Phối Nhạc...</h2>
                <p className="text-zinc-500 text-[10px] mt-2 tracking-[0.2em] uppercase">AI đang tự động tạo bản phối điện ảnh không lời</p>
              </div>
            )}
          </div>

          <div className="glass rounded-3xl p-8 border border-white/5">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-xs font-bold uppercase tracking-widest text-violet-400 flex items-center gap-2">
                  <Sliders size={16} /> Bàn Mixer Studio
                </h3>
                {result && (
                  <button 
                    onClick={isPlaying ? stopPlayback : playMasteredSession}
                    className={`px-8 py-3 rounded-full font-bold text-xs flex items-center gap-2 transition-all ${isPlaying ? 'bg-red-600' : 'bg-white text-black'}`}
                  >
                    {isPlaying ? <><Pause size={14}/> Dừng</> : <><Play size={14}/> Nghe Siêu Phẩm</>}
                  </button>
                )}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                    <span>VOCAL GỐC</span>
                    <span>{Math.round(vocalVolume * 100)}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="1" step="0.01" 
                    value={vocalVolume} 
                    onChange={(e) => setVocalVolume(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-bold text-violet-500">
                    <span>NHẠC NỀN AI (BEAT)</span>
                    <span>{Math.round(musicVolume * 100)}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="1" step="0.01" 
                    value={musicVolume} 
                    onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                  />
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="glass rounded-3xl p-6 border border-white/5">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-6">Kết Quả Phân Tích</h3>

            {result ? (
              <div className="space-y-6">
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Cảm xúc</p>
                  <p className="text-xl font-orbitron font-bold text-violet-400 uppercase">{result.analysis.mood}</p>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Lớp nhạc cụ điện ảnh</p>
                  {result.analysis.layers.map((layer: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 bg-black/40 p-3 rounded-xl border border-white/5">
                      <div className="w-6 h-6 rounded bg-violet-600/20 flex items-center justify-center text-violet-500">
                        <Layers size={12} />
                      </div>
                      <span className="text-xs text-zinc-300 font-medium">{layer}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/5 text-xs text-zinc-400 italic">
                  "{result.analysis.report}"
                </div>

                <button className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-violet-500/10">
                  <Download size={14} /> TẢI XUỐNG BẢN HD
                </button>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center opacity-20">
                <Music size={32} className="mb-4" />
                <p className="text-[10px] font-bold uppercase">Chưa có dữ liệu</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto mt-12 py-8 border-t border-white/5 text-center text-zinc-600 text-[9px] font-bold uppercase tracking-[0.3em]">
        RapCinematic AI • Sử dụng Model Flash Miễn Phí
      </footer>
    </div>
  );
};

export default App;
