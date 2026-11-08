import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PATIENTS_DATA, Patient } from '../data/patientsData';
import {
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  User,
  Users,
  Heart,
  HelpCircle,
  RefreshCw,
  AlertCircle,
  Wifi,
  WifiOff,
  CheckCircle2,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import {
  speakIndonesian,
  stopSpeaking,
  queueMultiSpeakerSpeech,
  playHospitalSound,
  triggerHaptic,
  createSpeechRecognizer,
  unlockAudioSystem,
  isAudioSystemUnlocked,
} from '../utils/speechUtils';

export interface GroupMessage {
  id: string;
  sender: 'user' | 'mentor' | 'patient' | 'family' | 'nurse';
  senderName: string;
  role: string;
  text: string;
  timestamp: string;
  emotion?: string;
  isOfflineFallback?: boolean;
}

export type ConversationTarget = 'all' | 'doctor' | 'patient' | 'family' | 'nurse';

interface AiConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPatient: Patient | null;
}

export const AiConsultationModal: React.FC<AiConsultationModalProps> = ({
  isOpen,
  onClose,
  selectedPatient: initialPatient,
}) => {
  // Current patient context (can be switched within modal)
  const [activePatient, setActivePatient] = useState<Patient>(
    initialPatient || PATIENTS_DATA[0]
  );
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);

  // Group conversation state
  const [targetRecipient, setTargetRecipient] = useState<ConversationTarget>('all');
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeakingActive, setIsSpeakingActive] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [audioNeedsUnlock, setAudioNeedsUnlock] = useState(!isAudioSystemUnlocked());
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  // AI Connection State
  const [aiStatus, setAiStatus] = useState<{
    online: boolean;
    provider: string;
    model: string;
    checking: boolean;
  }>({
    online: false,
    provider: 'checking',
    model: 'gemini-3.8-flash',
    checking: true,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechRecognizerRef = useRef<any>(null);

  // Update active patient when prop changes
  useEffect(() => {
    if (initialPatient) {
      setActivePatient(initialPatient);
    }
  }, [initialPatient]);

  // Check AI health on mount/open
  const checkAiHealth = useCallback(async () => {
    try {
      setAiStatus((prev) => ({ ...prev, checking: true }));
      const res = await fetch('/api/ai/health');
      if (res.ok) {
        const data = await res.json();
        setAiStatus({
          online: Boolean(data.online),
          provider: data.provider || 'gemini',
          model: data.model || 'gemini-3.8-flash',
          checking: false,
        });
      } else {
        setAiStatus({
          online: false,
          provider: 'offline_expert',
          model: 'Pakar K3RS Lokal',
          checking: false,
        });
      }
    } catch {
      setAiStatus({
        online: false,
        provider: 'offline_expert',
        model: 'Pakar K3RS Lokal',
        checking: false,
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      checkAiHealth();
    }
  }, [isOpen, checkAiHealth]);

  // Initialize unified welcome briefing when patient changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const p = activePatient;

      const initialHistory: GroupMessage[] = [
        {
          id: 'init-doc',
          sender: 'mentor',
          senderName: 'dr. Juwita Ninda, M.Kes',
          role: 'Dosen Pembimbing HIPERKES & K3RS',
          text: `Selamat datang di ruang perawatan ${p.room}! Kita mengkaji kasus ${p.name} (${p.age} th) dengan diagnosis ${p.diagnosis}. Pasien menghadapi bahaya ${p.hazardType} dan prioritas ${p.skpCategory}. Silakan berkomunikasi langsung dengan pasien, keluarga penunggu, atau tanyakan bimbingan K3RS kepada saya.`,
          timestamp: now,
        },
        {
          id: 'init-pat',
          sender: 'patient',
          senderName: p.name,
          role: `Pasien (${p.bedNumber})`,
          emotion: p.emotion,
          text: `Halo Ners... ${p.patientVoicePrompt}`,
          timestamp: now,
        },
        {
          id: 'init-fam',
          sender: 'family',
          senderName: p.familyMember.name,
          role: `Keluarga (${p.familyMember.relation})`,
          text: `Selamat datang Ners. Saya ${p.familyMember.name}, ${p.familyMember.relation} dari ${p.name}. ${p.familyMember.voicePrompt}`,
          timestamp: now,
        },
      ];

      setMessages(initialHistory);
    }
  }, [isOpen, activePatient]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  // Handle explicit audio activation
  const handleUnlockAudio = async () => {
    triggerHaptic('medium');
    playHospitalSound('beep');
    const unlocked = await unlockAudioSystem();
    if (unlocked) {
      setAudioNeedsUnlock(false);
      playHospitalSound('success');
    }
  };

  // Resilient send message with exponential retry
  const handleSendMessage = async (textToSend?: string, isRetry = false) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    triggerHaptic('light');
    playHospitalSound('click');
    const userTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    if (!isRetry) {
      const newUserMsg: GroupMessage = {
        id: Date.now().toString(),
        sender: 'user',
        senderName: 'Mahasiswa Ners Rajawali',
        role: 'Praktikan Keperawatan',
        text,
        timestamp: userTime,
      };
      setMessages((prev) => [...prev, newUserMsg]);
      setInputMessage('');
    }

    setIsLoading(true);
    setRetryMessage(null);

    // Exponential backoff fetch function
    const fetchWithRetry = async (attempt = 1): Promise<any> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 9000);

        const res = await fetch('/api/ai/group-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            target: targetRecipient,
            patientContext: activePatient,
            chatHistory: messages.slice(-8).map((m) => ({
              sender: m.sender,
              senderName: m.senderName,
              text: m.text,
            })),
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        return await res.json();
      } catch (err: any) {
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 800 * attempt));
          return fetchWithRetry(attempt + 1);
        }
        throw err;
      }
    };

    try {
      const data = await fetchWithRetry();
      const responsesList = data?.responses || [];

      if (responsesList.length === 0) {
        throw new Error('Respon kosong');
      }

      const newMessages: GroupMessage[] = responsesList.map((item: any, idx: number) => ({
        id: `${Date.now()}-${idx}`,
        sender: item.sender || 'mentor',
        senderName: item.senderName || 'Nakes',
        role: item.role || 'Pemberi Perawatan',
        emotion: item.emotion,
        text: item.text,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        isOfflineFallback: !data.isAiOnline,
      }));

      setMessages((prev) => [...prev, ...newMessages]);
      triggerHaptic('medium');

      // Speak speeches sequentially with distinct voices
      const speechQueueItems = responsesList.map((item: any, idx: number) => ({
        id: `${Date.now()}-${idx}`,
        speakerName: item.senderName,
        text: item.text,
        options: {
          pitch: item.voicePitch || 1.0,
          rate: item.voiceRate || 1.0,
          onStart: () => setIsSpeakingActive(true),
        },
      }));

      queueMultiSpeakerSpeech(speechQueueItems, () => {
        setIsSpeakingActive(false);
      });
    } catch (fetchError) {
      console.warn('Network error during AI response, invoking client clinical solver:', fetchError);

      // Local emergency expert fallback to prevent dead UI
      const clientFallback: GroupMessage = {
        id: `${Date.now()}-fallback`,
        sender: 'mentor',
        senderName: 'dr. Juwita Ninda, M.Kes',
        role: 'Dosen Pembimbing HIPERKES',
        text: `Pertanyaan yang sangat penting! Ingat hierarki pengendalian risiko: utamakan eliminasi dan rekayasa teknik (seperti mengunci rem dan memasang side rails) sebelum mengandalkan APD. Selalu lindungi diri Anda dan pasien sesuai SOP K3RS!`,
        timestamp: userTime,
        isOfflineFallback: true,
      };

      setMessages((prev) => [...prev, clientFallback]);
      setRetryMessage(text);

      speakIndonesian(clientFallback.text, {
        pitch: 1.05,
        rate: 1.0,
        onStart: () => setIsSpeakingActive(true),
        onEnd: () => setIsSpeakingActive(false),
      });
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
      alert('Perangkat Anda memerlukan izin mikrofon atau browser yang mendukung Web Speech API.');
    }
  };

  // Fast suggestion prompts based on active patient's hazard & safety category
  const getQuickPrompts = () => {
    const p = activePatient;
    return [
      `Bagaimana kondisi Bapak/Ibu sekarang?`,
      `Saya periksa rem ranjang dan naikkan side rails ya.`,
      `dr. Juwita, apa hierarki pengendalian risiko kasus ini?`,
      `Keluarga mohon selalu dampingi pasien ya bila ingin ke toilet.`,
      `Bagaimana SOP APD untuk bahaya ${p.hazardType}?`,
    ];
  };

  const quickPrompts = getQuickPrompts();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-md">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[92vh] max-h-[760px] overflow-hidden">
        {/* Top Header Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Institut Rajawali official badge */}
            <div className="w-10 h-10 rounded-full bg-white p-0.5 border border-sky-400 shadow-sm shrink-0 flex items-center justify-center overflow-hidden">
              <img src="/rajawali_logo.png" alt="Rajawali" className="w-full h-full object-contain" />
            </div>

            {/* Patient dropdown selection & title */}
            <div className="min-w-0 relative">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPatientDropdownOpen(!isPatientDropdownOpen)}
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 hover:text-sky-600 transition-colors text-left truncate"
                >
                  <span className="truncate">
                    {activePatient.bedNumber}: {activePatient.name} ({activePatient.age} th)
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                </button>

                {/* AI Connection status pill */}
                <div
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    aiStatus.online
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  }`}
                  title={
                    aiStatus.online
                      ? 'AI Gemini 3.8 Flash Terhubung Aktif'
                      : 'Mode Pakar Edukatif Lokal Siap Berjalan'
                  }
                >
                  {aiStatus.online ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Gemini Online</span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span>Mode Pakar K3RS</span>
                    </>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {activePatient.room} · {activePatient.diagnosis}
              </p>

              {/* Patient switch menu */}
              {isPatientDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 sm:w-80 max-h-64 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-1.5 space-y-1">
                  <div className="p-2 text-[11px] font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    PILIH PASIEN (30 KASUS HIPERKES):
                  </div>
                  {PATIENTS_DATA.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActivePatient(p);
                        setIsPatientDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        activePatient.id === p.id
                          ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="truncate">
                        {p.bedNumber} - {p.name} ({p.age} th)
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                        {p.hazardType}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={checkAiHealth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 transition-colors"
              title="Cek Status Koneksi AI"
            >
              <RefreshCw className={`w-4 h-4 ${aiStatus.checking ? 'animate-spin' : ''}`} />
            </button>

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

        {/* Audio Autoplay Unlocking Banner for Android / Mobile */}
        {audioNeedsUnlock && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2 flex items-center justify-between gap-3 text-xs font-bold">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 shrink-0 animate-bounce" />
              <span>Ketuk untuk mengaktifkan suara percakapan natural di perangkat Android Anda</span>
            </div>
            <button
              onClick={handleUnlockAudio}
              className="px-3 py-1 bg-slate-950 text-amber-300 rounded-lg hover:bg-slate-900 transition-colors text-[11px] font-black shrink-0"
            >
              AKTIFKAN AUDIO
            </button>
          </div>
        )}

        {/* Multi-Character Target Selector Toolbar */}
        <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> Arah Bicara:
          </span>

          <button
            onClick={() => setTargetRecipient('all')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              targetRecipient === 'all'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            👥 Diskusi Terpadu (Semua)
          </button>

          <button
            onClick={() => setTargetRecipient('doctor')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              targetRecipient === 'doctor'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            🩺 dr. Juwita (Dokter)
          </button>

          <button
            onClick={() => setTargetRecipient('patient')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              targetRecipient === 'patient'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            🛌 {activePatient.name} (Pasien)
          </button>

          <button
            onClick={() => setTargetRecipient('family')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              targetRecipient === 'family'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            👨‍👩‍👦 {activePatient.familyMember.name} (Keluarga)
          </button>

          {isSpeakingActive && (
            <button
              onClick={() => {
                stopSpeaking();
                setIsSpeakingActive(false);
              }}
              className="ml-auto px-2.5 py-1 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1 shrink-0"
            >
              <VolumeX className="w-3.5 h-3.5" /> Stop Suara
            </button>
          )}
        </div>

        {/* Group Conversation Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/70 dark:bg-slate-950/70">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isMentor = msg.sender === 'mentor';
            const isPatient = msg.sender === 'patient';
            const isFamily = msg.sender === 'family';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                {/* Speaker metadata chip */}
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isUser
                        ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                        : isMentor
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : isPatient
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                    }`}
                  >
                    {msg.senderName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {msg.role} {msg.emotion ? `· ${msg.emotion}` : ''} · {msg.timestamp}
                  </span>
                </div>

                {/* Speech bubble */}
                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-sky-600 text-white rounded-tr-none'
                      : isMentor
                      ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-2 border-emerald-500/30 rounded-tl-none'
                      : isPatient
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 border border-amber-300/60 dark:border-amber-800/60 rounded-tl-none'
                      : 'bg-purple-50 dark:bg-purple-950/40 text-purple-950 dark:text-purple-100 border border-purple-300/60 dark:border-purple-800/60 rounded-tl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2.5 text-xs text-slate-500 p-2">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping" />
              <span>Karakter di ruangan sedang berdiskusi...</span>
            </div>
          )}

          {retryMessage && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Simulasi dialihkan ke Mode Pakar Lokal untuk menjaga kelancaran interaksi.</span>
              </div>
              <button
                onClick={() => handleSendMessage(retryMessage, true)}
                className="px-2.5 py-1 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-bold shrink-0"
              >
                Coba Lagi
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="p-2 px-3 sm:px-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          <span className="text-[11px] text-slate-400 shrink-0 font-medium">Pertanyaan Cepat:</span>
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

        {/* Chat Input Bar */}
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
                ? 'Silakan berbicara ke mikrofon...'
                : targetRecipient === 'all'
                ? `Bicara ke semua orang di kamar ${activePatient.name}...`
                : targetRecipient === 'doctor'
                ? 'Konsultasi K3RS ke dr. Juwita Ninda, M.Kes...'
                : targetRecipient === 'patient'
                ? `Bicara dengan pasien ${activePatient.name}...`
                : `Bicara dengan keluarga ${activePatient.familyMember.name}...`
            }
            className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-40 transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
