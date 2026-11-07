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
  sender: 'user' | 'mentor' | 'patient' | 'family';
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
  const [chatMode, setChatMode] = useState<'mentor' | 'patient' | 'family'>('mentor');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeakingActive, setIsSpeakingActive] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechRecognizerRef = useRef<any>(null);

  // Initialize welcome message when modal opens or patient/mode changes
  useEffect(() => {
    if (isOpen) {
      const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      if (selectedPatient && chatMode === 'patient') {
        setMessages([
          {
            id: 'init-p',
            sender: 'patient',
            senderName: `${selectedPatient.name} (${selectedPatient.emotion})`,
            text: `Halo Suster/Ners. Saya ${selectedPatient.name} di ${selectedPatient.bedNumber}. ${selectedPatient.patientVoicePrompt}`,
            timestamp: now,
          },
        ]);
      } else if (selectedPatient && chatMode === 'family') {
        setMessages([
          {
            id: 'init-f',
            sender: 'family',
            senderName: `${selectedPatient.familyMember.name} (${selectedPatient.familyMember.relation})`,
            text: `Halo Suster/Ners, saya ${selectedPatient.familyMember.name} (${selectedPatient.familyMember.relation} dari ${selectedPatient.name}). ${selectedPatient.familyMember.voicePrompt}`,
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
      let senderName = 'dr. Juwita Ninda, M.Kes';
      if (chatMode === 'patient') {
        senderName = selectedPatient ? `${selectedPatient.name} (${selectedPatient.emotion})` : 'Pasien';
      } else if (chatMode === 'family') {
        senderName = selectedPatient ? `${selectedPatient.familyMember.name} (${selectedPatient.familyMember.relation})` : 'Keluarga Pasien';
      }

      const newBotMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: chatMode,
        senderName,
        text: botReply,
        timestamp: botTime,
      };

      setMessages((prev) => [...prev, newBotMsg]);
      triggerHaptic('medium');

      // Speak reply out loud with natural Indonesian voice & emotions
      let voicePitch = 1.05;
      let voiceRate = 1.0;
      if (chatMode === 'patient' && selectedPatient) {
        voicePitch = selectedPatient.patientVoicePitch;
        voiceRate = selectedPatient.patientVoiceRate;
      } else if (chatMode === 'family' && selectedPatient) {
        voicePitch = selectedPatient.familyMember.voicePitch;
        voiceRate = 0.95;
      }

      speakIndonesian(botReply, {
        pitch: voicePitch,
        rate: voiceRate,
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

  const getQuickPrompts = () => {
    if (!selectedPatient) {
      return [
        'Bagaimana mencegah tertusuk jarum di bangsal?',
        'Jelaskan konsep "Dua Keselamatan, Satu Sistem"!',
        'Apa langkah pertolongan pertama percikan darah ke mata?',
        'Bagaimana posisi ergonomis saat memindahkan pasien?',
      ];
    }
    if (chatMode === 'patient') {
      return [
        `Bagaimana kondisi Bapak/Ibu sekarang?`,
        'Apakah ada rasa nyeri atau tidak nyaman?',
        'Jangan turun ranjang sendirian ya Pak/Bu, panggil kami lewat bel.',
        'Kami akan bantu atur posisi tidur agar lebih nyaman.',
      ];
    }
    if (chatMode === 'family') {
      return [
        `Halo ${selectedPatient.familyMember.name}, apakah ada yang bisa kami bantu?`,
        'Mohon selalu pastikan pengaman ranjang terpasang saat ditinggal.',
        'Bagaimana nafsu makan dan istirahat pasien hari ini?',
        'Bila infus bunyi atau pasien ingin ke toilet, segera tekan bel ya Bu/Pak.',
      ];
    }
    return [
      `Apa bahaya utama pada pasien ${selectedPatient.name}?`,
      'Bagaimana hierarki pengendalian yang paling tepat?',
      'Jelaskan dampak kelalaian kasus ini pada keselamatan pasien!',
      'Bagaimana SOP penanganan APD & limbah medis untuk kasus ini?',
    ];
  };

  const quickPrompts = getQuickPrompts();

  const getHeaderInfo = () => {
    if (chatMode === 'mentor') {
      return {
        initials: 'DJ',
        bg: 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
        title: 'dr. Juwita Ninda, M.Kes',
        subtitle: selectedPatient
          ? `Membimbing Kasus ${selectedPatient.name} (${selectedPatient.bedNumber})`
          : 'Dosen & Dokter Spesialis HIPERKES RS',
      };
    }
    if (chatMode === 'patient' && selectedPatient) {
      return {
        initials: selectedPatient.name.slice(0, 2),
        bg: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        title: `${selectedPatient.name} ${selectedPatient.emotionEmoji}`,
        subtitle: `Emosi: ${selectedPatient.emotion} · ${selectedPatient.bedNumber} · ${selectedPatient.room}`,
      };
    }
    if (chatMode === 'family' && selectedPatient) {
      return {
        initials: selectedPatient.familyMember.name.slice(0, 2),
        bg: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        title: `${selectedPatient.familyMember.name} (${selectedPatient.familyMember.relation})`,
        subtitle: `Penunggu Pasien ${selectedPatient.name} · ${selectedPatient.bedNumber}`,
      };
    }
    return {
      initials: 'DJ',
      bg: 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      title: 'dr. Juwita Ninda, M.Kes',
      subtitle: 'Dosen & Dokter Spesialis HIPERKES',
    };
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[90vh] max-h-[720px] overflow-hidden">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border shrink-0 ${headerInfo.bg}`}>
              {headerInfo.initials}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                {headerInfo.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {headerInfo.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* 3-way mode switch if a patient is selected */}
            {selectedPatient && (
              <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-0.5 rounded-xl text-xs">
                <button
                  onClick={() => setChatMode('mentor')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    chatMode === 'mentor'
                      ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                  title="Konsultasi Dosen Dokter"
                >
                  dr. Juwita
                </button>
                <button
                  onClick={() => setChatMode('patient')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    chatMode === 'patient'
                      ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                  title="Komunikasi dengan Pasien"
                >
                  Pasien
                </button>
                <button
                  onClick={() => setChatMode('family')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    chatMode === 'family'
                      ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                  title="Interaksi Keluarga Pasien"
                >
                  Keluarga
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

        {/* Dynamic Context Banner */}
        <div className={`px-4 py-2 border-b flex items-center justify-between text-xs ${
          chatMode === 'mentor'
            ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-100 dark:border-sky-900/40 text-sky-900 dark:text-sky-200'
            : chatMode === 'patient'
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/40 text-amber-900 dark:text-amber-200'
            : 'bg-purple-50 dark:bg-purple-950/40 border-purple-100 dark:border-purple-900/40 text-purple-900 dark:text-purple-200'
        }`}>
          <div className="flex items-center gap-2 truncate">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {chatMode === 'mentor' && 'Bimbingan dokter pengampu HIPERKES dr. Juwita Ninda, M.Kes'}
              {chatMode === 'patient' && selectedPatient && `Berbicara langsung dengan ${selectedPatient.name} (${selectedPatient.emotionDescription})`}
              {chatMode === 'family' && selectedPatient && `Interaksi dengan ${selectedPatient.familyMember.name} · ${selectedPatient.familyMember.note}`}
            </span>
          </div>
          {isSpeakingActive && (
            <button
              onClick={() => {
                stopSpeaking();
                setIsSpeakingActive(false);
              }}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 shrink-0 hover:underline"
            >
              <VolumeX className="w-3.5 h-3.5" /> Stop Suara
            </button>
          )}
        </div>

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
                      : msg.sender === 'family'
                      ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-950 dark:text-purple-100 border border-purple-200 dark:border-purple-900 rounded-tl-none'
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
              <span>AI sedang merespons...</span>
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
                ? 'Ketik pertanyaan K3RS atau konsultasi ke dr. Juwita...'
                : chatMode === 'patient'
                ? `Bicara dengan pasien ${selectedPatient?.name}...`
                : `Bicara dengan keluarga ${selectedPatient?.familyMember.name}...`
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
