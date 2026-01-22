
import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Sparkles, 
  Copy, 
  Check, 
  Video, 
  Type, 
  Hash, 
  FileText,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Terminal,
  MousePointer2,
  Search,
  Layers
} from 'lucide-react';
import { VideoState, AppState } from './types';
import { processVideoContent } from './services/geminiService';

export default function App() {
  const [video, setVideo] = useState<VideoState | null>(null);
  const [appState, setAppState] = useState<AppState>({ status: 'idle', progress: 0 });
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyAll = () => {
    if (!video?.result) return;
    
    const { titles, description, tags, searchTags } = video.result;
    const formattedTags = tags.map(t => t.startsWith('#') ? t : `#${t}`).join(' ');
    const formattedSearchTags = searchTags.join(', ');
    
    const fullText = [
      `TITLE:\n${titles[0]}`,
      `DESCRIPTION:\n${description}`,
      `HASHTAGS:\n${formattedTags}`,
      `SEO TAGS:\n${formattedSearchTags}`
    ].join('\n\n');
    
    handleCopy(fullText, 'copy-all');
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setVideo({
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl,
      transcription: null,
      result: null
    });

    try {
      setAppState({ status: 'uploading', progress: 20 });
      const base64Data = await readFileAsBase64(file);
      
      setAppState({ status: 'transcribing', progress: 50 });
      
      const progressInterval = setInterval(() => {
        setAppState(prev => {
          if (prev.status === 'ready' || prev.status === 'error') {
            clearInterval(progressInterval);
            return prev;
          }
          const nextProgress = prev.progress + (98 - prev.progress) * 0.05;
          return { ...prev, progress: nextProgress, status: 'generating' };
        });
      }, 1500);

      const data = await processVideoContent(base64Data, file.type);
      
      clearInterval(progressInterval);

      setVideo(prev => prev ? { 
        ...prev, 
        transcription: data.transcription,
        result: data.result
      } : null);
      
      setAppState({ status: 'ready', progress: 100 });
    } catch (error: any) {
      console.error("Processing error:", error);
      setAppState({ 
        status: 'error', 
        progress: 0, 
        error: error.message || 'Ошибка при анализе. Если файл слишком большой, попробуйте сжать его.' 
      });
    }
  };

  const reset = () => {
    setVideo(null);
    setAppState({ status: 'idle', progress: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-300 font-sans selection:bg-indigo-500/40 selection:text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex items-center justify-between mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 rotate-3 hover:rotate-0 transition-transform cursor-pointer">
              <Sparkles className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white italic">ViraFlow <span className="text-indigo-500 not-italic font-medium text-base ml-2">Solo</span></h1>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.3em]">AI Content Architect</p>
            </div>
          </div>
          {video && (
            <button onClick={reset} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-all bg-slate-900/50 px-5 py-3 rounded-2xl border border-slate-800 hover:border-slate-700 group">
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              Новый проект
            </button>
          )}
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Side */}
          <div className="lg:col-span-5 space-y-8">
            {!video ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-[9/16] bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[48px] flex flex-col items-center justify-center p-12 text-center cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group relative overflow-hidden"
              >
                <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={handleFileUpload} />
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-24 h-24 bg-slate-800 rounded-[32px] flex items-center justify-center mb-8 shadow-2xl group-hover:scale-110 transition-transform">
                  <Upload className="w-10 h-10 text-slate-500 group-hover:text-indigo-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Загрузи видео</h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-[260px]">Нейросеть сделает транскрибацию и напишет виральное описание</p>
                <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800">
                  <MousePointer2 className="w-3 h-3" /> Выбрать файл
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 rounded-[48px] border border-slate-800 overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500">
                <div className="aspect-[9/16] relative bg-black group">
                  <video src={video.previewUrl!} className="w-full h-full object-cover" controls autoPlay muted loop />
                  <div className="absolute top-8 left-8 flex gap-3">
                    <span className="bg-black/40 backdrop-blur-xl text-white text-[11px] font-black px-4 py-2 rounded-2xl border border-white/10 uppercase tracking-widest">
                      {(video.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>
                </div>
                <div className="p-8 flex items-center gap-5 bg-gradient-to-b from-slate-900/80 to-slate-950 backdrop-blur-xl border-t border-slate-800">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                    <Video className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white truncate">{video.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black mt-1">Ready for analysis</p>
                  </div>
                </div>
              </div>
            )}

            {(appState.status !== 'idle' && appState.status !== 'ready') && (
              <div className="bg-slate-900/50 p-10 rounded-[40px] border border-indigo-500/10 shadow-2xl animate-in slide-in-from-bottom-8">
                <div className="flex justify-between items-end mb-8">
                  <div className="flex-1 pr-6">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Processing Engine</p>
                    <h4 className="font-black text-white text-xl leading-tight">
                      {appState.status === 'uploading' && 'Читаем файл...'}
                      {appState.status === 'transcribing' && 'Слушаем голос...'}
                      {appState.status === 'generating' && 'Пишем виральный текст...'}
                      {appState.status === 'error' && 'Ошибка'}
                    </h4>
                  </div>
                  {appState.status !== 'error' && (
                    <span className="text-4xl font-black text-indigo-500 tabular-nums italic">{Math.round(appState.progress)}%</span>
                  )}
                </div>
                {appState.status !== 'error' ? (
                  <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                    <div className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 transition-all duration-700 ease-out shadow-[0_0_20px_rgba(99,102,241,0.4)]" style={{ width: `${appState.progress}%` }} />
                  </div>
                ) : (
                   <div className="flex items-start gap-4 text-red-400 text-sm font-bold bg-red-400/5 p-6 rounded-3xl border border-red-400/20">
                     <AlertCircle className="w-6 h-6 shrink-0" />
                     {appState.error}
                   </div>
                )}
              </div>
            )}
          </div>

          {/* Right Side */}
          <div className="lg:col-span-7">
            {video?.result ? (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-12 duration-1000">
                
                {/* Master Copy Button */}
                <div className="flex justify-end">
                  <button 
                    onClick={copyAll}
                    className={`group flex items-center gap-3 px-8 py-5 rounded-[28px] text-sm font-black transition-all shadow-2xl hover:scale-[1.02] active:scale-95 border ${copiedField === 'copy-all' ? 'bg-green-600 border-green-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-500/50 text-white shadow-indigo-500/30'}`}
                  >
                    {copiedField === 'copy-all' ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Layers className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    )}
                    {copiedField === 'copy-all' ? 'ВСЁ СКОПИРОВАНО!' : 'СКОПИРОВАТЬ ВЕСЬ ПАКЕТ'}
                  </button>
                </div>

                {/* Titles Section */}
                <section className="bg-slate-900/40 rounded-[40px] border border-slate-800 p-10 backdrop-blur-sm shadow-xl">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                      <Type className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Виральные заголовки</h3>
                  </div>
                  <div className="space-y-5">
                    {video.result.titles.map((title, i) => (
                      <div key={i} className="group relative bg-slate-800/40 p-6 rounded-3xl border border-slate-800/50 hover:border-indigo-500/30 transition-all flex items-center justify-between hover:shadow-xl hover:shadow-indigo-500/5">
                        <p className="text-xl font-black text-white pr-10 leading-tight tracking-tight">{title}</p>
                        <button 
                          onClick={() => handleCopy(title, `title-${i}`)}
                          className={`shrink-0 p-4 rounded-2xl transition-all shadow-lg ${copiedField === `title-${i}` ? 'bg-green-500 text-white scale-110' : 'bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                        >
                          {copiedField === `title-${i}` ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Description Section */}
                <section className="bg-slate-900/40 rounded-[40px] border border-slate-800 p-10 backdrop-blur-sm shadow-xl">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
                        <FileText className="w-5 h-5 text-purple-400" />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Текст описания</h3>
                    </div>
                    <button 
                      onClick={() => handleCopy(video.result!.description, 'desc')}
                      className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-black transition-all shadow-lg ${copiedField === 'desc' ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'}`}
                    >
                      {copiedField === 'desc' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedField === 'desc' ? 'Скопировано' : 'Копировать'}
                    </button>
                  </div>
                  <div className="bg-slate-950/50 p-8 rounded-3xl border border-slate-800/50 leading-relaxed shadow-inner">
                    <p className="text-base text-slate-300 whitespace-pre-wrap">{video.result!.description}</p>
                  </div>
                </section>

                {/* Hashtags Section */}
                <section className="bg-slate-900/40 rounded-[40px] border border-slate-800 p-10 backdrop-blur-sm shadow-xl">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                        <Hash className="w-5 h-5 text-emerald-400" />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Хэштеги</h3>
                    </div>
                    <button 
                      onClick={() => handleCopy(video.result!.tags.map(t => t.startsWith('#') ? t : `#${t}`).join(' '), 'tags')}
                      className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-black transition-all shadow-lg ${copiedField === 'tags' ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'}`}
                    >
                      {copiedField === 'tags' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      Копировать все
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {video.result!.tags.map((tag, i) => (
                      <span key={i} className="bg-slate-800/50 text-emerald-400 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-500/10 hover:border-emerald-500/40 transition-colors cursor-default">
                        #{tag.replace('#', '')}
                      </span>
                    ))}
                  </div>
                </section>

                {/* Search Tags Section */}
                <section className="bg-slate-900/40 rounded-[40px] border border-slate-800 p-10 backdrop-blur-sm shadow-xl">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                        <Search className="w-5 h-5 text-indigo-400" />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Теги для поиска (SEO)</h3>
                    </div>
                    <button 
                      onClick={() => handleCopy(video.result!.searchTags.join(', '), 'searchTags')}
                      className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-black transition-all shadow-lg ${copiedField === 'searchTags' ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'}`}
                    >
                      {copiedField === 'searchTags' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      Копировать через запятую
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {video.result!.searchTags.map((tag, i) => (
                      <span key={i} className="bg-indigo-500/5 text-indigo-300 px-4 py-2 rounded-xl text-xs font-bold border border-indigo-500/20 hover:border-indigo-500/50 transition-colors cursor-default">
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>

                {/* Transcription Drawer */}
                <details className="group bg-slate-900/20 rounded-[40px] border border-slate-800/50 overflow-hidden">
                  <summary className="flex items-center justify-between p-10 cursor-pointer list-none select-none hover:bg-slate-800/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <Terminal className="w-5 h-5 text-slate-600" />
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-600">Транскрибация (Текст видео)</h3>
                    </div>
                    <ChevronRight className="w-6 h-6 text-slate-700 group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="px-10 pb-10">
                    <div className="bg-slate-950/30 p-8 rounded-3xl border border-slate-800/50">
                      <p className="text-xs font-mono text-slate-500 leading-loose tracking-wide">{video.transcription}</p>
                    </div>
                    <button 
                      onClick={() => handleCopy(video.transcription || '', 'trans')}
                      className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-400 transition-colors"
                    >
                      <Copy className="w-3 h-3" /> Копировать текст
                    </button>
                  </div>
                </details>
              </div>
            ) : (
              appState.status === 'idle' && (
                <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center">
                  <div className="w-32 h-32 bg-slate-900/50 rounded-[48px] border border-slate-800 flex items-center justify-center mb-10 shadow-2xl">
                    <Sparkles className="w-12 h-12 text-slate-700 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-600 tracking-tight">Готов к анализу</h3>
                  <p className="text-sm text-slate-700 max-w-sm mt-4 leading-relaxed font-medium">Загрузи свое видео, и я сделаю всю грязную работу за тебя: транскрибация, заголовки, хэштеги и SEO-теги.</p>
                </div>
              )
            )}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-slate-900 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">ViraFlow Solo • Powered by Gemini AI</p>
          <div className="flex gap-8">
            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Master Content Flow</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
