'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Sparkles, Square, Volume2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceInputProps {
  onSendMessage: (text: string, isAudio: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function VoiceInput({ onSendMessage, disabled = false, placeholder = 'Fale por áudio ou digite o que você precisa gravar...' }: VoiceInputProps) {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isExplicitlyRecordingRef = useRef<boolean>(false);
  const accumulatedTranscriptRef = useRef<string>('');
  const sessionTranscriptRef = useRef<string>('');
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Inicializar Web Speech API (reconhecimento de voz nativo em pt-BR)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setSpeechSupported(false);
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'pt-BR';

        recognition.onresult = (event: any) => {
          let sessionText = '';
          for (let i = 0; i < event.results.length; i++) {
            sessionText += event.results[i][0].transcript;
          }
          sessionTranscriptRef.current = sessionText;
          const full = (accumulatedTranscriptRef.current + ' ' + sessionText).trim();
          setInputText(full);
        };

        recognition.onerror = (event: any) => {
          // 'no-speech' acontece quando o usuário fica em silêncio pensando.
          // SILÊNCIO NÃO DEVE PARAR A GRAVAÇÃO!
          if (event.error === 'no-speech') {
            return;
          }
          if (event.error === 'not-allowed') {
            setSpeechError('Permissão do microfone negada no navegador.');
            stopRecording(false);
            return;
          }
          console.warn('Evento informativo no reconhecimento de voz:', event.error);
        };

        recognition.onend = () => {
          // Se o usuário AINDA está gravando e o navegador finalizou por silêncio/pausa:
          // REINICIA AUTOMATICAMENTE! O usuário decide quando parar!
          if (isExplicitlyRecordingRef.current) {
            if (sessionTranscriptRef.current.trim()) {
              accumulatedTranscriptRef.current = (
                accumulatedTranscriptRef.current +
                ' ' +
                sessionTranscriptRef.current
              ).trim();
              sessionTranscriptRef.current = '';
            }
            try {
              recognition.start();
            } catch (err) {
              // Silently ignore se já estiver reiniciando
            }
          } else {
            setIsRecording(false);
          }
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.error('Falha ao inicializar SpeechRecognition:', err);
        setSpeechSupported(false);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Timer de gravação contínua
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isRecording]);

  const startRecording = async () => {
    setSpeechError(null);
    if (!speechSupported) {
      setSpeechError('Seu navegador não suporta reconhecimento de voz direto. Digite sua mensagem.');
      return;
    }

    // Solicita acesso ao microfone para manter a captura de hardware ativa e estável
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
      }
    } catch (e) {
      console.warn('Permissão de áudio via getUserMedia:', e);
    }

    isExplicitlyRecordingRef.current = true;
    accumulatedTranscriptRef.current = '';
    sessionTranscriptRef.current = '';
    setInputText('');
    setIsRecording(true);

    try {
      recognitionRef.current?.start();
    } catch (e) {
      console.warn('Tentativa de iniciar reconhecimento:', e);
    }
  };

  const stopRecording = (shouldSend: boolean = false) => {
    isExplicitlyRecordingRef.current = false;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    try {
      recognitionRef.current?.stop();
    } catch (e) {}

    setIsRecording(false);

    const fullFinalText = (
      accumulatedTranscriptRef.current +
      ' ' +
      sessionTranscriptRef.current
    ).trim() || inputText.trim();

    if (shouldSend && fullFinalText) {
      onSendMessage(fullFinalText, true);
      setInputText('');
    }

    accumulatedTranscriptRef.current = '';
    sessionTranscriptRef.current = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || disabled) return;

    if (isRecording) {
      stopRecording(false);
    }

    onSendMessage(inputText.trim(), isRecording);
    setInputText('');
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full space-y-2">
      {speechError && (
        <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xs animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{speechError}</span>
        </div>
      )}

      {/* ESTADO 1: GRAVANDO ÁUDIO ATIVO */}
      {isRecording ? (
        <div className="bg-red-500/[0.08] border border-red-500/30 rounded-2xl p-3 sm:p-4 flex flex-col gap-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-8 h-8">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-50" />
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg">
                  <Mic className="w-3.5 h-3.5" />
                </div>
              </div>
                <span className="text-xs font-mono font-bold text-red-400 flex items-center gap-2">
                  <span>GRAVANDO ÁUDIO (PT-BR)</span>
                  <span className="bg-red-500/20 px-1.5 py-0.5 rounded text-[10px]">{formatTimer(recordingSeconds)}</span>
                </span>
                <p className="text-[11px] text-zinc-400">
                  Pode pausar para pensar à vontade — o microfone continuará ouvindo até você clicar em Enviar.
                </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => stopRecording(false)}
                className="py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => stopRecording(true)}
                disabled={!inputText.trim()}
                className="py-1.5 px-3.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-40"
              >
                <Send className="w-3 h-3" />
                <span>Enviar Áudio</span>
              </button>
            </div>
          </div>

          {/* ONDA SONORA ANIMADA */}
          <div className="flex items-center justify-center gap-1 py-1">
            {[40, 75, 55, 90, 60, 85, 45, 95, 70, 50, 80, 65, 40].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-red-400/80 rounded-full animate-pulse"
                style={{
                  height: `${Math.max(10, Math.min(32, (h * (recordingSeconds % 3 + 1)) / 3))}px`,
                  animationDuration: `${0.4 + (i % 4) * 0.15}s`,
                }}
              />
            ))}
          </div>

          {/* TRANSCRIÇÃO AO VIVO NA TELA */}
          <div className="bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-zinc-100 font-medium min-h-[38px] flex items-center">
            {inputText ? (
              <span>"{inputText}"</span>
            ) : (
              <span className="text-zinc-500 italic">Comece a falar... sua fala aparecerá aqui em tempo real.</span>
            )}
          </div>
        </div>
      ) : (
        /* ESTADO 2: BARRA NORMAL COM MICROFONE E TEXTO */
        <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-[#111318] border border-white/10 focus-within:border-amber-500/50 rounded-2xl p-2 transition-all shadow-lg">
          {/* BOTÃO PRINCIPAL DE ÁUDIO */}
          <button
            type="button"
            onClick={startRecording}
            disabled={disabled}
            className="w-10 h-10 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shrink-0"
            title="Falar por áudio (Reconhecimento de voz em Português)"
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* INPUT DE TEXTO */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            className="flex-1 bg-transparent px-2 text-xs text-white placeholder-zinc-500 focus:outline-none disabled:opacity-50"
          />

          {/* BOTÃO DE ENVIAR */}
          <button
            type="submit"
            disabled={!inputText.trim() || disabled}
            className="w-10 h-10 rounded-xl bg-white text-zinc-950 font-bold flex items-center justify-center transition-all hover:bg-zinc-200 active:scale-95 disabled:opacity-30 shrink-0"
            title="Enviar mensagem"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}
