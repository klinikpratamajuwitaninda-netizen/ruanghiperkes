export interface SlideItem {
  slideNumber: number;
  category: string;
  title: string;
  subtitle?: string;
  bullets: string[];
  callout?: string;
  clinicalRelevance: string;
}

export interface HandbookChapter {
  id: string;
  number: string;
  title: string;
  sections: {
    title: string;
    content: string;
    highlights?: string[];
  }[];
}

export const SLIDES_DATA: SlideItem[] = [
  {
    slideNumber: 1,
    category: 'COVER',
    title: 'HIPERKES untuk Meningkatkan Keselamatan Pasien',
    subtitle: 'Higiene Perusahaan • Kesehatan Kerja • Keselamatan Kerja • Ergonomi',
    bullets: [
      'Penyusun: dr. Juwita Ninda Suherman, M.Kes',
      'Institusi: Institut Kesehatan Rajawali - Program Studi Keperawatan',
      'Prinsip Utama: SAFE CARE STARTS WITH SAFE WORK (Pelayanan aman berawal dari perawat yang terlindungi)',
    ],
    callout: 'K3 bukan beban tambahan, melainkan pondasi mutu pelayanan keperawatan.',
    clinicalRelevance: 'Menghubungkan perlindungan nakes langsung dengan sasaran keselamatan pasien di rumah sakit.',
  },
  {
    slideNumber: 2,
    category: 'ORIENTASI PEMBELAJARAN',
    title: 'Apa yang Akan Dipelajari?',
    bullets: [
      '01 • Memahami: Sejarah, konsep, ruang lingkup, dan tujuan HIPERKES.',
      '02 • Mengenali: Mengidentifikasi bahaya biologis, kimia, fisik, ergonomi, dan psikososial di RS.',
      '03 • Mengendalikan: Memilih pengendalian risiko sesuai hierarki dan praktik aman.',
      '04 • Menerapkan: Menganalisis 30 kasus klinis serta dampaknya pada keselamatan pasien.',
    ],
    callout: 'Fokus Utama: PERAWAT • PASIEN • LINGKUNGAN PELAYANAN',
    clinicalRelevance: 'Membentuk pola pikir preventif sebelum memulai dinas di bangsal rumah sakit.',
  },
  {
    slideNumber: 3,
    category: 'SEJARAH & PERKEMBANGAN',
    title: 'Dari Respons Kecelakaan Menuju Pencegahan',
    bullets: [
      '1911 - Awal Konsep K3: Mulai diperkenalkan di Amerika Serikat.',
      'Fase Awal (Kuratif): Kecelakaan ditangani setelah terjadi, tanggung jawab kerap dibebankan ke pekerja.',
      'Perkembangan (Preventif): Fokus bergeser pada identifikasi bahaya, pencegahan dini, dan kontrol sistemik.',
      'Saat Ini (Sistemik): K3 menjadi tanggung jawab terpadu organisasi, manajemen, dan seluruh civitas rumah sakit.',
    ],
    callout: 'Relevansi RS: Bukan menunggu perawat tertusuk jarum atau pasien cedera—bahaya harus dikendalikan sebelum insiden.',
    clinicalRelevance: 'Mengubah paradigma dari penanganan reaktif menjadi manajemen risiko proaktif.',
  },
  {
    slideNumber: 4,
    category: 'SEJARAH & PERKEMBANGAN',
    title: 'Mengapa HIPERKES Relevan di Rumah Sakit?',
    bullets: [
      'Tempat Kerja Berisiko Tinggi: Perawat berhadapan dengan cairan tubuh, patogen infeksius, obat sitotoksik, kabel listrik, dan beban angkat.',
      'Kontak Intensif 24 Jam: Durasi interaksi perawat dengan pasien paling panjang dibandingkan profesi kesehatan lain.',
      'Risiko Saling Terkait: Bahaya yang mencederai perawat langsung mendisrupsi mutu asuhan dan membahayakan keselamatan pasien.',
    ],
    callout: 'Perubahan Paradigma: Dari REAKTIF (mengobati setelah infeksi) ke PROAKTIF (menilai dan memitigasi bahaya).',
    clinicalRelevance: 'Perlindungan nakes adalah prasyarat mutlak akreditasi keselamatan rumah sakit.',
  },
  {
    slideNumber: 5,
    category: 'KONSEP DASAR HIPERKES',
    title: 'Apa itu HIPERKES?',
    bullets: [
      'Higiene Perusahaan: Mengenali, menilai, dan mengendalikan faktor lingkungan kerja yang dapat menimbulkan gangguan kesehatan.',
      'Kesehatan Kerja: Memelihara derajat kesehatan fisik, mental, dan sosial pekerja melalui promosi, pencegahan, pengobatan, dan pemulihan.',
      'Keselamatan Kerja: Mencegah cedera dan kecelakaan terkait alat, bahan, proses, lingkungan, serta cara kerja.',
    ],
    callout: 'HIPERKES bukan sekadar memakai APD. HIPERKES adalah SISTEM untuk membuat pekerjaan dan lingkungan pelayanan lebih aman.',
    clinicalRelevance: 'Menghilangkan miskonsepsi bahwa K3 hanya urusan sarung tangan dan masker.',
  },
  {
    slideNumber: 6,
    category: 'KONSEP DASAR HIPERKES',
    title: 'Empat Bidang yang Saling Terhubung',
    bullets: [
      '1. Higiene Lingkungan (HIG): Kualitas udara, air, ventilasi, pencahayaan, dan kebersihan mikrobiologis bangsal.',
      '2. Kesehatan Kerja (KES): Kebugaran jasmani, skrining hepatitis/TB, gizi kerja, dan imunitas perawat.',
      '3. Keselamatan Kerja (KES): Alat medis terkalibrasi, instalasi listrik aman, spill kit, dan jalur evakuasi bebas rintangan.',
      '4. Ergonomi (ERG): Penyesuaian tugas pemindahan pasien dengan kapabilitas anatomis dan biomekanika perawat.',
    ],
    callout: 'Contoh Integrasi: Pemindahan pasien aman butuh alat bantu (ergonomi), bebas lantai licin (higiene), kabel rapi (keselamatan), dan perawat bugar (kesehatan).',
    clinicalRelevance: 'Setiap tindakan keperawatan melibatkan sinergi keempat pilar HIPERKES.',
  },
  {
    slideNumber: 7,
    category: 'KONSEP DASAR HIPERKES',
    title: 'Tujuan HIPERKES di Fasilitas Kesehatan',
    bullets: [
      'Lindungi Tenaga Kesehatan: Mencegah cedera tertusuk jarum, penularan kuman, low back pain, dan sindrom kelelahan kerja.',
      'Ciptakan Lingkungan Aman: Mengendalikan bahaya pada ruang rawat inap, IGD, ICU, laboratorium, farmasi, dan bedah sentral.',
      'Jaga Kesinambungan Layanan: Mengurangi absensi sakit dan pergantian staf mendadak agar rasio perawat-pasien tetap ideal.',
      'Lindungi Pasien & Pengunjung: Mencegah kontaminasi silang, kesalahan obat, dan insiden pasien jatuh di bangsal.',
    ],
    callout: 'Pelayanan prima hanya dapat terwujud jika penyedia layanan berada dalam kondisi prima.',
    clinicalRelevance: 'Menghubungkan indikator keselamatan kerja dengan kepuasan dan keselamatan pasien.',
  },
  {
    slideNumber: 8,
    category: 'HIPERKES & KESELAMATAN PASIEN',
    title: 'Dua Keselamatan, Satu Sistem',
    bullets: [
      'Rumus Inti: KESELAMATAN NAKES + LINGKUNGAN KERJA AMAN = PELAYANAN LEBIH AMAN.',
      'Perawat yang terlindungi dari kelelahan bekerja dengan konsentrasi tinggi dan presisi.',
      'Pengendalian infeksi (PPI) melindungi perawat sekaligus memutus transmisi kuman ke luka operasi pasien.',
      'Lingkungan tertata rapi mengurangi risiko jatuh, tertukar identitas obat, dan hambatan darurat.',
    ],
    callout: 'Perawat dan Pasien berada dalam satu ekosistem keselamatan yang tidak terpisahkan.',
    clinicalRelevance: 'Memahami bahwa insiden keselamatan pasien kerap berakar dari kondisi kerja nakes yang tidak aman.',
  },
  {
    slideNumber: 9,
    category: 'HIPERKES & KESELAMATAN PASIEN',
    title: 'Rantai Dampak: Dari Bahaya ke Keselamatan Pasien',
    bullets: [
      'Tahap 1 - Bahaya: Jarum bekas dibiarkan di baki tindakan karena safety box tidak dibawa.',
      'Tahap 2 - Pajanan: Perawat kedua tertusuk jarum saat membereskan baki (needle stick injury).',
      'Tahap 3 - Dampak Nakes: Perawat cedera, syok psikologis, harus meninggalkan dinas untuk tes darah & PEP.',
      'Tahap 4 - Gangguan Layanan: Bangsal kekurangan perawat, beban perawat lain melonjak drastis.',
      'Tahap 5 - Risiko Pasien: Keterlambatan obat, pasien tidak terpantau, risiko salah dosis dan insiden jatuh meningkat.',
    ],
    callout: 'Titik Intervensi: Rekayasa alat keselamatan (safety syringe), safety box di titik tindakan, dan budaya lapor no-blame.',
    clinicalRelevance: 'Melihat efek domino dari satu kelalaian K3 terhadap nasib puluhan pasien lain di bangsal.',
  },
  {
    slideNumber: 10,
    category: 'IDENTIFIKASI BAHAYA',
    title: 'Peta 5 Bahaya di Rumah Sakit',
    bullets: [
      'B • Biologis: Darah, cairan tubuh, sputum TB, virus HIV/HBV, aerosol droplet, linen infeksius.',
      'K • Kimia: Disinfektan klorin, gas anestesi, obat sitotoksik kemoterapi, formalin, reagen lab.',
      'F • Fisik: Lantai basah licin, sengatan listrik kabel terkelupas, radiasi sinar-X, kebisingan alat, suhu dingin.',
      'E • Ergonomi: Mengangkat pasien obesitas, postur membungkuk, memutar pinggang, dorong bed berat.',
      'P • Psikososial: Kerja shift malam rotasi cepat, beban kerja berlebih, stres emosional, kekerasan verbal.',
    ],
    callout: 'Ingat: Satu aktivitas klinis (misal debridement luka di IGD) dapat memuat kelima bahaya sekaligus!',
    clinicalRelevance: 'Pedoman inspeksi risiko komprehensif saat perawat masuk ke ruang perawatan.',
  },
  {
    slideNumber: 11,
    category: 'BAHAYA BIOLOGIS',
    title: 'Bahaya Biologis: Pajanan yang Tidak Selalu Terlihat',
    bullets: [
      'Sumber Pajanan: Darah, pus, urin, cairan pleura, bioaerosol batuk, instrumen bedah kotor.',
      'Dampak Potensial: Hepatitis B (risiko transmisi 30%), Hepatitis C (3%), HIV (0.3%), tuberkulosis aktif.',
      'Situasi Berisiko: Kanulasi infus darurat, penjahitan luka robek, suction dahak, perawatan luka decubitus.',
      'Prinsip Utama: Terapkan KEWASPADAAN STANDAR (Universal Precaution) pada setiap pasien tanpa memandang status diagnosis.',
    ],
    callout: 'Anggap semua darah dan cairan tubuh pasien berpotensi infeksius!',
    clinicalRelevance: 'Dasar pemutusan rantai infeksi nosokomial (Healthcare-Associated Infections / HAIs).',
  },
  {
    slideNumber: 12,
    category: 'BAHAYA BIOLOGIS',
    title: 'Benda Tajam: Cegah Sebelum Terjadi Pajanan',
    bullets: [
      'No Two-Handed Recapping: Dilarang keras menutup kembali jarum suntik bekas pakai dengan dua tangan!',
      'Point of Use Sharps Box: Bawa safety box tepat di sebelah pasien saat tindakan injeksi.',
      'Batas Kapasitas 3/4: Segera tutup dan segel wadah benda tajam jika sudah terisi 75%, dilarang menekan isi wadah.',
      'Tatalaksana Tertusuk: Cuci segera air mengalir + sabun, laporkan ke K3RS dalam kurun waktu < 2 jam untuk inisiasi PEP.',
    ],
    callout: 'Pencegahan tertusuk jarum adalah indikator utama keselamatan kerja perawat di seluruh dunia.',
    clinicalRelevance: 'Melindungi nakes dari infeksi darah mematikan seumur hidup.',
  },
  {
    slideNumber: 13,
    category: 'BAHAYA KIMIA',
    title: 'Bahaya Kimia: Aman dalam Penggunaan & Penyimpanan',
    bullets: [
      '3 Jalur Masuk Tubuh: Inhalasi (uap/aerosol), Kontak Kulit/Mata (percikan cairan), Tertelan (tangan tidak dicuci).',
      'Aturan Wadah & Pelabelan: DILARANG menyimpan bahan kimia dalam botol air mineral atau wadah makanan tanpa label!',
      'Kelengkapan Safety Data Sheet (SDS/LDK): Setiap zat kimia B3 wajib memiliki lembar data keselamatan yang mudah diakses.',
      'Ventilasi & Dekontaminasi: Mengencerkan disinfektan harus di area terbuka atau ruang bersegel blower exhaust.',
    ],
    callout: 'Label kimia harus memuat: Nama zat, Konsentrasi, Piktogram Bahaya GHS, dan Tanggal Kadaluarsa/Buka.',
    clinicalRelevance: 'Mencegah keracunan staf, iritasi saluran napas, dan kesalahan injeksi obat berbahaya.',
  },
  {
    slideNumber: 14,
    category: 'BAHAYA FISIK',
    title: 'Bahaya Fisik di Area Pelayanan',
    bullets: [
      'Lantai Basah & Licin: Penyebab nomor satu pasien dan perawat cedera patah tulang; pasang cone warning seketika.',
      'Kelistrikan & Alat Medis: Periksa steker kabel secara berkala, laporkan kabel serabut terkelupas, cegah korsleting di dekat tabung O2.',
      'Radiasi Sinar-X: Terapkan prinsip ALARA (Waktu minimal, Jarak > 2 meter, Perisai apron timbal Pb).',
      'Pencahayaan & Kebisingan: Lampu remang memicu salah baca etiket obat; alarm monitor bising memicu sensory fatigue.',
    ],
    callout: 'Hubungan Patient Safety: Area Aman • Alat Laik • Komunikasi Jelas.',
    clinicalRelevance: 'Menjamin ruang rawat inap bebas dari bahaya mekanikal dan elektrikal.',
  },
  {
    slideNumber: 15,
    category: 'BAHAYA ERGONOMI',
    title: 'Ergonomi: Lindungi Punggung, Lindungi Pasien',
    bullets: [
      'Risiko Utama: Mengangkat pasien obesitas tanpa bantuan, membungkuk saat mengganti balutan, memuntir tulang belakang.',
      'Dampak Nakes: Low Back Pain (LBP), Hernia Nukleus Pulposus (HNP), dan cedera bahu kronis.',
      'Prinsip Kerja Aman: Nilai kekuatan mandiri pasien lebih dulu; gunakan slide sheet transfer board; atur bed setinggi pinggul.',
      'Team Lifting: Jika pasien tidak kooperatif atau berat > 35 kg, wajib dilakukan minimal oleh 2 perawat terkoordinasi.',
    ],
    callout: 'Kaki selebar bahu, tekuk lutut, dekatkan beban ke dada, dan gunakan kekuatan paha bukan pinggang!',
    clinicalRelevance: 'Mencegah perawat pensiun dini akibat kelumpuhan saraf lumbal serta menjaga pasien tidak jatuh saat transfer.',
  },
  {
    slideNumber: 16,
    category: 'BAHAYA PSIKOSOSIAL',
    title: 'Kelelahan & Stres Juga Merupakan Bahaya Kerja',
    bullets: [
      'Faktor Pemicu: Shift malam beruntun tanpa jeda tidur pemulihan, beban rasio 1 perawat : 12 pasien akut, stres emosional keluarga.',
      'Mekanisme Bahaya: Beban berlebih → Kelelahan fisik/otak → Konsentrasi anjlok → Risiko Medication Error & KNC.',
      'Pencegahan Organisasi: Jadwal dinas ergonomis, rotasi yang adil, batasan lembur maksimal, dan lingkungan kerja suportif.',
      'Just Culture: Laporkan kelelahan ekstrem kepada Kepala Ruangan sebelum terjadi kesalahan fatal pada pasien.',
    ],
    callout: 'Perawat yang kelelahan berat memiliki penurunan fungsi kognitif setara dengan orang di bawah pengaruh alkohol.',
    clinicalRelevance: 'Menjaga kewaspadaan klinis perawat saat mempersiapkan obat high alert dan perhitungan tetesan infus.',
  },
  {
    slideNumber: 17,
    category: 'KESEHATAN KERJA',
    title: 'Penyakit Akibat Kerja (PAK) pada Perawat',
    bullets: [
      'Definisi: Penyakit yang terbukti disebabkan oleh pajanan faktor bahaya spesifik di lingkungan atau proses kerja.',
      'Contoh PAK Keperawatan: Hepatitis B/C & TB Paru (biologis), Dermatitis kontak iritan (kimia handrub), HNP/Carpal tunnel (ergonomi).',
      'Penetapan Diagnosis: Memerlukan 7 langkah diagnosis klinis okupasi; keluhan pegal saja belum tentu PAK formal.',
      'Kunci Perlindungan: Catat tanggal mulai gejala, riwayat pajanan zat di RS, dan lakukan pemeriksaan kesehatan berkala.',
    ],
    callout: 'Semua perawat berhak mendapatkan fasilitas Medical Check-Up (MCU) rutin dari rumah sakit.',
    clinicalRelevance: 'Mendorong kesadaran legal dan hak kesehatan kerja bagi tenaga keperawatan.',
  },
  {
    slideNumber: 18,
    category: 'KESEHATAN KERJA',
    title: 'Empat Bentuk Pelayanan Kesehatan Kerja',
    bullets: [
      '1. PROMOTIF: Edukasi gaya hidup sehat, senam peregangan ergonomis di sela dinas, gizi seimbang, dan manajemen stres.',
      '2. PREVENTIF: Vaksinasi Hepatitis B & Influenza gratis, pemeriksaan kesehatan awal/berkala, skrining tuberkulosis tahunan.',
      '3. KURATIF: Pengobatan tuntas bila tertusuk jarum, penanganan luka bakar uap autoklaf, pemberian profilaksis PEP.',
      '4. REHABILITATIF: Fisioterapi pasca cedera tulang belakang, penyesuaian penempatan unit kerja ringan saat masa pemulihan.',
    ],
    callout: 'Pelayanan terpadu mengawal perawat dari mulai sehat hingga bugar kembali.',
    clinicalRelevance: 'Memahami hak-hak proteksi kesehatan yang harus difasilitasi oleh Komite K3RS.',
  },
  {
    slideNumber: 19,
    category: 'HIGIENE PERUSAHAAN',
    title: 'Siklus Higiene: Kenali – Nilai – Kendalikan – Pantau',
    bullets: [
      '01 • Identifikasi (Kenali): Walk-through survey, checklist bahaya harian bangsal, deteksi jarum tercecer atau kabel mengelupas.',
      '02 • Evaluasi (Nilai): Mengukur intensitas pajanan, frekuensi tindakan per hari, jumlah staf terpapar, dan tingkat keparahan risiko.',
      '03 • Pengendalian: Memilih intervensi paling efektif pada sumber bahaya, jalur transmisi, atau pada tubuh pekerja.',
      '04 • Pemantauan: Inspeksi kepatuhan berkala, kalibrasi alat medis, dan audit berkala angka insiden.',
    ],
    callout: 'Hasil evaluasi menjadi dasar tindakan korektif nyata, bukan sekadar arsip dokumen di lemari.',
    clinicalRelevance: 'Menjadikan perawat sebagai agen inspeksi aktif (risk assessor) di setiap pergantian shift jaga.',
  },
  {
    slideNumber: 20,
    category: 'MANAJEMEN RISIKO',
    title: 'Menilai Risiko Sebelum Menentukan Prioritas',
    bullets: [
      'Matriks Risiko 4x4: Mengalikan KEMUNGKINAN (Likelihood 1-4) x KEPARAHAN (Consequence 1-4).',
      'Skor 1-4 (Rendah - Hijau): Kendalikan dengan prosedur rutin.',
      'Skor 6-8 (Sedang - Kuning): Perlu tindakan perbaikan terjadwal.',
      'Skor 9-16 (Tinggi/Ekstrem - Merah): Tindakan intervensi segera saat itu juga!',
      'Contoh: Lantai licin di koridor ramai lansia = Kemungkinan 4 x Dampak Fraktur 3 = Skor 12 (Prioritas Tinggi).',
    ],
    callout: 'Jangan menunda tindakan pada risiko dengan skor merah; bahaya harus diamankan sebelum bergeser ke pasien berikutnya.',
    clinicalRelevance: 'Membantu perawat memprioritaskan masalah keselamatan paling mendesak di ruangan.',
  },
  {
    slideNumber: 21,
    category: 'PENGENDALIAN RISIKO',
    title: 'Hierarki Pengendalian: Jangan Mulai dari APD!',
    bullets: [
      'Tingkat 1 - ELIMINASI: Menghilangkan total sumber bahaya (misal: larang penutupan jarum kembali, buang alat rusak).',
      'Tingkat 2 - SUBSTITUSI: Mengganti bahan beracun dengan yang aman (misal: ganti glutaraldehid dengan sterilisasi H2O2).',
      'Tingkat 3 - REKAYASA TEKNIK: Isolasi bahaya (ruang isolasi tekanan negatif, safety syringe needleless system, exhaust).',
      'Tingkat 4 - ADMINISTRATIF: SOP, pelatihan berkala, rotasi shift, rambu peringatan, briefing tim, checklist sebelum tindakan.',
      'Tingkat 5 - APD: Pelindung personal (sarung tangan, masker N95, gaun, goggle) sebagai lapis pertahanan TERAKHIR.',
    ],
    callout: 'APD adalah pertahanan terakhir yang bergantung pada kepatuhan individu. Prioritaskan pengendalian pada sumbernya!',
    clinicalRelevance: 'Membimbing mahasiswa memilih solusi K3 yang paling tuntas dan sistemik.',
  },
  {
    slideNumber: 22,
    category: 'PENERAPAN KLINIS',
    title: 'Kewaspadaan Standar: Praktik Inti di Setiap Pelayanan',
    bullets: [
      '1. Kebersihan Tangan: 5 Momen Cuci Tangan WHO (sebelum kontak, sebelum aseptik, setelah cairan, setelah kontak, setelah lingkungan).',
      '2. APD Sesuai Indikasi Risiko: Sarung tangan saat kontak darah, apron saat tindakan basah, pelindung mata saat risiko cipratan.',
      '3. Keamanan Injeksi: Single-use disposable syringe, no multi-dose vial sharing, wadah safety box point of care.',
      '4. Dekontaminasi Alat & Linen: Pemisahan linen infeksius berkantung kuning dan linen biasa berkantung hitam.',
    ],
    callout: 'Kepatuhan cuci tangan perawat menurunkan angka infeksi aliran darah (phlebitis) hingga 60%.',
    clinicalRelevance: 'Standar minimum yang wajib dipatuhi oleh seluruh mahasiswa keperawatan di lahan praktik.',
  },
  {
    slideNumber: 23,
    category: 'PENERAPAN KLINIS',
    title: 'Pengelolaan Bahan B3 & Limbah Medis',
    bullets: [
      'Alur Pengelolaan 5 Tahap: KENALI (Label & SDS) → PISAHKAN (Kategori Limbah) → SIMPAN (Wadah Khusus) → ANGKUT → BUANG.',
      'Kode Warna Limbah RS: Kuning (Limbah Medis Infeksius), Cokelat (Limbah Farmasi/Kimia), Ungu (Sitotoksik/Kanker), Hitam (Domestik).',
      'JANGAN LAKUKAN: Mencampur limbah medis ke tempat sampah hitam, membuang jarum ke kresek, atau memindahkan cairan tanpa label.',
      'LAKUKAN: Tutup wadah rapat, ikat simpul leher angsa kantong kuning saat 3/4 penuh, gunakan troli pengangkut limbah tertutup.',
    ],
    callout: 'Pengelolaan limbah medis yang benar melindungi petugas sanitasi dan mencegah pencemaran lingkungan masyarakat.',
    clinicalRelevance: 'Memastikan integritas pembuangan limbah medis dan keselamatan rantai kerja rumah sakit.',
  },
  {
    slideNumber: 24,
    category: 'PENERAPAN KLINIS',
    title: 'Pemindahan Pasien: Aman, Terencana, Kolaboratif',
    bullets: [
      '01 • NILAI: Cek kesadaran pasien, kekuatan otot ekstremitas, nyeri, infus terpasang, dan daya kooperatif.',
      '02 • SIAPKAN: Kunci rem tempat tidur & kursi roda, sesuaikan tinggi bed setinggi panggul, pasang slide sheet.',
      '03 • KOMUNIKASI: Jelaskan rencana tindakan ke pasien, hitung aba-aba bersama tim ("Satu, dua, angkat"), bagi peran penolong.',
      '04 • PINDAHKAN: Pertahankan punggung lurus, tumpukan dorongan pada otot tungkai kaki, hindari gerakan memuntir mendadak.',
    ],
    callout: 'Bila beban atau kondisi fisik pasien melampaui kemampuan satu orang, JANGAN memaksakan diri sendiri!',
    clinicalRelevance: 'Mencegah insiden pasien terjatuh saat proses transfer dan melindungi kebugaran perawat.',
  },
  {
    slideNumber: 25,
    category: 'PELAPORAN & PEMBELAJARAN',
    title: 'Insiden, Kecelakaan, dan Near Miss Harus Dipelajari',
    bullets: [
      'NEAR MISS (KNC): Kejadian nyaris celaka; roda bed tidak terkunci tapi pasien sempat ditahan sehingga tidak cedera.',
      'INSIDEN TANPA CEDERA (KTC): Obat tertukar diminum pasien namun tidak menimbulkan reaksi racun.',
      'KECELAKAAN / SENTINEL: Perawat tertusuk jarum berdarah atau pasien terjatuh hingga fraktur femur.',
      'Langkah Penanganan: Amankan kondisi pasien dan nakes terlebih dahulu → Laporkan ke K3RS/Komite Mutu dalam 2x24 jam → Root Cause Analysis (RCA).',
    ],
    callout: 'Prinsip Emas: Hindari budaya saling menyalahkan (No-Blame Culture). Fokus pada perbaikan celah sistem!',
    clinicalRelevance: 'Pelaporan insiden adalah bahan ajar berharga untuk mencegah insiden berulang di kemudian hari.',
  },
  {
    slideNumber: 26,
    category: 'PERAN PERAWAT',
    title: 'Peran Multi-Fungsi Perawat dalam HIPERKES',
    bullets: [
      'Pengkaji Risiko: Selalu mengamati potensi bahaya di sekeliling bed sebelum memulai asuhan keperawatan.',
      'Pelaksana Praktik Aman: Disiplin memakai APD, 5 momen cuci tangan, dan mematuhi SOP keselamatan jarum.',
      'Edukator: Mengingatkan pasien, keluarga penunggu, serta rekan sejawat perawat tentang bahaya lantai basah dan obat.',
      'Pelapor & Kolaborator: Aktif melaporkan near miss dan bersinergi dengan Komite PPI, K3RS, dokter, dan teknisi IPSRS.',
    ],
    callout: 'Perawat adalah garda terdepan sekaligus benteng pertahanan utama keselamatan di rumah sakit.',
    clinicalRelevance: 'Membangun identitas profesional dan tanggung jawab etis mahasiswa keperawatan.',
  },
  {
    slideNumber: 27,
    category: 'SISTEM MANAJEMEN K3',
    title: 'HIPERKES Perlu Dukungan Sistem, Bukan Usaha Individu',
    bullets: [
      'Manajemen RS: Menjamin anggaran sarana keselamatan, penyediaan APD bermutu, dan kebijakan keselamatan tanpa kompromi.',
      'Unit K3RS & PPI: Menyusun SOP berbasis bukti, pelatihan sertifikasi K3, pemantauan berkala, dan penanganan pascapajanan.',
      'Kepala Ruangan: Supervisi harian, inspeksi checklist sebelum operan, pengawasan jam kerja, dan briefing tim jaga.',
      'Perawat Pelaksana: Kepatuhan pada prosedur standar, saling peduli keselamatan rekan kerja, dan partisipasi audit.',
    ],
    callout: 'Siklus Perbaikan Berkelanjutan (PDCA): Rencanakan (Plan) → Laksanakan (Do) → Periksa (Check) → Tindak Lanjuti (Action).',
    clinicalRelevance: 'Memahami bahwa kegagalan keselamatan seringkali bukan kelalaian individu melainkan kelemahan sistem pendukung.',
  },
  {
    slideNumber: 28,
    category: 'STUDI KASUS',
    title: 'Studi Kasus: Perawat Tertusuk Jarum Setelah Injeksi',
    bullets: [
      'Situasi: Jam sibuk pergantian shift, perawat terburu-buru meletakkan jarum suntik bekas di baki karena safety box jauh. Perawat lain tertusuk.',
      'Pertanyaan Analisis: Apa bahaya utamanya? Faktor sistem apa yang gagal? Pengendalian apa yang paling efektif?',
      'Arah Jawaban: Bahaya biologis patogen darah. Kegagalan ketiadaan safety box di troli bedside dan budaya terburu-buru.',
      'Solusi Tuntas: Sediakan safety box di setiap titik tindakan (rekayasa), larang penundaan pembuangan (SOP), dan lakukan tatalaksana PEP segera.',
    ],
    callout: 'Diskusikan bersama: Mengapa menyediakan wadah sharps di dekat tindakan merupakan pengendalian yang sangat penting?',
    clinicalRelevance: 'Simulasi pemecahan masalah nyata yang sering terjadi di bangsal bedah dan penyakit dalam.',
  },
  {
    slideNumber: 29,
    category: 'PENUTUP & PESAN KLINIS',
    title: 'Lima Pesan Emas yang Wajib Dibawa ke Praktik Klinik',
    bullets: [
      '1. Kenali bahaya sebelum memulai tindakan: Periksa lingkungan, pasien, dan alat.',
      '2. Kendalikan risiko dari sumbernya: APD adalah lapis pelindung terakhir, bukan satu-satunya solusi.',
      '3. Keselamatan pekerja dan keselamatan pasien saling terhubung erat (Dua Keselamatan, Satu Sistem).',
      '4. Laporkan setiap pajanan, insiden, dan kejadian nyaris celaka (near miss) tanpa ragu.',
      '5. Bangun budaya keselamatan (safety culture) melalui kerja tim yang solid dan perbaikan sistem.',
    ],
    callout: 'SAFE WORKPLACE → SAFE CARE → SAFE PATIENT (Tempat Kerja Selamat → Pelayanan Selamat → Pasien Selamat)',
    clinicalRelevance: 'Rangkuman filosofi yang menjiwai seluruh kompetensi praktik keperawatan.',
  },
  {
    slideNumber: 30,
    category: 'REFERENSI & SUMBER',
    title: 'Daftar Pustaka & Landasan Akademik',
    bullets: [
      'dr. Juwita Ninda Suherman, M.Kes - Modul HIPERKES untuk Meningkatkan Keselamatan Pasien, Institut Kesehatan Rajawali.',
      'Aprilliani, C., dkk. (2022). Keselamatan dan Kesehatan Kerja (K3). PT Global Eksekutif Teknologi.',
      'Sujoso, A. D. P. (2012). Dasar-Dasar Keselamatan dan Kesehatan Kerja. Jember University Press.',
      'Hendrik, Anshar, & Arpandjam’an. (2020). Modul K3. Poltekkes Kemenkes Makassar.',
      'Poltekkes Kemenkes Denpasar (2025). Pedoman Keselamatan dan Kesehatan Kerja (K3) Rumah Sakit.',
    ],
    callout: 'Selamat belajar dan jadilah pelopor perawat berbudaya keselamatan!',
    clinicalRelevance: 'Rujukan resmi untuk penulisan tugas ilmiah dan telaah jurnal mahasiswa keperawatan.',
  },
];

export const HANDBOOK_CHAPTERS: HandbookChapter[] = [
  {
    id: 'bab-1',
    number: 'BAB I',
    title: 'Sejarah dan Konsep Dasar HIPERKES',
    sections: [
      {
        title: '1.1 Perkembangan Pemikiran Keselamatan & Kesehatan Kerja',
        content: 'Keselamatan dan kesehatan kerja berkembang dari pendekatan reaktif menuju pendekatan preventif. Di masa lampau (sejak 1911), kecelakaan kerja dianggap sebagai takdir atau kesalahan pekerja semata. Kini di fasilitas kesehatan, keselamatan tidak cukup ditangani setelah perawat tertusuk jarum atau pasien jatuh; bahaya harus dikenali dan dicegah secara sistematis.',
        highlights: [
          'Pendekatan Reaktif: Berfokus pada penanganan setelah insiden terjadi.',
          'Pendekatan Preventif: Mengidentifikasi bahaya dan mengendalikan risiko sebelum insiden terulang.',
        ],
      },
      {
        title: '1.2 Pengertian & Tujuan HIPERKES',
        content: 'HIPERKES mengintegrasikan higiene perusahaan, kesehatan kerja, keselamatan kerja, dan ergonomi. Tujuannya adalah memelihara derajat kesehatan fisik, mental, dan sosial pekerja, mencegah kecelakaan kerja dan penyakit akibat kerja (PAK), serta menciptakan lingkungan pelayanan yang aman dan nyaman.',
      },
      {
        title: '1.3 Pentingnya bagi Mahasiswa Keperawatan',
        content: 'Mahasiswa keperawatan setiap hari terpapar darah, cairan tubuh, benda tajam, obat kimia keras, alat elektrik, dan tugas mengangkat pasien. Mahasiswa wajib mengenali batas kewenangan klinis, mematuhi instruksi pembimbing, dan menolak tindakan berisiko yang belum dikuasai.',
      },
    ],
  },
  {
    id: 'bab-2',
    number: 'BAB II',
    title: 'Ruang Lingkup HIPERKES & Tiga Komponen Kesehatan Kerja',
    sections: [
      {
        title: '2.1 Empat Pilar HIPERKES',
        content: '1. Higiene Perusahaan: Berfokus pada pengendalian faktor bahaya lingkungan (ventilasi, pencahayaan, kebisingan, kebersihan). 2. Kesehatan Kerja: Berfokus pada kondisi fisik, imunitas, dan pencegahan penyakit pekerja. 3. Keselamatan Kerja: Berfokus pada kelaikan alat medis, instalasi listrik, dan penanganan benda tajam. 4. Ergonomi: Menyesuaikan beban kerja dan postur tubuh dengan keterbatasan fisik manusia.',
      },
      {
        title: '2.2 Tiga Komponen Kesehatan Kerja & Prinsip Keserasian',
        content: 'Kesehatan kerja dipengaruhi oleh interaksi tiga komponen: Kapasitas Kerja (status gizi, kebugaran, kompetensi), Beban Kerja (jumlah pasien, shift malam, kompleksitas), dan Lingkungan Kerja (suhu, agen biologis, tata ruang). Ketiganya harus serasi agar tidak timbul kelelahan kronis atau kecelakaan.',
      },
    ],
  },
  {
    id: 'bab-3',
    number: 'BAB III',
    title: 'Bahaya di Rumah Sakit & Penyakit Akibat Kerja (PAK)',
    sections: [
      {
        title: '3.1 Klasifikasi 5 Bahaya di Fasilitas Kesehatan',
        content: 'Biologis (darah, cairan tubuh, virus HBV/HIV, kuman TB airborne), Kimia (disinfektan klorin, sitotoksik kemo, gas medis), Fisik (lantai basah licin, radiasi X-ray, kabel listrik terkelupas, bising), Ergonomi (mengangkat pasien berat, membungkuk, memutar pinggang), Psikososial (shift malam, beban tinggi, stres emosional).',
      },
      {
        title: '3.2 Perbedaan Insiden, Near Miss, dan Kecelakaan',
        content: 'Near Miss (Kejadian Nyaris Celaka): Peristiwa yang hampir mencelakai namun belum menimbulkan cedera (contoh: pasien hampir jatuh karena roda bed tidak terkunci). Insiden: Peristiwa keselamatan yang perlu dievaluasi (alat infus mati mendadak). Kecelakaan Kerja: Peristiwa yang mengakibatkan cedera fisik nyata (perawat tertusuk jarum bekas).',
      },
    ],
  },
  {
    id: 'bab-4',
    number: 'BAB IV',
    title: 'Higiene Perusahaan & Manajemen Risiko',
    sections: [
      {
        title: '4.1 Siklus Higiene Perusahaan (Kenali - Nilai - Kendalikan - Pantau)',
        content: 'Identifikasi melalui walk-through survey harian dan checklist keselamatan. Evaluasi pajanan dengan menilai frekuensi tindakan dan keparahan bahaya. Pengendalian dengan memutus sumber bahaya. Pemantauan melalui inspeksi berkala dan audit kepatuhan.',
      },
      {
        title: '4.2 Matriks Penilaian Risiko Klinis',
        content: 'Risiko diukur dari perkalian Kemungkinan Terjadi (Likelihood) dengan Tingkat Keparahan (Severity). Matriks membantu perawat menetapkan prioritas: bahaya dengan risiko tinggi (seperti kabel terbuka atau tumpahan obat kemo) harus segera ditangani sebelum melanjutkan asuhan keperawatan lain.',
      },
    ],
  },
  {
    id: 'bab-5',
    number: 'BAB V',
    title: 'Hierarki Pengendalian Risiko & Praktik Aman Keperawatan',
    sections: [
      {
        title: '5.1 Urutan Hierarki Pengendalian',
        content: '1. Eliminasi: Menghilangkan langkah berbahaya (larang recapping jarum). 2. Substitusi: Mengganti bahan toksik dengan alternatif lebih aman (ganti glutaraldehid dengan sterilisasi H2O2). 3. Rekayasa Teknik: Isolasi sumber (ruang tekanan negatif, safety needle, penutup mesin). 4. Administratif: SOP, checklist tindakan, pengaturan shift adil, rambu peringatan. 5. APD: Lapis pertahanan terakhir (masker N95, sarung tangan, gaun, goggle).',
      },
      {
        title: '5.2 Kewaspadaan Standar PPI & Penanganan Pajanan',
        content: 'Wajib menerapkan 5 momen kebersihan tangan WHO, penanganan benda tajam pada safety box di titik tindakan, larangan recapping dua tangan, serta bila tertusuk segera cuci air mengalir sabun dan jalani tatalaksana Profilaksis Pascapajanan (PEP) dalam 2 jam.',
      },
    ],
  },
  {
    id: 'bab-6',
    number: 'BAB VI',
    title: 'Hubungan Erat HIPERKES & Sasaran Keselamatan Pasien',
    sections: [
      {
        title: '6.1 Konsep "Dua Keselamatan, Satu Sistem"',
        content: 'Perawat yang terlindungi dari pajanan patogen, kelelahan shift malam, dan cedera fisik memiliki ketelitian tinggi dalam mengecek gelang identitas pasien (SKP 1), double-check obat high alert (SKP 3), serta memastikan rem bed terkunci (SKP 6). Melindungi perawat secara langsung menyelamatkan nyawa pasien.',
      },
      {
        title: '6.2 Budaya Keselamatan (Safety Culture)',
        content: 'Membangun budaya tidak saling menyalahkan (just culture/no blame). Perawat didorong berani melaporkan kondisi tidak aman dan near miss agar kelemahan sistem fasilitas dapat diperbaiki oleh manajemen.',
      },
    ],
  },
  {
    id: 'bab-7',
    number: 'BAB VII',
    title: 'Peran Perawat & Checklist Tindakan Aman di Lahan Praktik',
    sections: [
      {
        title: '7.1 Checklist 7 Langkah Sebelum Melakukan Tindakan Klinis',
        content: '1. Pastikan identitas pasien (minimal 2 identifier: nama & tanggal lahir). 2. Nilai kondisi fisik dan kebutuhan alat bantu transfer. 3. Pastikan alat medis laik pakai dan kabel aman. 4. Cek label bahan kimia / etiket obat dengan prinsip 7 Benar. 5. Siapkan APD dan safety box di dekat tempat tindakan. 6. Pastikan area sekitar bed aman, terang, dan lantai kering. 7. Konfirmasi instruksi pembimbing jika ada keraguan.',
      },
      {
        title: '7.2 Tindakan Saat Menemukan Kondisi Bahaya',
        content: 'Hentikan aktivitas berisiko, lindungi pasien dan orang sekitar, pasang tanda bahaya sementara, dan laporkan seketika kepada penanggung jawab ruangan atau Unit K3RS.',
      },
    ],
  },
];
