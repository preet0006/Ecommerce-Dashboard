import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp, Sparkles, Database, Paperclip, Mic, MicOff,
  Square, X, FileText, CheckCircle2, AlertCircle
} from 'lucide-react';

export default function ChatComposer({
  onSendMessage,
  isStreaming,
  onStopStreaming,
}) {
  const [input, setInput]               = useState('');
  const [isRecording, setIsRecording]   = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveDbActive, setLiveDbActive] = useState(true);
  const [attachedFile, setAttachedFile] = useState(null);
  const [speechError, setSpeechError]   = useState(null);

  const textareaRef   = useRef(null);
  const fileInputRef  = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef      = useRef(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  // Voice recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!input.trim() && !attachedFile) || isStreaming) return;

    // Stop voice if still recording
    if (isRecording) {
      stopVoiceRecognition();
    }

    onSendMessage(input.trim(), {
      liveDb: liveDbActive,
      attachment: attachedFile,
    });

    setInput('');
    setAttachedFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Real File Upload Handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formatSize = (bytes) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const fileMeta = {
      name: file.name,
      size: formatSize(file.size),
      type: file.type || 'application/octet-stream',
      rawFile: file,
    };

    // If text / CSV / JSON, read a snippet summary
    if (file.name.endsWith('.csv') || file.name.endsWith('.txt') || file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result || '';
        const lines = text.split('\n').filter((l) => l.trim() !== '');
        fileMeta.contentSummary = `${lines.length} lines detected (First line: ${lines[0]?.slice(0, 80)}...)`;
        fileMeta.rawPreview = text.slice(0, 1000);
        setAttachedFile(fileMeta);
      };
      reader.readAsText(file);
    } else {
      fileMeta.contentSummary = `Attached binary / document file (${fileMeta.size})`;
      setAttachedFile(fileMeta);
    }

    // Reset file input value so same file can be chosen again if needed
    e.target.value = '';
  };

  // Real Voice Recognition (Web Speech API)
  const toggleVoiceRecognition = () => {
    setSpeechError(null);

    if (isRecording) {
      stopVoiceRecognition();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      setTimeout(() => setSpeechError(null), 4000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Supports Indian English & International

      let finalTranscript = '';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
            setInput((prev) => {
              const base = prev.trim();
              return base ? `${base} ${transcript.trim()}` : transcript.trim();
            });
          } else {
            interim += transcript;
          }
        }
      };

      recognition.onerror = (event) => {
        console.warn('[SpeechRecognition Error]', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission denied. Please allow microphone access.');
        } else if (event.error !== 'no-speech') {
          setSpeechError(`Voice error: ${event.error}`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('[Voice Start Error]', err);
      setSpeechError('Failed to start voice recognition.');
      setIsRecording(false);
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsRecording(false);
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv,.txt,.json,.pdf,.xlsx,.xls,.png,.jpg,.jpeg"
        className="hidden"
      />

      {/* Voice Error Banner */}
      {speechError && (
        <div className="mb-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between animate-enter">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0 text-red-600" />
            <span>{speechError}</span>
          </div>
          <button onClick={() => setSpeechError(null)} className="text-red-700 hover:text-red-900">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Active Voice Recording Status Bar */}
      {isRecording && (
        <div className="mb-2 p-2.5 rounded-xl bg-gradient-to-r from-red-500/10 via-red-500/20 to-red-500/10 border border-red-300 text-xs text-red-900 flex items-center justify-between animate-enter shadow-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
            </span>
            <span className="font-semibold">Listening to voice input... speak clearly</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-red-700 bg-white/80 px-2 py-0.5 rounded border border-red-200 text-[11px]">
              {formatTimer(recordingSeconds)}
            </span>
            <button
              type="button"
              onClick={stopVoiceRecognition}
              className="btn-primary !bg-red-600 !py-1 !px-2.5 text-[11px] font-bold"
            >
              Done / Stop
            </button>
          </div>
        </div>
      )}

      {/* Container with Glassmorphism & Subtle Emerald Glow */}
      <div
        className="relative rounded-2xl border transition-all duration-200 shadow-xl bg-surface"
        style={{
          borderColor: 'var(--color-border)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(31, 110, 76, 0.12)',
        }}
      >
        {/* Attachment Pill if file selected */}
        {attachedFile && (
          <div className="px-4 pt-3 flex items-center gap-2 animate-enter">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary-soft text-primary-strong text-xs font-mono border border-primary/30 shadow-2xs">
              <FileText size={14} className="text-primary" />
              <div className="flex flex-col min-w-0 max-w-md">
                <span className="font-bold truncate">{attachedFile.name}</span>
                <span className="text-[10px] text-ink-muted">{attachedFile.size} · Uploaded for AI analysis</span>
              </div>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="hover:text-red transition-colors ml-2 p-1 rounded hover:bg-surface"
                title="Remove attachment"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Input Text Area */}
        <div className="p-3.5 pb-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask GreenFibre AI about inventory, purchase orders, vendor rates, or upload a data file… (Shift + Enter for new line)"
            className="w-full resize-none bg-transparent outline-none text-xs md:text-sm text-ink placeholder:text-ink-muted/70 max-h-44 leading-relaxed font-sans"
            disabled={isStreaming}
          />
        </div>

        {/* Toolbar & Bottom Controls */}
        <div className="flex items-center justify-between px-3.5 pb-3 pt-1 border-t border-border/40">
          {/* Left Action Buttons */}
          <div className="flex items-center gap-1.5">
            {/* Live Database Sync Toggle */}
            <button
              type="button"
              onClick={() => setLiveDbActive(!liveDbActive)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all select-none border ${
                liveDbActive
                  ? 'bg-emerald-500/10 text-primary border-primary/30 hover:bg-emerald-500/20'
                  : 'bg-surface-raised text-ink-muted border-border hover:text-ink'
              }`}
              title="Toggle Live Neon Database Grounding"
            >
              <Database size={12} className={liveDbActive ? 'text-primary' : ''} />
              <span>Live DB: {liveDbActive ? 'Connected' : 'Off'}</span>
              {liveDbActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>

            {/* Attach File Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors flex items-center gap-1 text-xs"
              title="Attach CSV, JSON, TXT, PDF or Excel file"
            >
              <Paperclip size={15} />
              <span className="hidden sm:inline text-[11px] font-medium">Attach File</span>
            </button>

            {/* Voice Dictation Button */}
            <button
              type="button"
              onClick={toggleVoiceRecognition}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs ${
                isRecording
                  ? 'text-red bg-red-100 animate-pulse font-bold'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-raised'
              }`}
              title="Speak with Voice (Speech-to-Text)"
            >
              {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
              <span className="hidden sm:inline text-[11px] font-medium">{isRecording ? 'Listening...' : 'Voice'}</span>
            </button>
          </div>

          {/* Right Action: Send / Stop Button */}
          <div>
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                className="h-8 w-8 rounded-xl bg-ink text-white flex items-center justify-center transition-transform active:scale-95 shadow-xs hover:bg-red-700"
                title="Stop generating"
              >
                <Square size={13} fill="currentColor" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() && !attachedFile}
                className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  input.trim() || attachedFile
                    ? 'bg-primary text-white shadow-md shadow-emerald-900/20 hover:bg-primary-strong active:scale-95'
                    : 'bg-surface-raised text-ink-muted/50 cursor-not-allowed border'
                }`}
                title="Send Message (Enter)"
              >
                <ArrowUp size={16} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subtle Bottom Disclaimer */}
      <div className="text-center mt-2 text-[10px] text-ink-muted/80 flex items-center justify-center gap-1.5">
        <Sparkles size={10} className="text-primary" />
        <span>GreenFibre AI remembers user question history in Neon PostgreSQL & grounds answers with live ERP data.</span>
      </div>
    </div>
  );
}
