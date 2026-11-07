import React, { useState, useEffect, useRef } from 'react';
import { Patient } from '../data/patientsData';
import { NurseAvatar } from './NurseAvatar';
import {
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MessageSquare,
  Sparkles,
  User,
  Heart,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import {
  speakIndonesian,
  stopSpeaking,
  playHospitalSound,
  triggerHaptic,
  createSpeechRecognizer,
} from '../utils/speechUtils';

interface Message {
  id: string;
  sender: 'user' | 'mentor' | 'patient';
  senderName: string;
  text: string;
  timestamp: string;
}

interface AiConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPatient: Patient | null;
}

export const AiConsultationModal: React.FC<AiConsultationModalProps> = ({
  isOpen,
  onClose,
  selectedPatient,
}) => {
  const [chatMode, setChatMode] = useState<'mentor' | 'patient'>('mentor');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeakingActive, setIsSpeakingActive] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechRecognizerRef = useRef<any>(null);

  // Initialize welcome message when modal opens or patient changes
  useEffect(() => {
    if (isOpen) {
      const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      if (selectedPatient && chatMode === 'patient') {
        setMessages([
          {
            id: 'init-p',
            sender: 'patient',
            senderName: selectedPatient.name,
            text: `Halo Suster/Ners. Saya ${selectedPatient.name} di ${selectedPatient.bedNumber}. ${selectedPatient.patientVoicePrompt}`,
            timestamp: now,
          },
        ]);
      } else {
        setMessages([
          {
            id: 'init-m',
            sender: 'mentor',
            senderName: 'dr. Juwita Ninda, M.Kes',
            text: selectedPatient
              ? `Halo Rekan Mahasiswa Keperawatan! Kita sedang mengkaji kasus ${selectedPatient.name} (${selectedPatient.bedNumber}) terkait bahaya ${selectedPatient.hazardType} dan ${selectedPatient.skpCategory}. Apa yang ingin Anda diskusikan mengenai diagnosis bahaya, hierarki pengendalian risiko, atau keselamatan pasien di sini?`
              : 'Halo Rekan Mahasiswa Keperawatan! Saya dr. Juwita Ninda, M.Kes, dosen pengampu mata kuliah HIPERKES dan Keselamatan Pasien. Silakan tanyakan hal apa pun seputar keselamatan kerja perawat di rumah sakit, pengendalian bahaya, atau penanganan kasus pasien.',
            timestamp: now,
          },
        ]);
      }
    }
  }, [isOpen, selectedPatient, chatMode]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    triggerHaptic('light');
    playHospitalSound('click');
    const userTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const newUserMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      senderName: 'Mahasiswa Ners',
      text,
      timestamp: userTime,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          mode: chatMode,
          patientContext: selectedPatient,
          chatHistory: messages.map((m) => ({ role: m.sender, content: m.text })),
        }),
      });

      const data = await res.json();
      const botReply = data.reply || 'Baik, perhatikan selalu protokol keselamatan K3RS.';

      const botTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const newBotMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: chatMode === 'patient' ? 'patient' : 'mentor',
        senderName: chatMode === 'patient' ? selectedPatient?.name || 'Pasien' : 'dr. Juwita Ninda, M.Kes',
        text: botReply,
        timestamp: botTime,
      };

      setMessages((prev) => [...prev, newBotMsg]);
      triggerHaptic('medium');

      // Speak reply out loud with natural Indonesian voice
      speakIndonesian(botReply, {
        pitch: chatMode === 'patient' ? selectedPatient?.patientVoicePitch ?? 1.0 : 1.05,
        rate: chatMode === 'patient' ? selectedPatient?.patientVoiceRate ?? 0.95 : 1.0,
        onStart: () => setIsSpeakingActive(true),
        onEnd: () => setIsSpeakingActive(false),
        onError: () => setIsSpeakingActive(false),
      });
    } catch (err) {
      console.error(err);
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'mentor',
        senderName: 'dr. Juwita Ninda, M.Kes',
        text: 'Maaf, terjadi kendala koneksi ke server AI. Namun ingat prinsip utama: utamakan keselamatan diri dan pasien sesuai SOP K3RS!',
        timestamp: userTime,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle voice recognition (Speech to Text)
  const handleToggleMic = () => {
    triggerHaptic('medium');
    if (isListeningMic) {
      speechRecognizerRef.current?.stop();
      setIsListeningMic(false);
      return;
    }

    const recognizer = createSpeechRecognizer(
      (transcript) => {
        setInputMessage(transcript);
        handleSendMessage(transcript);
        setIsListeningMic(false);
      },
      () => setIsListeningMic(false),
      (err) => {
        console.warn('Speech recognition error:', err);
        setIsListeningMic(false);
      }
    );

    if (recognizer) {
      speechRecognizerRef.current = recognizer;
      recognizer.start();
      setIsListeningMic(true);
      playHospitalSound('beep');
    } else {
      alert('Browser Anda belum mendukung input suara mikrofon.');
    }
  };

  const quickPrompts = selectedPatient
    ? [
        `Apa bahaya utama pada pasien ${selectedPatient.name}?`,
        'Bagaimana hierarki pengendalian yang paling tepat?',
        'Jelaskan dampak kelalaian kasus ini pada keselamatan pasien!',
      ]
    : [
        'Bagaimana mencegah tertusuk jarum di bangsal?',
        'Jelaskan konsep "Dua Keselamatan, Satu Sistem"!',
        'Apa langkah pertolongan pertama percikan darah ke mata?',
        'Bagaimana posisi ergonomis saat memindahkan pasien?',
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[90vh] max-h-[720px] overflow-hidden">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-700 dark:text-sky-300 font-bold border border-sky-200 dark:border-sky-800">
              {chatMode === 'mentor' ? 'DJ' : selectedPatient?.name.slice(0, 2) || 'PS'}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                {chatMode === 'mentor' ? 'Konsultasi dr. Juwita Ninda, M.Kes (Dosen Dokter)' : `Percakapan Pasien: ${selectedPatient?.name}`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {chatMode === 'mentor' ? 'Dosen & Dokter Spesialis HIPERKES' : `${selectedPatient?.bedNumber} · ${selectedPatient?.diagnosis}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode switch if a patient is selected */}
            {selectedPatient && (
              <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setChatMode('mentor')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    chatMode === 'mentor'
                      ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  AI Mentor
                </button>
                <button
                  onClick={() => setChatMode('patient')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    chatMode === 'patient'
                      ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Pasien
                </button>
              </div>
            )}

            <button
              onClick={() => {
                stopSpeaking();
                onClose();
              }}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Mentor Visual Banner */}
        {chatMode === 'mentor' && (
          <div className="bg-sky-50 dark:bg-sky-950/40 px-4 py-2 border-b border-sky-100 dark:border-sky-900/40 flex items-center justify-between text-xs text-sky-900 dark:text-sky-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
              <span>
                Asisten AI bersuara natural terintegrasi kurikulum dr. Juwita Ninda Suherman, M.Kes.
              </span>
            </div>
            {isSpeakingActive && (
              <button
                onClick={() => {
                  stopSpeaking();
                  setIsSpeakingActive(false);
                }}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 hover:underline"
              >
                <VolumeX className="w-3.5 h-3.5" /> Stop Suara
              </button>
            )}
          </div>
        )}

        {/* Chat Messages Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-950/50">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[11px] text-slate-400 mb-0.5 px-1 font-medium">
                  {msg.senderName} · {msg.timestamp}
                </span>
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-sky-600 text-white rounded-tr-none'
                      : msg.sender === 'patient'
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 border border-amber-200 dark:border-amber-900 rounded-tl-none'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-tl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
              <div className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
              <span>AI sedang merumuskan jawaban klinis...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="p-2 px-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          <span className="text-[11px] text-slate-400 shrink-0 font-medium">Contoh:</span>
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-sky-50 hover:text-sky-700 text-[11px] whitespace-nowrap transition-colors border border-slate-200 dark:border-slate-700 shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Input Bar with Android Mic & Audio integration */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <button
            onClick={handleToggleMic}
            className={`p-2.5 rounded-xl transition-all ${
              isListeningMic
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
            title={isListeningMic ? 'Mendengarkan suara Anda...' : 'Bicara lewat Mikrofon (Suara)'}
          >
            {isListeningMic ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={
              isListeningMic
                ? 'Silakan bicara ke mikrofon...'
                : chatMode === 'mentor'
                ? 'Ketik pertanyaan K3RS atau keselamatan pasien...'
                : `Bicara dengan pasien ${selectedPatient?.name}...`
            }
            className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-40 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
