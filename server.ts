import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Validate if GEMINI_API_KEY is an actual valid key (not placeholder or empty)
function isValidGeminiKey(key?: string): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  return (
    trimmed.length > 10 &&
    trimmed !== 'MY_GEMINI_API_KEY' &&
    !trimmed.startsWith('AIzaSy_fake') &&
    !trimmed.includes('placeholder')
  );
}

// Initialize Google GenAI on server side only if valid key exists
let ai: GoogleGenAI | null = null;
const hasValidKey = isValidGeminiKey(process.env.GEMINI_API_KEY);
if (hasValidKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (initErr) {
    console.warn('Google GenAI initialization notice:', initErr);
  }
}

// System instructions for dr. Juwita Ninda, M.Kes & Clinical Guidelines
const DOCTOR_SYSTEM_PROMPT = `
Anda adalah "dr. Juwita Ninda, M.Kes", dokter pendidik dan dosen pengampu spesialis Higiene Perusahaan, Kesehatan Kerja, dan Keselamatan Kerja (HIPERKES) serta Keselamatan Pasien (Patient Safety) dari Institut Kesehatan Rajawali.
Peran Anda:
1. Membimbing mahasiswa keperawatan dalam memahami konsep HIPERKES (Higiene Perusahaan, Kesehatan Kerja, Keselamatan Kerja, dan Ergonomi) dan 6 Sasaran Keselamatan Pasien (SKP).
2. Membantu mahasiswa menganalisis 30 kasus pasien di ruang belajar bangsal rumah sakit (bahaya biologis, kimia, fisik, ergonomi, dan psikososial).
3. Mengajarkan hierarki pengendalian risiko (Eliminasi, Substitusi, Rekayasa Teknik, Administratif, APD) dan prinsip 'Dua Keselamatan, Satu Sistem' (Keselamatan Tenaga Kesehatan melindungi Pasien).
4. Berbicara dengan gaya dokter pendidik yang ramah, hangat, berwibawa, bijaksana, jelas, dan sangat suportif untuk mahasiswa keperawatan. Jawab dalam 2-4 kalimat yang aplikatif dan mudah dipahami.
`;

// 1. Health check endpoint to diagnose AI connectivity and server readiness
app.get('/api/ai/health', (req, res) => {
  const activeKey = isValidGeminiKey(process.env.GEMINI_API_KEY);
  return res.json({
    status: 'ok',
    online: activeKey && ai !== null,
    model: 'gemini-3.8-flash',
    provider: activeKey && ai !== null ? 'gemini' : 'expert_offline_engine',
    timestamp: new Date().toISOString(),
    message: activeKey && ai !== null
      ? 'Koneksi ke Gemini AI aktif dan siap melayani simulasi.'
      : 'Mode Pakar Edukatif HIPERKES Lokal siap beroperasi tanpa kendala.',
  });
});

// Helper for generating clinical simulated responses offline or on fallback
function generateOfflineMultiResponse(
  message: string,
  target: string,
  patientContext: any
) {
  const lower = message.toLowerCase();
  const responses: Array<{
    sender: 'patient' | 'mentor' | 'family' | 'nurse';
    senderName: string;
    role: string;
    emotion?: string;
    text: string;
    voicePitch: number;
    voiceRate: number;
  }> = [];

  const pName = patientContext?.name || 'Tn. Hartono';
  const pDiagnosis = patientContext?.diagnosis || 'Post Laparatomi Hari ke-2';
  const pEmotion = patientContext?.emotion || 'Cemas & Khawatir';
  const pVoicePrompt = patientContext?.patientVoicePrompt || 'Badan saya masih lemas dan luka operasi masih ngilu.';
  const fmName = patientContext?.familyMember?.name || 'Ibu Hartono';
  const fmRelation = patientContext?.familyMember?.relation || 'Istri Pasien';
  const fmVoicePrompt = patientContext?.familyMember?.voicePrompt || 'Suster, tolong bantu bapak ya, lantainya agak licin.';
  const staffName = patientContext?.attendingStaff?.name || 'Ners Ratna, S.Kep';
  const staffRole = patientContext?.attendingStaff?.role || 'Perawat Bangsal';

  // Specific keywords matching
  const isGreeting = lower.includes('halo') || lower.includes('selamat') || lower.includes('pagi') || lower.includes('siang') || lower.includes('malam');
  const isFallOrSafety = lower.includes('jatuh') || lower.includes('licin') || lower.includes('ranjang') || lower.includes('rem') || lower.includes('side rail');
  const isNeedleOrSharps = lower.includes('jarum') || lower.includes('sharps') || lower.includes('suntik') || lower.includes('tertusuk');
  const isErgonomics = lower.includes('angkat') || lower.includes('gendong') || lower.includes('punggung') || lower.includes('sakit pinggang') || lower.includes('ergonomi');
  const isInfection = lower.includes('cuci tangan') || lower.includes('masker') || lower.includes('infeksi') || lower.includes('apd') || lower.includes('b3');

  // If target is ALL or includes PATIENT
  if (target === 'all' || target === 'patient') {
    let pText = '';
    if (isGreeting) {
      pText = `Halo Suster/Ners. Terima kasih sudah menjenguk saya. Tubuh saya rasanya masih ${pEmotion.toLowerCase()}, Sus.`;
    } else if (isFallOrSafety) {
      pText = `Iya Ners, tolong pasang pengaman ranjangnya ya. Tadi pas mau bangun, kepala saya agak pusing dan takut jatuh ke lantai.`;
    } else if (isNeedleOrSharps) {
      pText = `Iya Sus, tadi selang infus sempat tertarik sedikit waktu saya miringkan badan. Tolong dicek posisinya ya Sus.`;
    } else {
      pText = `${pVoicePrompt} Semoga dengan bantuan Ners, saya bisa segera pulih dengan aman.`;
    }

    responses.push({
      sender: 'patient',
      senderName: pName,
      role: `Pasien (${pDiagnosis})`,
      emotion: pEmotion,
      text: pText,
      voicePitch: patientContext?.patientVoicePitch || 0.9,
      voiceRate: patientContext?.patientVoiceRate || 0.95,
    });
  }

  // If target is ALL or includes FAMILY
  if (target === 'all' || target === 'family') {
    let fText = '';
    if (isGreeting) {
      fText = `Selamat bertugas Ners. Saya ${fmName} (${fmRelation}). Kami bersyukur perawat rajin mengecek kondisi ruangan.`;
    } else if (isFallOrSafety) {
      fText = `Terima kasih Ners sudah mengingatkan. Saya akan selalu mendampingi bapak dan tidak akan membiarkan beliau turun sendirian.`;
    } else {
      fText = `${fmVoicePrompt} Bila bapak butuh bantuan mendadak, saya akan langsung tekan tombol bel perawat di samping ranjang.`;
    }

    responses.push({
      sender: 'family',
      senderName: fmName,
      role: `Keluarga (${fmRelation})`,
      text: fText,
      voicePitch: patientContext?.familyMember?.voicePitch || 1.15,
      voiceRate: 0.98,
    });
  }

  // If target is ALL or includes DOCTOR
  if (target === 'all' || target === 'doctor') {
    let dText = '';
    if (isGreeting) {
      dText = `Bagus sekali Rekan Mahasiswa! Komunikasi terapeutik yang hangat kepada pasien dan keluarga adalah fondasi Sasaran Keselamatan Pasien (SKP 2). Selalu identifikasi nama dan tanggal lahir sebelum tindakan!`;
    } else if (isFallOrSafety) {
      dText = `Tepat sekali! Sesuai SKP 6 (Pencegahan Risiko Jatuh), pastikan selalu 3 hal: kunci kedua pedal rem roda ranjang, pasang side rails di kedua sisi, dan tempatkan bel panggilan dalam jangkauan pasien.`;
    } else if (isNeedleOrSharps) {
      dText = `Ingat prinsip HIPERKES: Penanganan benda tajam menganut 'No Two-Handed Recapping'! Gunakan safety box di titik tindakan (Point of Care) dan ganti saat 3/4 penuh untuk mencegah luka tusuk jarum (NSI).`;
    } else if (isErgonomics) {
      dText = `Perhatikan prinsip ergonomi K3RS: Atur ketinggian ranjang setinggi panggul sebelum transfer pasien, tekuk lutut, dekatkan beban ke tubuh, dan lakukan teknik team-lift jika pasien berisiko tinggi.`;
    } else if (isInfection) {
      dText = `Lakukan 5 Momen Cuci Tangan WHO dan 6 langkah kebersihan tangan. Perlindungan perawat dari bahaya biologis berbanding lurus dengan pencegahan Healthcare-Associated Infections (HAIs) pada pasien!`;
    } else {
      dText = `Analisis yang sangat baik untuk kasus ${pName}! Ingat semboyan kita: "Dua Keselamatan, Satu Sistem" — keselamatan Anda sebagai perawat secara langsung melindungi pasien yang Anda rawat.`;
    }

    responses.push({
      sender: 'mentor',
      senderName: 'dr. Juwita Ninda, M.Kes',
      role: 'Dosen Pembimbing HIPERKES & K3RS',
      text: dText,
      voicePitch: 1.05,
      voiceRate: 1.0,
    });
  }

  // If target is NURSE specifically
  if (target === 'nurse') {
    responses.push({
      sender: 'nurse',
      senderName: staffName,
      role: staffRole,
      text: `Saya ${staffName}. Catatan medis ruangan sudah diperbarui. Seluruh peralatan darurat, tabung oksigen, dan safety box telah siap dan sesuai SOP bangsal.`,
      voicePitch: 1.05,
      voiceRate: 1.0,
    });
  }

  return responses;
}

// 2. Real Multi-Way / Group Interaction Endpoint
// Supports shared room discussions between Student, Patient, Doctor, and Family
app.post('/api/ai/group-chat', async (req, res) => {
  try {
    const { message, target = 'all', patientContext, chatHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
    }

    // If Gemini client is active, call gemini-3.8-flash for rich multi-character dialogue
    if (ai) {
      try {
        const historyContext = chatHistory
          .slice(-6)
          .map((h: any) => `${h.senderName || h.sender}: "${h.text}"`)
          .join('\n');

        const pName = patientContext?.name || 'Tn. Hartono';
        const pAge = patientContext?.age || 62;
        const pDiagnosis = patientContext?.diagnosis || 'Post Laparatomi';
        const pEmotion = patientContext?.emotion || 'Cemas';
        const fmName = patientContext?.familyMember?.name || 'Ibu Hartono';
        const fmRelation = patientContext?.familyMember?.relation || 'Istri';

        const prompt = `
Anda mensimulasikan interaksi multi-pihak di ruang rawat rumah sakit (Bangsal Edukasi HIPERKES & Keselamatan Pasien):
- Mahasiswa Ners (Pengguna) baru saja berbicara: "${message}"
- Target pembicara yang dituju: "${target}" (pilihan: 'all' = semua merespons secara estafet, 'doctor' = dr. Juwita Ninda M.Kes saja, 'patient' = pasien saja, 'family' = keluarga saja).
- Konteks Pasien: ${pName} (${pAge} th, ${pDiagnosis}), Emosi: ${pEmotion}.
- Bahaya Lingkungan/K3RS: ${patientContext?.nurseSafetyDilemma || 'Lantai licin, rem ranjang belum terkunci'}.
- Penunggu: ${fmName} (${fmRelation}).
- Dosen Pembimbing: dr. Juwita Ninda, M.Kes (pakar HIPERKES & Patient Safety Institut Kesehatan Rajawali).

Riwayat percakapan sebelumnya:
${historyContext}

TUGAS:
Kembalikan JSON ARRAY bernama 'responses' yang berisi 1 hingga 3 giliran bicara yang saling merespons secara berurutan dan natural.
Setiap item objek JSON memiliki properti:
- "sender": salah satu dari ["patient", "family", "mentor", "nurse"]
- "senderName": string nama pembicara (misal "${pName}", "${fmName}", "dr. Juwita Ninda, M.Kes")
- "role": string peran pembicara (misal "Pasien Rawat Inap", "Keluarga Penunggu", "Dosen Dokter HIPERKES")
- "emotion": string emosi pembicara
- "text": ucapan pembicara (2-3 kalimat natural, jelas, aplikatif dalam bahasa Indonesia)
- "voicePitch": angka antara 0.8 sampai 1.2
- "voiceRate": angka antara 0.9 sampai 1.05

Format harus JSON murni tanpa markdown triple backticks jika memungkinkan.
`;

        // 5-second timeout safeguard to ensure instant response
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI response timeout')), 5000)
        );

        const response: any = await Promise.race([
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              systemInstruction: DOCTOR_SYSTEM_PROMPT,
            },
          }),
          timeoutPromise,
        ]);

        const rawText = response.text || '';
        let parsedData: any = null;
        try {
          parsedData = JSON.parse(rawText);
        } catch {
          // Attempt to extract JSON array
          const startIdx = rawText.indexOf('[');
          const endIdx = rawText.lastIndexOf(']');
          if (startIdx !== -1 && endIdx !== -1) {
            parsedData = JSON.parse(rawText.substring(startIdx, endIdx + 1));
          }
        }

        const responsesList = Array.isArray(parsedData)
          ? parsedData
          : parsedData?.responses && Array.isArray(parsedData.responses)
          ? parsedData.responses
          : null;

        if (responsesList && responsesList.length > 0) {
          return res.json({
            responses: responsesList,
            isAiOnline: true,
            source: 'gemini-3.8-flash',
          });
        }
      } catch (geminiError) {
        console.warn('Gemini group chat fallback to expert simulation:', geminiError);
      }
    }

    // Fallback to high-precision offline clinical simulator
    const fallbackResponses = generateOfflineMultiResponse(message, target, patientContext);
    return res.json({
      responses: fallbackResponses,
      isAiOnline: false,
      source: 'offline_expert_engine',
    });
  } catch (error: any) {
    console.error('Group chat error:', error);
    // Even in severe exception, return structured safe fallback so user never sees connection error
    const emergencyResponses = generateOfflineMultiResponse(
      req.body?.message || 'Halo',
      req.body?.target || 'all',
      req.body?.patientContext
    );
    return res.json({
      responses: emergencyResponses,
      isAiOnline: false,
      source: 'emergency_expert_fallback',
    });
  }
});

// 3. Single-Speaker Chat endpoint (backward compatible)
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, mode = 'mentor', patientContext, chatHistory } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
    }

    if (ai) {
      try {
        let systemPrompt = DOCTOR_SYSTEM_PROMPT;
        let promptText = message;

        if (mode === 'patient' && patientContext) {
          systemPrompt = `
Anda berperan sebagai pasien rumah sakit bernama ${patientContext.name}, usia ${patientContext.age} tahun, dirawat di ${patientContext.room}.
Diagnosis: ${patientContext.diagnosis}.
Kondisi bahaya di sekitar Anda: ${patientContext.nurseSafetyDilemma}.
Gejala/Keluhan Anda: ${patientContext.patientVoicePrompt}.
Kondisi emosi Anda: ${patientContext.emotion} (${patientContext.emotionDescription}).
Kepribadian: Wajar sebagai pasien yang sedang dirawat. Gunakan bahasa Indonesia sehari-hari, sopan, ekspresif sesuai emosi Anda. Jawablah maksimal 2-3 kalimat.
`;
          promptText = `Perawat berkata kepada Anda: "${message}". Tanggapilah sebagai pasien ${patientContext.name}.`;
        } else if (mode === 'family' && patientContext?.familyMember) {
          const fm = patientContext.familyMember;
          systemPrompt = `
Anda berperan sebagai anggota keluarga pasien:
Nama: ${fm.name} (${fm.relation} dari pasien ${patientContext.name}).
Kekhawatiran: ${fm.voicePrompt}.
Peran: ${fm.roleInSafety}.
Berikan tanggapan 2-3 kalimat bahasa Indonesia sopan dan peduli terhadap keselamatan pasien.
`;
          promptText = `Perawat berbicara kepada Anda: "${message}". Tanggapilah sebagai keluarga penunggu ${fm.name}.`;
        } else {
          // dr. Juwita Ninda mode
          promptText = `Konteks Kasus: ${patientContext?.name || 'Umum'} - ${patientContext?.diagnosis || 'HIPERKES Bangsal'}\nPertanyaan Mahasiswa: "${message}"\nBerikan bimbingan klinis dokter pendidik yang aplikatif dan mendidik (maksimal 3 kalimat).`;
        }

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: promptText,
          config: {
            systemInstruction: systemPrompt,
          },
        });

        const replyText = response.text || 'Perhatikan selalu keselamatan Anda dan pasien sesuai SOP K3RS.';
        return res.json({ reply: replyText, isAiOnline: true });
      } catch (geminiError) {
        console.warn('Gemini chat fallback to expert simulation:', geminiError);
      }
    }

    // Offline simulation response
    const multi = generateOfflineMultiResponse(message, mode === 'mentor' ? 'doctor' : mode, patientContext);
    const chosen = multi[0]?.text || 'Selalu utamakan keselamatan diri dan pasien sesuai SOP K3RS.';
    return res.json({ reply: chosen, isAiOnline: false });
  } catch (error: any) {
    console.error('Error handling AI chat:', error);
    return res.json({
      reply: 'Utamakan selalu keselamatan kerja perawat dan keselamatan pasien sesuai SOP K3RS dan SKP.',
      isAiOnline: false,
    });
  }
});

// Vite middleware for development & static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer();

