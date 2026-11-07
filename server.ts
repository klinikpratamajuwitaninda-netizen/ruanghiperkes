import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize Google GenAI on server side
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// System instructions for AI Nurse Specialist & Patient Personas
const NURSE_SYSTEM_PROMPT = `
Anda adalah "Ns. Juwita, S.Kep., M.Kep., Sp.K3RS", seorang perawat konsultan senior spesialis Keselamatan dan Kesehatan Kerja Rumah Sakit (K3RS) dan Keselamatan Pasien (Patient Safety) dari Institut Kesehatan Rajawali, berdasarkan kurikulum modul dr. Juwita Ninda Suherman, M.Kes.
Peran Anda:
1. Menjawab pertanyaan mahasiswa keperawatan mengenai HIPERKES (Higiene Perusahaan, Kesehatan Kerja, Keselamatan Kerja, dan Ergonomi) dan 6 Sasaran Keselamatan Pasien (SKP).
2. Membimbing mahasiswa dalam menganalisis 30 kasus pasien di bangsal rumah sakit (bahaya biologis, kimia, fisik, ergonomi, dan psikososial).
3. Mengajarkan hierarki pengendalian risiko (Eliminasi, Substitusi, Rekayasa Teknik, Administratif, APD) dan prinsip 'Dua Keselamatan, Satu Sistem' (Keselamatan Perawat melindungi Pasien).
4. Berbicara dengan bahasa Indonesia yang hangat, profesional, edukatif, suportif, dan praktis layaknya perawat pendidik di rumah sakit.
`;

// Chat endpoint supporting both AI Nurse Mentor and Patient Simulation
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, mode, patientContext, chatHistory } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
    }

    // If Gemini client is available, attempt to generate real AI response
    if (ai) {
      try {
        let systemPrompt = NURSE_SYSTEM_PROMPT;
        let promptText = message;

        if (mode === 'patient' && patientContext) {
          systemPrompt = `
Anda berperan sebagai pasien rumah sakit bernama ${patientContext.name}, usia ${patientContext.age} tahun, dirawat di ${patientContext.room}.
Diagnosis: ${patientContext.diagnosis}.
Kondisi bahaya di sekitar Anda: ${patientContext.nurseSafetyDilemma}.
Gejala/Keluhan Anda: ${patientContext.patientVoicePrompt}.
Kepribadian Anda: Bersikaplah wajar sebagai pasien yang sedang dirawat. Gunakan bahasa Indonesia sehari-hari, sopan, kadang menunjukkan rasa cemas, sakit, atau butuh bantuan perawat. Jawablah maksimal 2-3 kalimat agar natural seperti percakapan langsung di tempat tidur pasien.
`;
          promptText = `Perawat berkata kepada Anda: "${message}". Tanggapilah sebagai pasien ${patientContext.name}.`;
        } else {
          // Nurse mentor mode
          let contextAddition = '';
          if (patientContext) {
            contextAddition = `
[Konteks Kasus Saat Ini]:
Pasien: ${patientContext.name} (${patientContext.age} th) - ${patientContext.diagnosis}
Kategori Bahaya: ${patientContext.hazardType}
Sasaran Keselamatan Pasien: ${patientContext.skpCategory}
Isu Keselamatan: ${patientContext.nurseSafetyDilemma}
Hierarki Pengendalian yang Tepat: ${patientContext.recommendedControl}
`;
          }
          promptText = `${contextAddition}\nPertanyaan / Tindakan Mahasiswa: "${message}"\nBerikan tanggapan edukatif singkat, tepat, ramah, dan aplikatif klinis (maksimal 3-4 kalimat).`;
        }

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: promptText,
          config: {
            systemInstruction: systemPrompt,
          },
        });

        const replyText = response.text || 'Baik, perhatikan selalu keselamatan Anda dan pasien.';
        return res.json({ reply: replyText });
      } catch (geminiError) {
        console.warn('Gemini API call returned an error, falling back to clinical expert response:', geminiError);
        // Fall through to resilient simulated responses
      }
    }

    // Fallback intelligent simulation responses (if API key not set or during local offline testing)
    const lower = message.toLowerCase();
    let simulatedReply = '';

    if (mode === 'patient' && patientContext) {
      if (lower.includes('halo') || lower.includes('selamat') || lower.includes('pagi') || lower.includes('siang') || lower.includes('malam')) {
        simulatedReply = `Halo Suster/Ners. Terima kasih sudah memeriksa saya di ${patientContext.room}. Badan saya masih agak lemas, Sus.`;
      } else if (lower.includes('sakit') || lower.includes('keluhan') || lower.includes('kondisi') || lower.includes('rasa')) {
        simulatedReply = `${patientContext.patientVoicePrompt} Mohon dibantu ya Sus agar saya merasa lebih aman dan nyaman.`;
      } else if (lower.includes('obat') || lower.includes('suntik') || lower.includes('infus')) {
        simulatedReply = `Iya Sus, tolong dicek benar-benar nama saya di gelang ya. Tadi saya agak was-was melihat jarum dan kabel di sekitar tempat tidur.`;
      } else if (lower.includes('bantu') || lower.includes('duduk') || lower.includes('pindah') || lower.includes('jalan')) {
        simulatedReply = `Tolong bantu saya pelan-pelan ya Ners. Pinggang dan kaki saya masih belum kuat untuk menopang beban sendiri.`;
      } else {
        simulatedReply = `Terima kasih atas perhatiannya Ners. Saya merasa jauh lebih tenang setelah perawat menjelaskan tindakan keselamatan ini dengan baik.`;
      }
    } else {
      // AI Nurse Specialist Mentor response
      if (lower.includes('jarum') || lower.includes('sharps') || lower.includes('tertusuk')) {
        simulatedReply = `Prinsip utama pengelolaan benda tajam adalah: jangan pernah melakukan penutupan jarum kembali dengan dua tangan (no two-handed recapping), siapkan wadah safety box di titik tindakan (point of care), dan buang saat wadah mencapai 3/4 penuh. Jika tertusuk, segera cuci dengan air mengalir dan sabun, lalu lapor untuk profilaksis pascapajanan (PEP).`;
      } else if (lower.includes('jatuh') || lower.includes('lantai') || lower.includes('roda')) {
        simulatedReply = `Pencegahan risiko jatuh pasien (SKP 6) dimulai dari memastikan rem roda tempat tidur selalu terkunci, memasang pengaman sisi tempat tidur (side rails), mengamankan lantai basah dengan rambu peringatan, serta memasang gelang risiko jatuh warna kuning.`;
      } else if (lower.includes('angkat') || lower.includes('ergonomi') || lower.includes('punggung') || lower.includes('transfer')) {
        simulatedReply = `Untuk mencegah penyakit akibat kerja (PAK) berupa low back pain atau hernia nukleus pulposus, selalu nilai kemampuan pasien terlebih dahulu. Gunakan alat bantu transfer slide sheet, atur ketinggian bed setinggi panggul, tekuk lutut, dekatkan beban ke tubuh, dan mintalah bantuan rekan kerja (team lift).`;
      } else if (lower.includes('b3') || lower.includes('kimia') || lower.includes('disinfektan') || lower.includes('label')) {
        simulatedReply = `Bahaya kimia harus dikendalikan mulai dari membaca Safety Data Sheet (SDS/LDK), memastikan wadah bahan kimia selalu memiliki label identitas dan simbol bahaya GHS, bekerja di ruangan berventilasi memadai, serta menggunakan sarung tangan nitril dan masker pelindung.`;
      } else if (lower.includes('shift') || lower.includes('lelah') || lower.includes('stres') || lower.includes('malam')) {
        simulatedReply = `Kelelahan kerja (fatigue) adalah bahaya psikososial yang berisiko langsung memicu Kejadian Nyaris Celaka (KNC) seperti salah pemberian obat. K3RS mewajibkan jeda istirahat yang cukup, rotasi shift yang adil, serta prinsip open communication jika perawat merasa tidak fit untuk tindakan kritis.`;
      } else {
        simulatedReply = `Bagus sekali telah memperhatikan aspek ini! Ingat prinsip 'Dua Keselamatan, Satu Sistem': melindungi tenaga kesehatan dari bahaya biologis, kimia, fisik, ergonomi, dan psikososial secara langsung menjamin mutu dan keselamatan pasien.`;
      }
    }

    return res.json({ reply: simulatedReply });
  } catch (error: any) {
    console.error('Error handling AI chat:', error);
    return res.status(500).json({
      error: 'Terjadi kendala saat memproses jawaban AI.',
      details: error?.message || 'Unknown error',
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
