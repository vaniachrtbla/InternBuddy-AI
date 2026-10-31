/* ================================================================
   InternBuddy AI — script.js
   Versi 3.3 — Bug Fixing & Finalisasi Integrasi

   Fitur:
   ✅ Autentikasi (Login / Registrasi / Logout) berbasis localStorage
   ✅ Onboarding Profil Pengguna (nama, perusahaan, posisi, avatar)
   ✅ Edit Profil lengkap (modal, avatar preview, validasi)
   ✅ Isolasi data per-pengguna (checklist, refleksi, panduan)
   ✅ Dashboard personal yang dinamis
   ✅ Checklist Onboarding (14 tugas, 5 kategori)
   ✅ Panduan Magang (6 topik, modal detail)
   ✅ Asisten AI context-aware (profil, hari berjalan, riwayat topik)
   ✅ Saran lanjutan dinamis setelah setiap respons bot
   ✅ Refleksi Harian (form + riwayat)
   ✅ Pelacakan Progres (lingkaran radial, grafik mingguan, per kategori)
   ✅ Toast notifikasi

   v3.3 Bug Fixes:
   🔧 tampilkanLayar() — layar-app sekarang benar-benar menggunakan display:flex
   🔧 Login email dinormalisasi trim+toLowerCase sejak awal
   🔧 XSS protection: escapeHtml() pada data profil di inisiasiChat & isiTemplateProfil
   🔧 Chatbot sync: profilSaatIni menyimpan field nama sehingga context selalu terkini
   🔧 renderGrafikMingguan() — label transparansi "simulatif" ditambahkan

   ⚠️ CATATAN PENTING:
   Ini adalah PROTOTYPE frontend. Autentikasi menggunakan localStorage
   dan TIDAK aman untuk produksi. Password di-encode dengan btoa()
   hanya untuk demonstrasi — bukan enkripsi sesungguhnya.
   Implementasi produksi harus menggunakan autentikasi server-side
   dengan hashing password yang aman (bcrypt, argon2, dll.).
   ================================================================ */

'use strict';

/* ================================================================
   KUNCI LOCALSTORAGE
   ================================================================ */

const KUNCI = {
  DAFTAR_AKUN:  'ib_akun_list',     // [{email, pwHash, nama, role}]
  SESI:         'ib_sesi',          // {email, loginAt}
  PROFIL:       (email) => `ib_profil_${email}`,
  CHECKLIST:    (email) => `ib_checklist_${email}`,
  REFLEKSI:     (email) => `ib_refleksi_${email}`,
  PANDUAN:      (email) => `ib_panduan_${email}`,
};

/* ================================================================
   DATA KONSTAN
   ================================================================ */

/** Data awal checklist per pengguna baru */
const DATA_CHECKLIST_AWAL = [
  { id: 1,  teks: "Riset misi, produk, dan budaya perusahaan",                  kategori: "Persiapan",      selesai: false },
  { id: 2,  teks: "Siapkan pakaian yang sesuai untuk hari pertama",              kategori: "Persiapan",      selesai: false },
  { id: 3,  teks: "Buat tanda tangan email yang profesional",                    kategori: "Persiapan",      selesai: false },
  { id: 4,  teks: "Install dan konfigurasi VS Code beserta extension penting",   kategori: "Setup",          selesai: false },
  { id: 5,  teks: "Install Git dan konfigurasikan nama & email secara global",   kategori: "Setup",          selesai: false },
  { id: 6,  teks: "Buat atau perbarui profil GitHub kamu",                       kategori: "Setup",          selesai: false },
  { id: 7,  teks: "Selesaikan administrasi & pengisian dokumen HR",              kategori: "Hari Pertama",   selesai: false },
  { id: 8,  teks: "Dapatkan akses ke channel komunikasi tim (Slack / Teams)",   kategori: "Hari Pertama",   selesai: false },
  { id: 9,  teks: "Perkenalkan diri kepada seluruh anggota tim",                 kategori: "Hari Pertama",   selesai: false },
  { id: 10, teks: "Dapatkan akses ke codebase dan jalankan di lokal",           kategori: "Minggu Pertama", selesai: false },
  { id: 11, teks: "Baca README proyek dan dokumentasi onboarding",               kategori: "Minggu Pertama", selesai: false },
  { id: 12, teks: "Jadwalkan sesi 1:1 dengan supervisor atau mentor",           kategori: "Minggu Pertama", selesai: false },
  { id: 13, teks: "Ikuti stand-up atau sprint meeting pertama bersama tim",     kategori: "Berkelanjutan",  selesai: false },
  { id: 14, teks: "Selesaikan tugas atau tiket pertama yang diberikan",         kategori: "Berkelanjutan",  selesai: false },
];

/** Materi panduan magang */
const DATA_PANDUAN = [
  {
    id: "etika", ikon: "👔", warna: "#EFF6FF", judul: "Etika Kerja Profesional",
    deskripsi: "Pahami norma tempat kerja, ketepatan waktu, cara berpakaian, dan perilaku yang mencerminkan profesionalisme.",
    isi: `<h3 class="text-base font-bold text-slate-900 mb-3">Etika Kerja di Lingkungan Profesional</h3>
      <p class="text-sm text-slate-600 mb-4">Etika kerja membentuk bagaimana rekan dan atasan menilai kamu. Kesan pertama penting — dan bertahan lama.</p>
      <ul class="space-y-2.5">
        <li class="item-panduan-tips"><strong>Tepat waktu.</strong> Datang on time atau lebih awal. Untuk video call, bergabunglah 1–2 menit lebih awal.</li>
        <li class="item-panduan-tips"><strong>Berpakaian sesuai.</strong> Saat ragu, berpakaian sedikit lebih formal sampai kamu memahami budaya perusahaan.</li>
        <li class="item-panduan-tips"><strong>Hargai waktu orang lain.</strong> Sampaikan pesan dan rapat secara singkat dan padat. Siapkan materi sebelumnya.</li>
        <li class="item-panduan-tips"><strong>Hindari gosip.</strong> Jaga percakapan tetap profesional dan fokus pada pekerjaan.</li>
        <li class="item-panduan-tips"><strong>Bertanggung jawab.</strong> Jika membuat kesalahan, akui dengan cepat dan tawarkan solusinya.</li>
        <li class="item-panduan-tips"><strong>Ucapkan terima kasih.</strong> Rasa syukur yang tulus sangat berarti dalam membangun hubungan kerja.</li>
      </ul>`,
  },
  {
    id: "komunikasi", ikon: "💬", warna: "#FFF7ED", judul: "Komunikasi Profesional",
    deskripsi: "Pelajari cara menulis email yang jelas, mengajukan pertanyaan yang baik, dan berkomunikasi efektif.",
    isi: `<h3 class="text-base font-bold text-slate-900 mb-3">Komunikasi Profesional di Tempat Kerja</h3>
      <h4 class="text-sm font-semibold text-slate-800 mb-2">📧 Tips Menulis Email</h4>
      <ul class="space-y-2 mb-4">
        <li class="item-panduan-tips">Gunakan subject line yang jelas: <em>"Pertanyaan tentang Tugas #42 — Integrasi API"</em></li>
        <li class="item-panduan-tips">Buka dengan sapaan: <em>"Halo [Nama],"</em> — jangan langsung ke isi tanpa salam.</li>
        <li class="item-panduan-tips">Sampaikan tujuanmu di kalimat pertama.</li>
        <li class="item-panduan-tips">Tutup secara profesional: <em>"Terima kasih, [Nama Kamu]"</em></li>
      </ul>
      <h4 class="text-sm font-semibold text-slate-800 mb-2">🗣️ Cara Mengajukan Pertanyaan</h4>
      <ul class="space-y-2">
        <li class="item-panduan-tips">Coba selesaikan sendiri dulu (20–30 menit), baru bertanya disertai konteks.</li>
        <li class="item-panduan-tips">Format: <em>"Aku sudah mencoba X, hasilnya Y, tapi harapanku Z — ada saran?"</em></li>
        <li class="item-panduan-tips">Bertanya dengan baik mencerminkan inisiatif, bukan kelemahan.</li>
      </ul>`,
  },
  {
    id: "adaptasi", ikon: "🌱", warna: "#F0FDF4", judul: "Beradaptasi di Tempat Kerja",
    deskripsi: "Tips untuk menyesuaikan diri dengan budaya tim, membangun relasi, dan menavigasi minggu-minggu pertamamu.",
    isi: `<h3 class="text-base font-bold text-slate-900 mb-3">Beradaptasi di Lingkungan Kerja Baru</h3>
      <p class="text-sm text-slate-600 mb-3">Setiap perusahaan punya ritme tersendiri. Mengamati sebelum bertindak adalah kekuatan, bukan kelemahan.</p>
      <ul class="space-y-2.5">
        <li class="item-panduan-tips"><strong>Amati dulu.</strong> Di minggu pertama, dengarkan lebih banyak dari berbicara.</li>
        <li class="item-panduan-tips"><strong>Bangun relasi.</strong> Sempatkan ngobrol singkat dengan rekan kerja — tanyakan peran dan hal yang mereka sukai.</li>
        <li class="item-panduan-tips"><strong>Ikuti alur kerja tim.</strong> Gunakan tools, konvensi, dan proses yang sudah ada.</li>
        <li class="item-panduan-tips"><strong>Minta feedback lebih awal.</strong> "Ada yang bisa aku tingkatkan?" setelah tugas pertama menunjukkan kesadaran diri.</li>
        <li class="item-panduan-tips"><strong>Bersabarlah.</strong> Merasa bingung di 2 minggu pertama itu normal dan sangat wajar.</li>
      </ul>`,
  },
  {
    id: "tantangan", ikon: "🧗", warna: "#FDF4FF", judul: "Menghadapi Tantangan Magang",
    deskripsi: "Strategi mengatasi imposter syndrome, beban kerja, feedback, dan masalah umum selama magang.",
    isi: `<h3 class="text-base font-bold text-slate-900 mb-3">Cara Menghadapi Tantangan Selama Magang</h3>
      <ul class="space-y-2.5">
        <li class="item-panduan-tips"><strong>Imposter Syndrome:</strong> Semua orang pernah merasakannya. Fokus pada belajar, bukan kesempurnaan.</li>
        <li class="item-panduan-tips"><strong>Tugas tidak jelas:</strong> Selalu klarifikasi sebelum mulai. Tanya: <em>"Seperti apa hasil yang diharapkan?"</em></li>
        <li class="item-panduan-tips"><strong>Menerima kritik:</strong> Anggap feedback sebagai data, bukan penilaian pribadi.</li>
        <li class="item-panduan-tips"><strong>Informasi berlebih:</strong> Catat segalanya. Mustahil mengingat semua di minggu-minggu awal.</li>
        <li class="item-panduan-tips"><strong>Stuck di masalah:</strong> Set timer 30 menit. Jika masih stuck, mintalah bantuan disertai konteks.</li>
      </ul>`,
  },
  {
    id: "target", ikon: "🎯", warna: "#FFFBEB", judul: "Menetapkan Target Magang",
    deskripsi: "Cara mendefinisikan target yang bermakna, melacak pertumbuhan, dan membuat magang benar-benar berharga.",
    isi: `<h3 class="text-base font-bold text-slate-900 mb-3">Menetapkan Target Magang yang SMART</h3>
      <p class="text-sm text-slate-600 mb-3">Target memberi arah pada magangmu dan memudahkan kamu menunjukkan kontribusi nyata.</p>
      <ul class="space-y-2.5">
        <li class="item-panduan-tips"><strong>Spesifik:</strong> "Aku ingin membangun satu fitur penuh" vs. "Aku ingin belajar coding."</li>
        <li class="item-panduan-tips"><strong>Terukur:</strong> Lacak dengan angka — tugas selesai, PR di-merge, hal yang dipelajari.</li>
        <li class="item-panduan-tips"><strong>Realistis:</strong> Ambisius tapi sesuai level skill dan waktu tersedia.</li>
        <li class="item-panduan-tips"><strong>Relevan:</strong> Kaitkan target dengan pekerjaan tim yang nyata.</li>
        <li class="item-panduan-tips"><strong>Berbatas waktu:</strong> Tetapkan deadline — bahkan jika hanya "akhir minggu ini".</li>
      </ul>`,
  },
  {
    id: "networking", ikon: "🤝", warna: "#EFF6FF", judul: "Networking & Membangun Relasi",
    deskripsi: "Strategi membangun jaringan profesional selama magang yang bisa bertahan sepanjang karier.",
    isi: `<h3 class="text-base font-bold text-slate-900 mb-3">Membangun Jaringan Profesional</h3>
      <p class="text-sm text-slate-600 mb-3">Magang bukan hanya soal pekerjaan — relasi yang kamu bangun bisa menemanimu sepanjang karier.</p>
      <ul class="space-y-2.5">
        <li class="item-panduan-tips"><strong>Terhubung di LinkedIn.</strong> Kirim request dengan pesan personal dan spesifik.</li>
        <li class="item-panduan-tips"><strong>Minta sesi ngobrol singkat.</strong> Obrolan 15 menit dengan senior developer bisa sangat berharga.</li>
        <li class="item-panduan-tips"><strong>Jadilah pendengar yang curious.</strong> Tanyakan perjalanan karier mereka, bukan hanya pertanyaan teknis.</li>
        <li class="item-panduan-tips"><strong>Hasilkan kerja yang baik.</strong> Networking terbaik adalah menjadi orang yang layak direkomendasikan.</li>
        <li class="item-panduan-tips"><strong>Tetap terhubung.</strong> Kirim pesan terima kasih singkat setelah magang selesai.</li>
      </ul>`,
  },
];

/** Koleksi tips harian — ditampilkan secara acak di dashboard */
const DATA_TIPS = [
  "Minta mentormu untuk sesi 1:1 singkat minggu ini guna menyamakan ekspektasi.",
  "Catat setiap kendala yang kamu hadapi — ini menunjukkan proaktivitas kamu.",
  "Tinjau standar coding atau style guide tim jika tersedia.",
  "Jangan lupa tulis refleksi hari ini sebelum jam kerja selesai!",
  "Kalau bingung soal tugas, tanya dulu: 'Seperti apa hasil yang diharapkan?'",
  "Perkenalkan diri ke satu rekan baru hari ini — membangun relasi itu bertahap.",
  "Luangkan 10 menit untuk membaca dokumentasi proyek — investasi yang sangat berguna.",
  "Coba lakukan 'rubber duck debugging': jelaskan masalahmu keras-keras sebelum bertanya.",
  "Tandai satu tugas checklist hari ini sebagai selesai — sekecil apapun kemajuannya.",
  "Jangan takut membuat kesalahan — yang penting adalah bagaimana kamu belajar darinya.",
];

/**
 * Respons simulasi Asisten AI berdasarkan kata kunci.
 * Mendukung format **bold**, baris baru, dan template {nama}/{perusahaan}/{posisi}.
 * Template akan diisi oleh dapatkanResponsBot() sebelum ditampilkan.
 */
const RESPONS_ASISTEN = {
  feedback: "Cara terbaik meminta feedback ke supervisor atau mentor secara profesional:\n\n**Contoh pesan:**\n\"Halo [Nama], boleh saya minta feedback soal pekerjaan minggu ini? Adakah hal spesifik yang bisa saya lakukan lebih baik? Saya ingin terus berkembang ke arah yang tepat.\"\n\nJaga pertanyaanmu **spesifik**, bukan hanya 'ada masukan?'. Dan selalu ucapkan terima kasih atas waktunya!",

  haripertama: "Untuk hari pertama di {perusahaan}, fokus pada 3 hal ini:\n\n1. **Perkenalkan diri** ke sebanyak mungkin rekan tim — singkat, ramah, dan tunjukkan antusiasmemu.\n2. **Setup workspace** — tools, akun, email, dan channel komunikasi tim.\n3. **Tanya supervisormu:** _\"Seperti apa keberhasilan di minggu pertama menurutmu?\"_\n\nJangan terlalu banyak melakukan sesuatu. **Menyerap dan mengamati** adalah pekerjaan utama di hari pertama!",

  email: "Prinsip utama menulis email profesional di {perusahaan}:\n\n✅ **Subject line jelas** — sampaikan inti pesannya di satu kalimat\n✅ **Sapaan singkat** — 'Halo [Nama],' sudah sempurna\n✅ **Satu tujuan jelas** — jangan campur beberapa permintaan sekaligus\n✅ **Penutup sopan** — 'Terima kasih, {nama}' atau 'Salam'\n\nSelalu **baca ulang** sebelum mengirim. Satu typo di subject line bisa meninggalkan kesan tidak teliti!",

  emailmentor: "Berikut contoh email perkenalan ke mentor yang bisa kamu sesuaikan:\n\n---\n**Subjek:** Perkenalan & Pertanyaan Awal — {nama}\n\nHalo [Nama Mentor],\n\nPerkenalkan, saya {nama}, intern baru sebagai {posisi} di tim ini. Saya sangat antusias bisa belajar di {perusahaan}!\n\nSaya ingin bertanya apakah ada waktu untuk sesi 1:1 singkat di awal minggu ini? Saya ingin memastikan arah kerja saya sesuai dengan ekspektasi tim.\n\nTerima kasih banyak atas waktunya!\n\nSalam,\n{nama}\n---\n\nSesuaikan nama mentor, tim, dan konteks spesifiknya ya!",

  mentor: "Membangun hubungan baik dengan mentor itu investasi jangka panjang. Tips untuk {nama}:\n\n- **Datang siap** ke setiap sesi 1:1 — bawa pertanyaan spesifik atau update konkret.\n- **Proaktif update** tanpa harus selalu diminta — tunjukkan kemajuanmu.\n- **Jujur soal kendala** — mentor ada untuk membantumu berhasil, bukan menilaimu.\n- **Ucapkan terima kasih** secara tulus atas waktu dan bimbingan mereka.",

  kewalahan: "Merasa kewalahan itu **sangat normal** — terutama di minggu-minggu pertama magang. {nama}, ini yang bisa kamu lakukan sekarang:\n\n1. **Tarik napas.** Kamu dipilih karena potensimu, bukan karena sudah tahu segalanya.\n2. **Tuliskan** apa yang membuatmu kewalahan — biasanya lebih mudah dikelola saat sudah terdaftar.\n3. **Prioritaskan satu tugas** saja — hanya satu — dan fokus di sana dulu.\n4. **Bicara ke mentormu.** Tugas mereka memang membantu kamu berhasil.\n\nKamu pasti bisa melewati ini. 💙",

  git: "Git adalah tool wajib. Perintah dasar yang harus dikuasai sebagai {posisi}:\n\n```\ngit clone [url]        — Salin repository\ngit pull               — Ambil perubahan terbaru\ngit checkout -b nama   — Buat branch baru\ngit add .              — Tandai semua perubahan\ngit commit -m 'pesan'  — Simpan perubahan\ngit push               — Upload ke remote\ngit log --oneline      — Lihat riwayat commit\n```\n\n**Tips:** Selalu buat **branch baru** untuk setiap fitur atau bugfix. Jangan langsung commit ke main!",

  linkedin: "LinkedIn adalah aset karier yang penting. Tips membangun profil yang kuat selama magang di {perusahaan}:\n\n- **Update posisimu** sebagai '{posisi} Intern at {perusahaan}' — segera setelah mulai.\n- **Tulis deskripsi peran** yang konkret: tools yang digunakan, proyek yang dikerjakan.\n- **Terhubung dengan rekan tim** — sertakan pesan personal saat connect, jangan blank.\n- **Bagikan pembelajaran** — post singkat tentang hal baru yang kamu pelajari mendapat engagement tinggi.\n- **Minta rekomendasi** di akhir magang — dari mentor atau supervisor langsung.",

  cv: "Cara memperbarui CV dengan pengalaman magang di {perusahaan}:\n\n**Format entri yang baik:**\n_{posisi} Intern — {perusahaan}_\n[Bulan Mulai] – [Bulan Selesai]\n• Dikerjakan: [tugas spesifik dengan angka jika ada]\n• Tools: [teknologi/tools yang digunakan]\n• Hasil: [dampak atau pencapaian terukur]\n\n**Tips:**\n- Gunakan **kata kerja aksi**: membangun, mengintegrasikan, mengoptimalkan.\n- Prioritaskan **hasil terukur**: 'mengurangi waktu load 30%' > 'memperbaiki performa'.\n- Sesuaikan dengan setiap lowongan yang dilamar.",

  presentasi: "Cara membuat presentasi yang berkesan di lingkungan kerja profesional:\n\n1. **Mulai dengan 'So What?'** — sampaikan takeaway utama di slide pertama.\n2. **Satu ide per slide** — jangan padat teks, gunakan visual dan poin-poin singkat.\n3. **Data > opini** — dukung semua klaim dengan angka atau referensi.\n4. **Latihan keras** — ketahui materimu, bukan hapalkan script.\n5. **Antisipasi pertanyaan** — siapkan 3 pertanyaan sulit yang mungkin ditanya.\n\nKalau deg-degan, itu normal — artinya kamu peduli dengan hasilnya!",

  networking: "Membangun jaringan profesional selama magang di {perusahaan} adalah investasi terbaik:\n\n- **Terhubung di LinkedIn** dengan pesan personal: _\"Senang bisa kerja sama di [proyek]!\"_\n- **Minta coffee chat 15 menit** dengan senior — tanyakan perjalanan karier mereka.\n- **Hadir di semua team event** — bahkan yang informal sekalipun.\n- **Jadilah pendengar yang curious** — tanyakan 'Mengapa?' lebih dari 'Bagaimana?'.\n- **Kirim pesan terima kasih** setelah magang selesai — spesifik dan tulus.",

  deadline: "Mengelola deadline dengan baik adalah skill yang membedakan intern biasa dari yang luar biasa:\n\n1. **Klarifikasi deadline** sejak awal: 'Kapan ini dibutuhkan?' — jangan asumsikan.\n2. **Bagi tugas besar** menjadi milestone kecil dengan deadline internal sendiri.\n3. **Komunikasikan lebih awal** jika ada risiko terlambat — supervisor menghargai transparansi.\n4. **Buffer 20%** — estimasi waktu lebih dari yang kamu pikir akan kamu butuhkan.\n5. **Selesaikan draft awal** jauh sebelum deadline, sisakan waktu untuk revisi.",

  perkenalan: "Cara memperkenalkan diri yang berkesan di {perusahaan}:\n\n**Formula singkat (30 detik):**\n\"Halo, saya {nama} — intern baru sebagai {posisi}. Saya dari [universitas], background saya di [bidang]. Sangat excited bisa bergabung dengan tim ini!\"\n\n**Tips:**\n- **Tunjukkan antusiasme** yang tulus — orang menyukainya.\n- **Tanya balik** setelah perkenalan: 'Kamu sudah lama di tim ini?'\n- **Catat nama** lawan bicara — menyebut nama seseorang saat berbicara membuat mereka merasa dihargai.",

  tugas: "Tips menghadapi tugas baru sebagai {posisi} di {perusahaan}:\n\n1. **Klarifikasi dulu** sebelum memulai: output seperti apa? deadline-nya kapan? prioritasnya seberapa tinggi?\n2. **Pecah menjadi langkah kecil** — tulis checklist mini untuk dirimu sendiri.\n3. **Coba 30 menit sendiri** sebelum bertanya — dokumentasikan apa yang sudah dicoba.\n4. **Tunjukkan progres** secara proaktif — jangan tunggu diminta update.\n5. **Review ulang** sebelum submit — baca dari perspektif orang yang akan menerimanya.",

  default: [
    "{nama}, pertanyaan bagus! Kunci utama sebagai intern di {perusahaan} adalah tetap penasaran dan berani bertanya lebih awal. Dokumentasikan semua yang kamu pelajari — akan menghemat banyak waktu ke depannya.",
    "Ingat {nama}: tidak ada yang mengharapkan kamu tahu segalanya dari hari pertama. Fokus dulu pada memahami alur kerja dan tools tim di minggu pertama.",
    "Aturan 30 menit: coba selesaikan masalah sendiri selama 30 menit, baru minta bantuan. Ini menunjukkan inisiatif tanpa membuang waktu terlalu lama.",
    "Sebagai {posisi} di {perusahaan}, magangmu adalah tentang **belajar**, bukan tampil sempurna. Jadilah proaktif, catat semuanya, dan rayakan pencapaian kecil setiap harinya!",
    "Jangan ragu untuk bertanya 'Mengapa?' saat mempelajari sesuatu baru. Memahami **alasan** di balik keputusan teknis jauh lebih berharga dari sekadar menghafal caranya.",
  ],
};

/**
 * Peta saran lanjutan per topik — chip yang muncul setelah bot menjawab.
 * Setiap entri adalah array pasangan [labelChip, pesanKirim].
 */
const SARAN_LANJUTAN = {
  feedback:    [["Contoh email minta feedback", "Tolong buatkan contoh email meminta feedback ke supervisor"], ["Cara menerima kritik", "Bagaimana cara menerima kritik atau feedback negatif dengan baik?"]],
  haripertama: [["Tips minggu pertama", "Apa yang harus aku fokuskan di minggu pertama magang?"], ["Cara berkenalan", "Bagaimana cara memperkenalkan diri yang berkesan di tempat kerja baru?"]],
  email:       [["Contoh email ke mentor", "Bantu saya buat email ke mentor"], ["Tips subject line", "Bagaimana cara menulis subject line email yang efektif?"]],
  emailmentor: [["Cara follow up email", "Bagaimana cara follow up jika mentor belum membalas email saya?"], ["Tips komunikasi mentor", "Bagaimana cara membangun hubungan baik dengan mentor?"]],
  mentor:      [["Minta feedback ke mentor", "Bagaimana cara meminta feedback ke supervisor?"], ["Jadwalkan 1:1", "Bagaimana cara mengajukan sesi 1:1 dengan supervisor?"]],
  kewalahan:   [["Cara prioritas tugas", "Bagaimana cara mengatur prioritas tugas saat banyak deadline?"], ["Bicara ke mentor", "Bagaimana cara bicara ke mentor soal beban kerja yang berlebihan?"]],
  git:         [["Cara buat pull request", "Bagaimana cara membuat pull request yang baik?"], ["Git branching strategy", "Apa strategi branching Git yang umum digunakan di tim?"]],
  linkedin:    [["Update CV magang", "Bagaimana cara memperbarui CV dengan pengalaman magang ini?"], ["Tips networking", "Bagaimana cara networking yang efektif selama magang?"]],
  cv:          [["Tips LinkedIn", "Bagaimana cara memperbarui profil LinkedIn dengan pengalaman magang?"], ["Cara tulis achievement", "Bagaimana cara menulis pencapaian di CV dengan baik?"]],
  presentasi:  [["Cara mengatasi nervous", "Bagaimana cara mengatasi gugup saat presentasi?"], ["Struktur presentasi", "Apa struktur presentasi yang efektif untuk tim kerja?"]],
  networking:  [["Tips LinkedIn", "Bagaimana cara memperbarui profil LinkedIn dengan pengalaman magang?"], ["Cara minta referensi", "Bagaimana cara meminta surat rekomendasi atau referensi dari mentor?"]],
  deadline:    [["Cara prioritas tugas", "Bagaimana cara mengatur prioritas tugas saat banyak deadline?"], ["Komunikasi ke supervisor", "Bagaimana cara memberi tahu supervisor jika deadline tidak bisa dipenuhi?"]],
  perkenalan:  [["Tips hari pertama", "Apa yang harus aku lakukan di hari pertama magang?"], ["Cara beradaptasi", "Bagaimana cara beradaptasi dengan budaya kerja tim yang baru?"]],
  tugas:       [["Cara tanya ke mentor", "Bagaimana cara mengajukan pertanyaan yang baik ke mentor atau senior?"], ["Manajemen deadline", "Bagaimana cara mengelola deadline tugas yang banyak?"]],
  default:     [["Tips hari pertama", "Apa yang harus aku lakukan di hari pertama magang?"], ["Cara minta feedback", "Bagaimana cara meminta feedback ke supervisor?"], ["Komunikasi profesional", "Bagaimana cara menulis email yang profesional?"]],
};

/* ================================================================
   STATE APLIKASI
   ================================================================ */

let penggunaSaatIni  = null;  // Objek sesi pengguna yang sedang login
let profilSaatIni   = null;  // Profil lengkap pengguna
let dataChecklist   = [];    // Array checklist pengguna aktif
let dataRefleksi    = [];    // Array refleksi pengguna aktif
let panduanDibaca   = [];    // Array ID panduan yang sudah dibaca
let moodTerpilih    = "";    // Mood yang dipilih di form refleksi
let chatTerInisiasi = false; // Apakah chat sudah punya pesan sambutan?
let panduanSudahDirender = false; // Kartu panduan sudah di-render?
let timerToast      = null;  // Referensi timeout toast
let riwayatTopik    = [];    // Array topik terakhir yang dibahas di chat (maks 3)

/* ================================================================
   UTILITAS UMUM
   ================================================================ */

/**
 * Simpan data ke localStorage sebagai JSON.
 * @param {string} kunci
 * @param {*} data
 */
function simpanLokal(kunci, data) {
  try { localStorage.setItem(kunci, JSON.stringify(data)); }
  catch (e) { console.warn('localStorage penuh atau tidak tersedia:', e); }
}

/**
 * Ambil data dari localStorage, kembalikan null jika gagal.
 * @param {string} kunci
 * @returns {*|null}
 */
function ambilLokal(kunci) {
  try {
    const data = localStorage.getItem(kunci);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

/**
 * Escape karakter HTML untuk mencegah XSS pada konten dinamis.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/**
 * Format teks dengan **bold** dan baris baru menjadi HTML.
 * @param {string} teks
 * @returns {string}
 */
function formatPesanBot(teks) {
  return teks
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/```([\s\S]*?)```/g, (_, kode) =>
      `<pre class="bg-slate-100 rounded-lg p-3 text-xs mt-2 overflow-x-auto whitespace-pre">${escapeHtml(kode.trim())}</pre>`)
    .replace(/\n\n/g, "</p><p class='mt-2'>")
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>').replace(/$/, '</p>');
}

/**
 * Tampilkan notifikasi toast singkat.
 * @param {string} pesan
 * @param {'info'|'sukses'|'galat'} tipe
 */
function tampilkanToast(pesan, tipe = 'info') {
  let toast = document.querySelector('.notif-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'notif-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = pesan;
  toast.classList.add('tampil');
  clearTimeout(timerToast);
  timerToast = setTimeout(() => toast.classList.remove('tampil'), 3200);
}

/**
 * Tampilkan atau sembunyikan satu layar (layar-login, layar-register, layar-profil, layar-app).
 * @param {string} id - ID elemen layar
 */
function tampilkanLayar(id) {
  ['layar-login', 'layar-register', 'layar-profil', 'layar-app'].forEach(l => {
    const el = document.getElementById(l);
    if (!el) return;
    if (l === id) {
      el.classList.remove('hidden');
      // layar-app menggunakan flex layout — pastikan display:flex aktif
      if (l === 'layar-app') el.style.display = 'flex';
    } else {
      el.classList.add('hidden');
      if (l === 'layar-app') el.style.display = '';
    }
  });
}

/**
 * Dapatkan inisial dari nama (maks. 2 huruf).
 * @param {string} nama
 * @returns {string}
 */
function inisialNama(nama) {
  return (nama || 'U').split(' ').slice(0, 2).map(k => k[0]).join('').toUpperCase();
}

/**
 * Hitung selisih hari antara dua tanggal.
 * @param {string} tanggalMulai - ISO date string (YYYY-MM-DD)
 * @returns {number}
 */
function hitungHariBerjalan(tanggalMulai) {
  if (!tanggalMulai) return 0;
  const mulai = new Date(tanggalMulai);
  const sekarang = new Date();
  const selisihMs = sekarang - mulai;
  return Math.max(0, Math.floor(selisihMs / (1000 * 60 * 60 * 24)) + 1);
}

/**
 * Format tanggal ke Bahasa Indonesia.
 * @param {Date|string} [tanggal]
 * @returns {string}
 */
function formatTanggal(tanggal) {
  return new Date(tanggal || Date.now()).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

/**
 * Format tanggal singkat untuk label (contoh: "29 Okt 2026")
 * @returns {string}
 */
function formatTanggalSingkat() {
  return new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Sapaan berdasarkan jam sekarang.
 * @returns {string}
 */
function sapaanWaktu() {
  const jam = new Date().getHours();
  if (jam < 11)  return 'Selamat pagi';
  if (jam < 15)  return 'Selamat siang';
  if (jam < 18)  return 'Selamat sore';
  return 'Selamat malam';
}

/* ================================================================
   SISTEM AUTENTIKASI
   ================================================================ */

/**
 * Hash password sederhana menggunakan btoa (encoding, bukan enkripsi).
 * ⚠️ HANYA UNTUK PROTOTYPE — jangan gunakan di produksi.
 * @param {string} pw
 * @returns {string}
 */
function hashPassword(pw) {
  return btoa(unescape(encodeURIComponent(pw)));
}

/** @returns {Array} Daftar semua akun */
function ambilDaftarAkun() {
  return ambilLokal(KUNCI.DAFTAR_AKUN) || [];
}

/**
 * Buat akun demo jika belum ada.
 */
function inisiasiAkunDemo() {
  const akun = ambilDaftarAkun();
  const sudahAda = akun.some(a => a.email === 'demo@internbuddy.id');
  if (sudahAda) return;

  const akunDemo = [{
    email: 'demo@internbuddy.id',
    pwHash: hashPassword('demo1234'),
    nama: 'Vania Christa',
    role: 'intern',
  }];
  simpanLokal(KUNCI.DAFTAR_AKUN, [...akun, ...akunDemo]);

  // Profil demo
  simpanLokal(KUNCI.PROFIL('demo@internbuddy.id'), {
    foto: null,
    perusahaan: 'PT Teknologi Nusantara',
    posisi: 'Software Developer Intern',
    mulaiMagang: '2026-10-20',
    durasi: '3 bulan',
    pengalaman: 'Pertama kali',
    sudahLengkap: true,
  });

  // Checklist demo (beberapa sudah selesai)
  const checklistDemo = DATA_CHECKLIST_AWAL.map((item, idx) => ({
    ...item, selesai: idx < 6
  }));
  simpanLokal(KUNCI.CHECKLIST('demo@internbuddy.id'), checklistDemo);

  // Refleksi demo
  simpanLokal(KUNCI.REFLEKSI('demo@internbuddy.id'), [
    { tanggal: '27 Okt 2026', mood: '🤩', belajar: 'Cara membuat dan merge Git branch dalam alur kerja tim', baik: 'Berhasil menyelesaikan merge conflict sendiri!', kendala: 'Masih bingung dengan struktur folder proyek', target: 'Baca dokumentasi API' },
    { tanggal: '28 Okt 2026', mood: '😊', belajar: 'Tim menggunakan daily stand-up untuk sinkronisasi blockers', baik: 'Kode saya direview dan disetujui dengan perubahan minor', kendala: 'Codebase jauh lebih besar dari yang dibayangkan', target: 'Selesaikan item checklist minggu pertama' },
    { tanggal: '29 Okt 2026', mood: '😊', belajar: 'Perbedaan antara dev, staging, dan production environment', baik: 'Setup dev environment berjalan lancar', kendala: 'Masih ragu pertanyaan apa yang harus diajukan ke mentor', target: 'Jadwalkan sesi 1:1 dengan supervisor' },
  ]);
}

/**
 * Cek apakah ada sesi aktif dan muat pengguna.
 * @returns {boolean} true jika ada sesi valid
 */
function cekSesiAktif() {
  const sesi = ambilLokal(KUNCI.SESI);
  if (!sesi || !sesi.email) return false;

  const akun = ambilDaftarAkun().find(a => a.email === sesi.email);
  if (!akun) { hapusSesi(); return false; }

  penggunaSaatIni = akun;
  muatDataPengguna(akun.email);
  return true;
}

/**
 * Simpan sesi login ke localStorage.
 * @param {string} email
 */
function simpanSesi(email) {
  simpanLokal(KUNCI.SESI, { email, loginAt: Date.now() });
}

/** Hapus sesi login */
function hapusSesi() {
  localStorage.removeItem(KUNCI.SESI);
  penggunaSaatIni = null;
  profilSaatIni = null;
}

/**
 * Muat semua data pengguna berdasarkan email.
 * @param {string} email
 */
function muatDataPengguna(email) {
  profilSaatIni = ambilLokal(KUNCI.PROFIL(email));

  const tersimpanChecklist = ambilLokal(KUNCI.CHECKLIST(email));
  dataChecklist = (tersimpanChecklist && tersimpanChecklist.length === DATA_CHECKLIST_AWAL.length)
    ? tersimpanChecklist
    : DATA_CHECKLIST_AWAL.map(i => ({ ...i }));

  dataRefleksi  = ambilLokal(KUNCI.REFLEKSI(email)) || [];
  panduanDibaca = ambilLokal(KUNCI.PANDUAN(email))   || [];

  simpanLokal(KUNCI.CHECKLIST(email), dataChecklist);
}

/** Simpan semua data pengguna ke localStorage */
function simpanSemuaData() {
  if (!penggunaSaatIni) return;
  const email = penggunaSaatIni.email;
  simpanLokal(KUNCI.CHECKLIST(email), dataChecklist);
  simpanLokal(KUNCI.REFLEKSI(email),  dataRefleksi);
  simpanLokal(KUNCI.PANDUAN(email),   panduanDibaca);
}

/* ================================================================
   FORM VALIDASI HELPERS
   ================================================================ */

/**
 * Tampilkan pesan error pada elemen.
 * @param {string} idError - ID elemen error
 * @param {string} pesan   - Teks error (kosong = hapus error)
 */
function setError(idError, pesan) {
  const el = document.getElementById(idError);
  if (!el) return;
  el.textContent = pesan;
  const input = el.previousElementSibling?.tagName === 'INPUT' || el.previousElementSibling?.tagName === 'TEXTAREA'
    ? el.previousElementSibling : el.closest('.grup-input')?.querySelector('.kolom-input');
  if (input) input.classList.toggle('galat', !!pesan);
}

/** Bersihkan semua pesan error di form */
function bersihkanError(...idErrors) {
  idErrors.forEach(id => setError(id, ''));
}

/** Validasi format email */
function validasiEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ================================================================
   HALAMAN LOGIN
   ================================================================ */

document.getElementById('formLogin').addEventListener('submit', function(e) {
  e.preventDefault();
  bersihkanError('errLoginEmail', 'errLoginPassword', 'errLoginUmum');

  // Normalisasi email: trim + lowercase agar cocok dengan data tersimpan
  const email    = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  let valid = true;

  if (!email) { setError('errLoginEmail', 'Alamat email wajib diisi.'); valid = false; }
  else if (!validasiEmail(email)) { setError('errLoginEmail', 'Format email tidak valid.'); valid = false; }

  if (!password) { setError('errLoginPassword', 'Password wajib diisi.'); valid = false; }

  if (!valid) return;

  const akun = ambilDaftarAkun().find(a => a.email === email);
  if (!akun || akun.pwHash !== hashPassword(password)) {
    setError('errLoginUmum', '❌ Email atau password salah. Silakan coba lagi.');
    return;
  }

  penggunaSaatIni = akun;
  simpanSesi(akun.email);
  muatDataPengguna(akun.email);

  if (!profilSaatIni || !profilSaatIni.sudahLengkap) {
    tampilkanLayarProfil();
  } else {
    masukKeAplikasi();
  }
});

/* ================================================================
   HALAMAN REGISTRASI
   ================================================================ */

document.getElementById('formRegister').addEventListener('submit', function(e) {
  e.preventDefault();
  bersihkanError('errRegNama', 'errRegEmail', 'errRegPassword', 'errRegKonfirm', 'errRegUmum');

  const nama            = document.getElementById('regNama').value.trim();
  const email           = document.getElementById('regEmail').value.trim().toLowerCase();
  const password        = document.getElementById('regPassword').value;
  const konfirmPassword = document.getElementById('regKonfirmPassword').value;
  let valid = true;

  if (!nama || nama.length < 2) { setError('errRegNama', 'Nama lengkap minimal 2 karakter.'); valid = false; }
  if (!email) { setError('errRegEmail', 'Alamat email wajib diisi.'); valid = false; }
  else if (!validasiEmail(email)) { setError('errRegEmail', 'Format email tidak valid.'); valid = false; }
  if (!password) { setError('errRegPassword', 'Password wajib diisi.'); valid = false; }
  else if (password.length < 8) { setError('errRegPassword', 'Password minimal 8 karakter.'); valid = false; }
  if (!konfirmPassword) { setError('errRegKonfirm', 'Harap ulangi password kamu.'); valid = false; }
  else if (password !== konfirmPassword) { setError('errRegKonfirm', 'Password tidak cocok. Periksa kembali.'); valid = false; }

  if (!valid) return;

  const akunList = ambilDaftarAkun();
  if (akunList.some(a => a.email === email)) {
    setError('errRegUmum', '❌ Email ini sudah terdaftar. Coba masuk atau gunakan email lain.');
    return;
  }

  const akunBaru = { email, pwHash: hashPassword(password), nama, role: 'intern' };
  simpanLokal(KUNCI.DAFTAR_AKUN, [...akunList, akunBaru]);

  penggunaSaatIni = akunBaru;
  simpanSesi(email);
  muatDataPengguna(email);
  tampilkanToast('✅ Akun berhasil dibuat! Yuk lengkapi profilmu.');
  tampilkanLayarProfil();
});

/* Navigasi antar halaman auth */
document.getElementById('keHalamanRegister').addEventListener('click', () => {
  tampilkanLayar('layar-register');
  document.getElementById('regNama').focus();
});
document.getElementById('keHalamanLogin').addEventListener('click', () => {
  tampilkanLayar('layar-login');
  document.getElementById('loginEmail').focus();
});

/* Toggle lihat/sembunyikan password */
document.querySelectorAll('.tombol-lihat-pw').forEach(tombol => {
  tombol.addEventListener('click', () => {
    const input = document.getElementById(tombol.dataset.target);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
    tombol.setAttribute('aria-label', input.type === 'password' ? 'Tampilkan password' : 'Sembunyikan password');
  });
});

/* ================================================================
   HALAMAN ONBOARDING PROFIL
   ================================================================ */

/**
 * Tampilkan halaman onboarding profil dan isi field dari data pengguna.
 */
function tampilkanLayarProfil() {
  tampilkanLayar('layar-profil');
  const nama = penggunaSaatIni?.nama || '';
  document.getElementById('profilNama').value = nama;
  // Isi ulang dari profil yang sudah ada jika ada
  if (profilSaatIni) {
    document.getElementById('profilPosisi').value    = profilSaatIni.posisi || '';
    document.getElementById('profilPerusahaan').value = profilSaatIni.perusahaan || '';
    document.getElementById('profilMulai').value     = profilSaatIni.mulaiMagang || '';
    document.getElementById('profilDurasi').value    = profilSaatIni.durasi || '';
    document.getElementById('profilPengalaman').value = profilSaatIni.pengalaman || 'Pertama kali';
  }
}

/* Preview foto profil sebelum disimpan */
document.getElementById('inputFoto').addEventListener('change', function() {
  const file = this.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    tampilkanToast('⚠️ Ukuran foto terlalu besar. Maksimum 2MB.');
    this.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const pratinjau = document.getElementById('pratinjauAvatar');
    pratinjau.innerHTML = `<img src="${e.target.result}" alt="Foto profil" />`;
    pratinjau.dataset.fotoData = e.target.result;
  };
  reader.readAsDataURL(file);
});

/* Submit form profil */
document.getElementById('formProfil').addEventListener('submit', function(e) {
  e.preventDefault();
  bersihkanError('errProfilPosisi', 'errProfilPerusahaan', 'errProfilMulai');

  const posisi     = document.getElementById('profilPosisi').value.trim();
  const perusahaan = document.getElementById('profilPerusahaan').value.trim();
  const mulai      = document.getElementById('profilMulai').value;
  let valid = true;

  if (!posisi)     { setError('errProfilPosisi',     'Posisi / bidang kerja wajib diisi.'); valid = false; }
  if (!perusahaan) { setError('errProfilPerusahaan', 'Nama perusahaan wajib diisi.');       valid = false; }
  if (!mulai)      { setError('errProfilMulai',      'Tanggal mulai magang wajib diisi.');  valid = false; }

  if (!valid) return;

  const pratinjau  = document.getElementById('pratinjauAvatar');
  const fotoData   = pratinjau.dataset.fotoData || (profilSaatIni?.foto || null);

  profilSaatIni = {
    foto:        fotoData,
    nama:        penggunaSaatIni.nama,   // simpan nama agar chatbot bisa membacanya langsung
    perusahaan:  perusahaan,
    posisi:      posisi,
    mulaiMagang: mulai,
    durasi:      document.getElementById('profilDurasi').value,
    pengalaman:  document.getElementById('profilPengalaman').value,
    sudahLengkap: true,
  };

  simpanLokal(KUNCI.PROFIL(penggunaSaatIni.email), profilSaatIni);
  tampilkanToast('🎉 Profil tersimpan! Selamat datang di InternBuddy AI.');
  masukKeAplikasi();
});

/* ================================================================
   MASUK KE APLIKASI UTAMA
   ================================================================ */

/**
 * Tampilkan layar aplikasi utama, muat profil di sidebar, dan render dashboard.
 */
function masukKeAplikasi() {
  tampilkanLayar('layar-app');
  chatTerInisiasi = false;
  panduanSudahDirender = false;
  riwayatTopik = [];
  perbaruiProfilSidebar();
  tampilkanBagian('dashboard');
}

/**
 * Perbarui elemen profil di sidebar dan topbar berdasarkan data pengguna aktif.
 */
function perbaruiProfilSidebar() {
  if (!penggunaSaatIni || !profilSaatIni) return;
  const nama    = penggunaSaatIni.nama;
  const posisi  = profilSaatIni.posisi || '—';
  const foto    = profilSaatIni.foto;
  const inisial = inisialNama(nama);

  document.getElementById('namaSidebar').textContent   = nama;
  document.getElementById('posisiSidebar').textContent = posisi;

  const avatarSidebar = document.getElementById('avatarSidebar');
  avatarSidebar.innerHTML = foto
    ? `<img src="${foto}" alt="${escapeHtml(nama)}" />`
    : inisial;

  const avatarTopbar = document.getElementById('avatarTopbar');
  avatarTopbar.innerHTML = foto
    ? `<img src="${foto}" alt="${escapeHtml(nama)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : inisial;

  const hariKe   = hitungHariBerjalan(profilSaatIni.mulaiMagang);
  const mingguKe = Math.ceil(hariKe / 7);
  document.getElementById('infoMingguMagang').textContent = `Hari ke-${hariKe} · Minggu ke-${mingguKe}`;
}

/* ================================================================
   LOGOUT
   ================================================================ */

document.getElementById('tombolLogout').addEventListener('click', () => {
  document.getElementById('modalLogout').classList.add('terbuka');
});
document.getElementById('batalLogout').addEventListener('click', () => {
  document.getElementById('modalLogout').classList.remove('terbuka');
});
document.getElementById('konfirmasiLogout').addEventListener('click', () => {
  hapusSesi();
  document.getElementById('modalLogout').classList.remove('terbuka');
  tampilkanLayar('layar-login');
  // Reset state
  dataChecklist = []; dataRefleksi = []; panduanDibaca = [];
  chatTerInisiasi = false; panduanSudahDirender = false; riwayatTopik = [];
  tampilkanToast('👋 Sampai jumpa! Kamu sudah berhasil keluar.');
});

/* ================================================================
   EDIT PROFIL
   ================================================================ */

/**
 * Buka modal edit profil dan isi semua field dengan data pengguna saat ini.
 */
function bukaModalEditProfil() {
  if (!penggunaSaatIni || !profilSaatIni) return;

  // Prefill semua field dari data yang tersimpan
  document.getElementById('editNama').value        = penggunaSaatIni.nama           || '';
  document.getElementById('editPosisi').value      = profilSaatIni.posisi           || '';
  document.getElementById('editPerusahaan').value  = profilSaatIni.perusahaan       || '';
  document.getElementById('editMulai').value       = profilSaatIni.mulaiMagang      || '';
  document.getElementById('editDurasi').value      = profilSaatIni.durasi           || '';
  document.getElementById('editPengalaman').value  = profilSaatIni.pengalaman       || 'Pertama kali';

  // Tampilkan foto profil yang ada (jika ada)
  const pratinjau = document.getElementById('editPratinjauAvatar');
  if (profilSaatIni.foto) {
    pratinjau.innerHTML = `<img src="${profilSaatIni.foto}" alt="Foto profil saat ini" />`;
  } else {
    // Avatar inisial sebagai placeholder
    pratinjau.innerHTML = `<span class="text-2xl font-bold text-slate-500">${inisialNama(penggunaSaatIni.nama)}</span>`;
  }
  // Hapus data foto baru (reset setiap kali modal dibuka)
  delete pratinjau.dataset.fotoBaru;
  // Reset input file
  const inputFoto = document.getElementById('editInputFoto');
  if (inputFoto) inputFoto.value = '';

  // Bersihkan error sebelumnya
  bersihkanError('errEditNama', 'errEditPosisi', 'errEditPerusahaan', 'errEditMulai');

  // Tampilkan modal
  document.getElementById('modalEditProfil').classList.add('terbuka');
  document.body.style.overflow = 'hidden';

  // Fokus ke field pertama
  setTimeout(() => document.getElementById('editNama').focus(), 150);
}

/** Tutup modal edit profil */
function tutupModalEditProfil() {
  document.getElementById('modalEditProfil').classList.remove('terbuka');
  document.body.style.overflow = '';
}

// Preview foto baru yang dipilih di modal edit profil
document.getElementById('editInputFoto').addEventListener('change', function() {
  const file = this.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    tampilkanToast('⚠️ Ukuran foto terlalu besar. Maksimum 2MB.');
    this.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const pratinjau = document.getElementById('editPratinjauAvatar');
    pratinjau.innerHTML = `<img src="${e.target.result}" alt="Foto profil baru" />`;
    pratinjau.dataset.fotoBaru = e.target.result; // Tandai sebagai foto baru
  };
  reader.readAsDataURL(file);
});

// Tombol-tombol pembuka modal edit profil
document.getElementById('tombolEditProfilSidebar').addEventListener('click', bukaModalEditProfil);
document.getElementById('avatarTopbar').addEventListener('click', bukaModalEditProfil);

// Tombol tutup modal
document.getElementById('tutupEditProfil').addEventListener('click', tutupModalEditProfil);
document.getElementById('batalEditProfil').addEventListener('click', tutupModalEditProfil);

// Tutup modal jika klik di luar kotak
document.getElementById('modalEditProfil').addEventListener('click', function(e) {
  if (e.target === this) tutupModalEditProfil();
});

// Submit form edit profil
document.getElementById('formEditProfil').addEventListener('submit', function(e) {
  e.preventDefault();
  bersihkanError('errEditNama', 'errEditPosisi', 'errEditPerusahaan', 'errEditMulai');

  const nama       = document.getElementById('editNama').value.trim();
  const posisi     = document.getElementById('editPosisi').value.trim();
  const perusahaan = document.getElementById('editPerusahaan').value.trim();
  const mulai      = document.getElementById('editMulai').value;
  let valid = true;

  if (!nama || nama.length < 2) { setError('errEditNama',       'Nama lengkap minimal 2 karakter.');      valid = false; }
  if (!posisi)                   { setError('errEditPosisi',     'Posisi / bidang kerja wajib diisi.');    valid = false; }
  if (!perusahaan)               { setError('errEditPerusahaan', 'Nama perusahaan wajib diisi.');          valid = false; }
  if (!mulai)                    { setError('errEditMulai',      'Tanggal mulai magang wajib diisi.');     valid = false; }
  if (!valid) return;

  // Ambil foto baru jika ada, atau pertahankan foto lama
  const pratinjau = document.getElementById('editPratinjauAvatar');
  const fotoBaru  = pratinjau.dataset.fotoBaru || profilSaatIni.foto || null;

  // 1. Perbarui nama di daftar akun (data yang tidak terikat profil)
  const daftarAkun = ambilDaftarAkun();
  const idxAkun    = daftarAkun.findIndex(a => a.email === penggunaSaatIni.email);
  if (idxAkun !== -1) {
    daftarAkun[idxAkun].nama = nama;
    simpanLokal(KUNCI.DAFTAR_AKUN, daftarAkun);
  }
  penggunaSaatIni.nama = nama; // Update state in-memory

  // 2. Perbarui profil — termasuk nama agar chatbot selalu membaca nama terbaru
  profilSaatIni = {
    ...profilSaatIni,
    foto:        fotoBaru,
    nama:        nama,               // nama terbaru dari form edit
    posisi:      posisi,
    perusahaan:  perusahaan,
    mulaiMagang: mulai,
    durasi:      document.getElementById('editDurasi').value,
    pengalaman:  document.getElementById('editPengalaman').value,
    sudahLengkap: true,
  };
  simpanLokal(KUNCI.PROFIL(penggunaSaatIni.email), profilSaatIni);

  // 3. Tutup modal
  tutupModalEditProfil();

  // 4. Perbarui seluruh UI yang bergantung pada data profil
  perbaruiProfilSidebar();

  // 5. Re-render bagian aktif agar dashboard & progres langsung update
  const bagianAktif = document.querySelector('.tautan-nav.aktif')?.dataset.bagian;
  if (bagianAktif === 'dashboard') renderDashboard();
  if (bagianAktif === 'progres')   renderProgres();

  tampilkanToast('✅ Profil berhasil diperbarui!');
});

/* ================================================================
   NAVIGASI HALAMAN APLIKASI
   ================================================================ */

const tautanNav    = document.querySelectorAll('.tautan-nav[data-bagian]');
const bagianList   = document.querySelectorAll('.bagian-halaman');
const judulHalaman = document.getElementById('judulHalaman');
const sidebar      = document.getElementById('sidebar');
const overlayMobile = document.getElementById('overlayMobile');

const JUDUL_BAGIAN = {
  dashboard: 'Dashboard',
  checklist: 'Checklist Onboarding',
  panduan:   'Panduan Magang',
  asisten:   'Asisten AI',
  refleksi:  'Refleksi Harian',
  progres:   'Pelacakan Progres',
};

/**
 * Tampilkan bagian halaman tertentu di dalam app shell.
 * @param {string} id - ID bagian ('dashboard', 'checklist', dst.)
 */
function tampilkanBagian(id) {
  bagianList.forEach(b => b.classList.add('hidden'));
  tautanNav.forEach(t => { t.classList.remove('aktif'); t.removeAttribute('aria-current'); });

  const target = document.getElementById(`bagian-${id}`);
  if (target) target.classList.remove('hidden');

  const tautanAktif = document.querySelector(`.tautan-nav[data-bagian="${id}"]`);
  if (tautanAktif) { tautanAktif.classList.add('aktif'); tautanAktif.setAttribute('aria-current', 'page'); }

  judulHalaman.textContent = JUDUL_BAGIAN[id] || id;
  sidebar.classList.remove('terbuka');
  overlayMobile.classList.add('hidden');

  // Render konten sesuai bagian
  if (id === 'dashboard') renderDashboard();
  if (id === 'checklist') renderChecklist('semua');
  if (id === 'panduan')   renderPanduan();
  if (id === 'asisten')   inisiasiChat();
  if (id === 'refleksi')  renderDaftarRefleksi();
  if (id === 'progres')   renderProgres();
}

tautanNav.forEach(t => {
  t.addEventListener('click', e => { e.preventDefault(); tampilkanBagian(t.dataset.bagian); });
});

// Toggle sidebar mobile
document.getElementById('tombolSidebar').addEventListener('click', () => {
  sidebar.classList.toggle('terbuka');
  overlayMobile.classList.toggle('hidden');
});
overlayMobile.addEventListener('click', () => {
  sidebar.classList.remove('terbuka');
  overlayMobile.classList.add('hidden');
});

/* ================================================================
   DASHBOARD
   ================================================================ */

/**
 * Render seluruh konten dashboard berdasarkan data pengguna saat ini.
 */
function renderDashboard() {
  const nama       = penggunaSaatIni?.nama?.split(' ')[0] || 'Kamu';
  const perusahaan = profilSaatIni?.perusahaan || '—';
  const posisi     = profilSaatIni?.posisi     || '—';
  const hariKe     = hitungHariBerjalan(profilSaatIni?.mulaiMagang);

  // Sapaan personal
  document.getElementById('sapaanDashboard').textContent = `${sapaanWaktu()}, ${nama}! 👋`;
  document.getElementById('subDashboard').textContent    =
    `${formatTanggal()} · Hari ke-${hariKe} magangmu`;

  // Info perusahaan
  document.getElementById('namaPerusahaanDash').textContent = perusahaan;
  document.getElementById('posisiDash').textContent         = posisi;
  document.getElementById('hariKeMagangDash').textContent   = hariKe;

  // Statistik checklist
  const jumlahSelesai  = dataChecklist.filter(i => i.selesai).length;
  const total          = dataChecklist.length;
  const persen         = total ? Math.round((jumlahSelesai / total) * 100) : 0;

  document.getElementById('dashTugasSelesai').innerHTML    = `${jumlahSelesai}<span class="sub-stat">/${total}</span>`;
  document.getElementById('dashJumlahRefleksi').textContent = dataRefleksi.length;
  document.getElementById('dashPanduanDibaca').innerHTML    =
    `${panduanDibaca.length}<span class="sub-stat">/${DATA_PANDUAN.length}</span>`;
  document.getElementById('dashPersenProgres').innerHTML    =
    `${persen}<span class="sub-stat">%</span>`;

  document.getElementById('dashBarProgres').style.width    = persen + '%';
  document.getElementById('dashLabelProgres').textContent  = persen + '%';
  document.getElementById('dashKetProgres').textContent    =
    `${jumlahSelesai} dari ${total} tugas onboarding selesai`;

  // Aktivitas terbaru (dinamis dari data)
  renderAktivitasTerbaru();

  // Tips harian (acak)
  const listTips = document.getElementById('listTipsHarian');
  const tipAcak  = [...DATA_TIPS].sort(() => 0.5 - Math.random()).slice(0, 4);
  listTips.innerHTML = tipAcak.map(t => `<li class="item-tips">${escapeHtml(t)}</li>`).join('');
}

/**
 * Buat daftar aktivitas terbaru secara dinamis.
 */
function renderAktivitasTerbaru() {
  const list = document.getElementById('listAktivitas');
  const aktivitas = [];

  const tugasSelesai = dataChecklist.filter(i => i.selesai);
  if (tugasSelesai.length > 0) {
    aktivitas.push({ warna: 'bg-green-400', teks: `Menyelesaikan ${tugasSelesai.length} tugas checklist`, waktu: 'Baru saja' });
  }
  if (dataRefleksi.length > 0) {
    const terakhir = dataRefleksi[dataRefleksi.length - 1];
    aktivitas.push({ warna: 'bg-primer', teks: `Refleksi dicatat: "${terakhir.belajar?.slice(0,40)}…"`, waktu: terakhir.tanggal });
  }
  if (panduanDibaca.length > 0) {
    const idPanduan = panduanDibaca[panduanDibaca.length - 1];
    const panduan   = DATA_PANDUAN.find(p => p.id === idPanduan);
    if (panduan) aktivitas.push({ warna: 'bg-aksen', teks: `Membaca panduan "${panduan.judul}"`, waktu: 'Kemarin' });
  }

  if (aktivitas.length === 0) {
    list.innerHTML = `<li class="text-sm text-slate-400 text-center py-3">Belum ada aktivitas. Mulai dari checklist! 🚀</li>`;
    return;
  }

  list.innerHTML = aktivitas.slice(0, 4).map(a => `
    <li class="item-aktivitas">
      <span class="titik-aktivitas ${a.warna}"></span>
      <div><p class="text-sm font-medium">${escapeHtml(a.teks)}</p><p class="text-xs text-slate-400">${escapeHtml(a.waktu)}</p></div>
    </li>`).join('');
}

/* ================================================================
   CHECKLIST ONBOARDING
   ================================================================ */

/** Update tampilan progres bar checklist */
function updateProgresChecklist() {
  const selesai = dataChecklist.filter(i => i.selesai).length;
  const total   = dataChecklist.length;
  const persen  = total ? Math.round((selesai / total) * 100) : 0;

  const elHitung = document.getElementById('hitungChecklist');
  const elBar    = document.getElementById('barChecklist');
  if (elHitung) elHitung.textContent = `${selesai}/${total}`;
  if (elBar)    elBar.style.width    = persen + '%';
}

/**
 * Render daftar tugas checklist sesuai filter.
 * @param {string} filter - 'semua' | 'belum' | 'selesai'
 */
function renderChecklist(filter) {
  const kontainer = document.getElementById('itemChecklist');
  if (!kontainer) return;

  const filtered = filter === 'selesai' ? dataChecklist.filter(i => i.selesai)
                 : filter === 'belum'   ? dataChecklist.filter(i => !i.selesai)
                 :                        dataChecklist;

  kontainer.innerHTML = '';

  if (filtered.length === 0) {
    kontainer.innerHTML = `<li class="text-sm text-slate-400 text-center py-6">Tidak ada tugas dalam kategori ini.</li>`;
    updateProgresChecklist();
    return;
  }

  filtered.forEach(item => {
    const li = document.createElement('li');
    li.className = `item-checklist ${item.selesai ? 'selesai' : ''}`;
    li.setAttribute('role', 'checkbox');
    li.setAttribute('aria-checked', String(item.selesai));
    li.setAttribute('tabindex', '0');
    li.innerHTML = `
      <div class="kotak-centang" aria-hidden="true">
        <svg class="ikon-centang w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
        </svg>
      </div>
      <span class="teks-tugas">${escapeHtml(item.teks)}</span>
      <span class="lencana ${item.selesai ? 'lencana-selesai' : 'lencana-belum'}">${item.selesai ? 'Selesai' : 'Belum'}</span>
      <span class="text-xs text-slate-400 hidden sm:inline">${escapeHtml(item.kategori)}</span>`;

    const toggle = () => toggleChecklist(item.id, filter);
    li.addEventListener('click', toggle);
    li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    kontainer.appendChild(li);
  });

  updateProgresChecklist();
}

/**
 * Toggle status selesai pada tugas checklist dan simpan.
 * @param {number} id
 * @param {string} filter
 */
function toggleChecklist(id, filter) {
  const item = dataChecklist.find(i => i.id === id);
  if (!item) return;
  item.selesai = !item.selesai;
  simpanLokal(KUNCI.CHECKLIST(penggunaSaatIni.email), dataChecklist);
  tampilkanToast(item.selesai ? '✅ Tugas ditandai selesai!' : '↩️ Tugas dikembalikan ke belum selesai.');
  renderChecklist(filter);
}

// Tombol filter checklist
document.querySelectorAll('.tombol-filter').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.tombol-filter').forEach(b => b.classList.remove('aktif'));
    t.classList.add('aktif');
    renderChecklist(t.dataset.filter);
  });
});

/* ================================================================
   PANDUAN MAGANG
   ================================================================ */

/**
 * Render grid kartu panduan. Hanya dirender sekali per sesi.
 */
function renderPanduan() {
  const kontainer = document.getElementById('kartupanduan');
  if (!kontainer) return;

  if (panduanSudahDirender) {
    // Perbarui badge "Sudah Dibaca" saja
    DATA_PANDUAN.forEach(p => {
      const kartu = kontainer.querySelector(`[data-panduan-id="${p.id}"]`);
      if (!kartu) return;
      if (panduanDibaca.includes(p.id) && !kartu.querySelector('.lencana-dibaca')) {
        const badge = document.createElement('span');
        badge.className = 'lencana-dibaca';
        badge.textContent = 'Sudah Dibaca';
        kartu.querySelector('.ikon-panduan').after(badge);
      }
    });
    return;
  }

  panduanSudahDirender = true;
  kontainer.innerHTML  = '';

  DATA_PANDUAN.forEach(panduan => {
    const sudahDibaca = panduanDibaca.includes(panduan.id);
    const kartu       = document.createElement('div');
    kartu.className        = 'kartu-panduan';
    kartu.dataset.panduanId = panduan.id;
    kartu.setAttribute('role', 'button');
    kartu.setAttribute('tabindex', '0');
    kartu.innerHTML = `
      <div class="ikon-panduan" style="background:${panduan.warna}">${panduan.ikon}</div>
      ${sudahDibaca ? '<span class="lencana-dibaca">Sudah Dibaca</span>' : ''}
      <p class="judul-panduan">${escapeHtml(panduan.judul)}</p>
      <p class="deskripsi-panduan">${escapeHtml(panduan.deskripsi)}</p>
      <span class="tautan-baca">Baca panduan <svg class="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg></span>`;

    const buka = () => bukaModalPanduan(panduan);
    kartu.addEventListener('click', buka);
    kartu.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); buka(); } });
    kontainer.appendChild(kartu);
  });
}

/**
 * Buka modal panduan dan tandai sebagai sudah dibaca.
 * @param {Object} panduan
 */
function bukaModalPanduan(panduan) {
  document.getElementById('headerModal').innerHTML =
    `<div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style="background:${panduan.warna}">${panduan.ikon}</div>
     <h2 id="judulModal" class="text-base font-bold text-slate-900">${escapeHtml(panduan.judul)}</h2>`;
  document.getElementById('isiModal').innerHTML = panduan.isi;
  document.getElementById('modalPanduan').classList.add('terbuka');
  document.body.style.overflow = 'hidden';

  if (!panduanDibaca.includes(panduan.id)) {
    panduanDibaca.push(panduan.id);
    simpanLokal(KUNCI.PANDUAN(penggunaSaatIni.email), panduanDibaca);
    renderPanduan();
  }
}

document.getElementById('tutupModal').addEventListener('click', () => {
  document.getElementById('modalPanduan').classList.remove('terbuka');
  document.body.style.overflow = '';
});
document.getElementById('modalPanduan').addEventListener('click', e => {
  if (e.target === document.getElementById('modalPanduan')) {
    document.getElementById('modalPanduan').classList.remove('terbuka');
    document.body.style.overflow = '';
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.getElementById('modalPanduan').classList.remove('terbuka');
    document.getElementById('modalLogout').classList.remove('terbuka');
    tutupModalEditProfil();
    document.body.style.overflow = '';
  }
});

/* ================================================================
   ASISTEN AI
   ================================================================ */

/**
 * Inisiasi chat dengan pesan sambutan kontekstual berdasarkan profil & hari magang.
 * Hanya dijalankan sekali per sesi.
 */
function inisiasiChat() {
  if (chatTerInisiasi) return;
  chatTerInisiasi = true;
  riwayatTopik = [];

  // Escape data profil sebelum disisipkan ke pesan untuk mencegah XSS
  const namaRaw    = profilSaatIni?.nama || penggunaSaatIni?.nama || 'Kamu';
  const nama       = escapeHtml(namaRaw.split(' ')[0]);
  const perusahaan = escapeHtml(profilSaatIni?.perusahaan || 'perusahaanmu');
  const posisi     = escapeHtml(profilSaatIni?.posisi || 'intern');
  const hari       = profilSaatIni?.mulaiMagang ? hitungHariBerjalan(profilSaatIni.mulaiMagang) : 0;

  let pesanSambutan;
  if (hari === 0) {
    pesanSambutan =
      `Halo ${nama}! 👋 Saya **InternBuddy AI**, asisten magang virtualmu.\n\n` +
      `Kamu akan segera memulai magang sebagai **${posisi}** di **${perusahaan}** — persiapan yang baik adalah kunci awal yang kuat!\n\n` +
      `Tanyakan apa saja: dari persiapan hari pertama, cara berkenalan dengan tim, ` +
      `etika email profesional, hingga cara menghadapi tantangan di tempat kerja. Siap membantumu! 🚀`;
  } else if (hari <= 7) {
    pesanSambutan =
      `Halo ${nama}! 👋 Saya **InternBuddy AI**.\n\n` +
      `Kamu sudah memasuki **hari ke-${hari}** magang sebagai **${posisi}** di **${perusahaan}** — luar biasa!\n\n` +
      `Minggu pertama penuh penyesuaian. Ada yang ingin ditanyakan? Saya siap bantu dengan tips adaptasi, ` +
      `komunikasi dengan mentor, atau hal teknis apapun. 💪`;
  } else if (hari <= 30) {
    pesanSambutan =
      `Halo ${nama}! 👋 Saya **InternBuddy AI**.\n\n` +
      `Sudah **${hari} hari** magang di **${perusahaan}** — kamu sudah melewati fase paling berat! 🎉\n\n` +
      `Saatnya mulai memberi kontribusi nyata dan membangun relasi lebih dalam. ` +
      `Ada topik yang ingin kamu diskusikan hari ini?`;
  } else {
    pesanSambutan =
      `Halo lagi, ${nama}! 👋 Saya **InternBuddy AI**.\n\n` +
      `**${hari} hari** sudah kamu jalani magang sebagai **${posisi}** di **${perusahaan}** — kamu sudah sangat berkembang!\n\n` +
      `Ada hal yang ingin kamu tanyakan? Dari tips presentasi, memperbarui CV, ` +
      `networking, hingga mempersiapkan referensi — saya siap membantu.`;
  }

  tambahPesanBot(pesanSambutan);
}

/** Tambah pesan dari pengguna ke area chat */
function tambahPesanPengguna(teks) {
  const area = document.getElementById('pesanChat');
  const baris = document.createElement('div');
  baris.className = 'baris-chat pengguna';
  baris.innerHTML = `<div class="gelembung-chat gelembung-pengguna">${escapeHtml(teks)}</div>`;
  area.appendChild(baris);
  area.scrollTop = area.scrollHeight;
}

/** Tambah pesan dari bot ke area chat */
function tambahPesanBot(teks) {
  const area  = document.getElementById('pesanChat');
  const baris = document.createElement('div');
  baris.className = 'baris-chat';
  baris.innerHTML = `
    <div class="avatar-chat avatar-bot" aria-hidden="true">IB</div>
    <div class="gelembung-chat gelembung-bot">${formatPesanBot(teks)}</div>`;
  area.appendChild(baris);
  area.scrollTop = area.scrollHeight;
}

/** Tampilkan indikator mengetik */
function tampilkanIndikatorMengetik() {
  const area  = document.getElementById('pesanChat');
  const baris = document.createElement('div');
  baris.id = 'indikatorMengetik';
  baris.className = 'baris-chat';
  baris.innerHTML = `
    <div class="avatar-chat avatar-bot" aria-hidden="true">IB</div>
    <div class="gelembung-chat gelembung-bot flex items-center gap-1" style="padding:10px 14px">
      <span class="titik-mengetik"></span><span class="titik-mengetik"></span><span class="titik-mengetik"></span>
    </div>`;
  area.appendChild(baris);
  area.scrollTop = area.scrollHeight;
}

/** Hapus indikator mengetik */
function hapusIndikatorMengetik() {
  document.getElementById('indikatorMengetik')?.remove();
}

/**
 * Isi template placeholder {nama}, {perusahaan}, {posisi} dengan data profil pengguna.
 * Nilai profil di-escape menggunakan escapeHtml() sebelum disisipkan ke dalam teks
 * untuk mencegah XSS jika data profil mengandung karakter HTML berbahaya.
 * @param {string} teks - Teks respons dengan placeholder
 * @returns {string}
 */
function isiTemplateProfil(teks) {
  // Baca nama dari profilSaatIni.nama jika ada (sudah diperbarui lewat edit profil),
  // lalu fallback ke penggunaSaatIni.nama (dari data akun), lalu default.
  const namaRaw       = profilSaatIni?.nama || penggunaSaatIni?.nama || 'kamu';
  const nama          = escapeHtml(namaRaw.split(' ')[0]);
  const perusahaan    = escapeHtml(profilSaatIni?.perusahaan || 'perusahaanmu');
  const posisi        = escapeHtml(profilSaatIni?.posisi || 'intern');
  return teks
    .replace(/\{nama\}/g, nama)
    .replace(/\{perusahaan\}/g, perusahaan)
    .replace(/\{posisi\}/g, posisi);
}

/**
 * Tampilkan chip saran lanjutan di bawah area chat.
 * @param {string} topik - Kunci topik dari SARAN_LANJUTAN
 */
function tampilkanSaranLanjutan(topik) {
  const area = document.getElementById('saranLanjutan');
  if (!area) return;
  const daftar = SARAN_LANJUTAN[topik] || SARAN_LANJUTAN.default;
  area.innerHTML = daftar.map(([label, pesan]) =>
    `<button class="tombol-saran" data-pesan="${escapeHtml(pesan)}">${escapeHtml(label)}</button>`
  ).join('');
  area.classList.remove('hidden');

  // Pasang event listener ke chip yang baru dibuat
  area.querySelectorAll('.tombol-saran').forEach(t => {
    t.addEventListener('click', () => {
      document.getElementById('inputChat').value = t.dataset.pesan;
      document.getElementById('formChat').dispatchEvent(new Event('submit'));
      area.classList.add('hidden');
    });
  });
}

/**
 * Tentukan respons bot berdasarkan kata kunci dan konteks profil pengguna.
 * Mengisi template placeholder dengan data profil, mencatat topik ke riwayat.
 * @param {string} pesan
 * @returns {{ teks: string, topik: string }}
 */
function dapatkanResponsBot(pesan) {
  const p = pesan.toLowerCase();
  let topik = 'default';
  let teks;

  if (p.includes('feedback') || p.includes('umpan balik') || p.includes('masukan'))
    { topik = 'feedback'; teks = RESPONS_ASISTEN.feedback; }
  else if (p.includes('hari pertama') || p.includes('mulai magang') || p.includes('pertama kali magang'))
    { topik = 'haripertama'; teks = RESPONS_ASISTEN.haripertama; }
  else if ((p.includes('email') || p.includes('surat')) && (p.includes('mentor') || p.includes('supervisor')))
    { topik = 'emailmentor'; teks = RESPONS_ASISTEN.emailmentor; }
  else if (p.includes('email') || p.includes('surat elektronik'))
    { topik = 'email'; teks = RESPONS_ASISTEN.email; }
  else if (p.includes('mentor') || p.includes('supervisor') || p.includes('atasan') || p.includes('pembimbing'))
    { topik = 'mentor'; teks = RESPONS_ASISTEN.mentor; }
  else if (p.includes('kewalahan') || p.includes('stres') || p.includes('cemas') || p.includes('overwhelm') || p.includes('burnout') || p.includes('lelah'))
    { topik = 'kewalahan'; teks = RESPONS_ASISTEN.kewalahan; }
  else if (p.includes('git') || p.includes('github') || p.includes('version control') || p.includes('commit') || p.includes('branch'))
    { topik = 'git'; teks = RESPONS_ASISTEN.git; }
  else if (p.includes('linkedin') || p.includes('linked in'))
    { topik = 'linkedin'; teks = RESPONS_ASISTEN.linkedin; }
  else if (p.includes(' cv') || p.includes('resume') || p.includes('curriculum vitae') || p.includes('portofolio'))
    { topik = 'cv'; teks = RESPONS_ASISTEN.cv; }
  else if (p.includes('presentasi') || p.includes('presentasi') || p.includes('slide') || p.includes('demo'))
    { topik = 'presentasi'; teks = RESPONS_ASISTEN.presentasi; }
  else if (p.includes('networking') || p.includes('jaringan') || p.includes('koneksi') || p.includes('relasi'))
    { topik = 'networking'; teks = RESPONS_ASISTEN.networking; }
  else if (p.includes('deadline') || p.includes('batas waktu') || p.includes('tenggat'))
    { topik = 'deadline'; teks = RESPONS_ASISTEN.deadline; }
  else if (p.includes('perkenalan') || p.includes('kenalan') || p.includes('perkenalkan diri') || p.includes('introduce'))
    { topik = 'perkenalan'; teks = RESPONS_ASISTEN.perkenalan; }
  else if (p.includes('tugas') || p.includes('pekerjaan') || p.includes('kerjaan') || p.includes('task') || p.includes('ticket'))
    { topik = 'tugas'; teks = RESPONS_ASISTEN.tugas; }
  else {
    const def = RESPONS_ASISTEN.default;
    teks = def[Math.floor(Math.random() * def.length)];
  }

  // Catat topik ke riwayat (maks 3 terakhir, hindari duplikat berurutan)
  if (riwayatTopik[riwayatTopik.length - 1] !== topik) {
    riwayatTopik.push(topik);
    if (riwayatTopik.length > 3) riwayatTopik.shift();
  }

  return { teks: isiTemplateProfil(teks), topik };
}

// Form chat
document.getElementById('formChat').addEventListener('submit', e => {
  e.preventDefault();
  const input = document.getElementById('inputChat');
  const pesan = input.value.trim();
  if (!pesan) return;
  input.value = '';

  // Sembunyikan panel awal dan saran lanjutan saat mengirim pesan baru
  document.getElementById('pertanyaanCepat').style.display = 'none';
  document.getElementById('saranLanjutan').classList.add('hidden');

  tambahPesanPengguna(pesan);
  tampilkanIndikatorMengetik();
  setTimeout(() => {
    hapusIndikatorMengetik();
    const { teks, topik } = dapatkanResponsBot(pesan);
    tambahPesanBot(teks);
    tampilkanSaranLanjutan(topik);
  }, 800 + Math.random() * 700);
});

// Tombol pertanyaan cepat — sembunyikan panel saat salah satu diklik
document.querySelectorAll('.tombol-cepat').forEach(t => {
  t.addEventListener('click', () => {
    document.getElementById('inputChat').value = t.dataset.pesan;
    document.getElementById('formChat').dispatchEvent(new Event('submit'));
    document.getElementById('pertanyaanCepat').style.display = 'none';
  });
});

/* ================================================================
   REFLEKSI HARIAN
   ================================================================ */

/**
 * Render daftar riwayat refleksi dari terbaru ke terlama.
 */
function renderDaftarRefleksi() {
  const kontainer = document.getElementById('daftarRefleksi');
  if (!kontainer) return;

  if (dataRefleksi.length === 0) {
    kontainer.innerHTML = `<p class="text-sm text-slate-400 text-center py-6">Belum ada refleksi. Mulailah catat hari ini! 📝</p>`;
    return;
  }

  kontainer.innerHTML = [...dataRefleksi].reverse().map(r => `
    <div class="entri-refleksi">
      <div class="flex items-center justify-between mb-1">
        <span class="tanggal-refleksi">${escapeHtml(r.tanggal)}</span>
        <span title="Suasana hati">${r.mood}</span>
      </div>
      <p class="teks-refleksi"><strong>Dipelajari:</strong> ${escapeHtml(r.belajar)}</p>
      ${r.baik    ? `<p class="teks-refleksi"><strong>Berjalan baik:</strong> ${escapeHtml(r.baik)}</p>`    : ''}
      ${r.kendala ? `<p class="teks-refleksi"><strong>Kendala:</strong> ${escapeHtml(r.kendala)}</p>`       : ''}
      ${r.target  ? `<p class="teks-refleksi"><strong>Rencana besok:</strong> ${escapeHtml(r.target)}</p>` : ''}
    </div>`).join('');
}

// Pemilih mood
document.querySelectorAll('.tombol-mood').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.tombol-mood').forEach(b => b.classList.remove('terpilih'));
    t.classList.add('terpilih');
    moodTerpilih = t.dataset.mood;
  });
});

// Submit refleksi
document.getElementById('formRefleksi').addEventListener('submit', e => {
  e.preventDefault();
  const belajar = document.getElementById('rf-belajar').value.trim();
  const baik    = document.getElementById('rf-baik').value.trim();
  const kendala = document.getElementById('rf-kendala').value.trim();
  const target  = document.getElementById('rf-target').value.trim();

  if (!belajar) {
    tampilkanToast("⚠️ Isi kolom 'Apa yang kamu pelajari' dulu, ya.");
    document.getElementById('rf-belajar').focus();
    return;
  }

  dataRefleksi.push({
    tanggal: formatTanggalSingkat(),
    mood:    moodTerpilih || '😊',
    belajar, baik, kendala, target
  });

  simpanLokal(KUNCI.REFLEKSI(penggunaSaatIni.email), dataRefleksi);
  e.target.reset();
  moodTerpilih = '';
  document.querySelectorAll('.tombol-mood').forEach(t => t.classList.remove('terpilih'));
  renderDaftarRefleksi();
  tampilkanToast('📝 Refleksi berhasil disimpan!');
});

/* ================================================================
   PELACAKAN PROGRES
   ================================================================ */

/**
 * Render seluruh tampilan pelacakan progres.
 */
function renderProgres() {
  const selesai     = dataChecklist.filter(i => i.selesai).length;
  const total       = dataChecklist.length;
  const pChecklist  = total ? Math.round((selesai / total) * 100) : 0;
  const pPanduan    = Math.round((panduanDibaca.length / DATA_PANDUAN.length) * 100);

  // Lingkaran radial
  updateLingkaran('lingkaranChecklist', 'labelLingkaranChecklist', pChecklist, '%');
  updateLingkaran('lingkaranPanduan',   'labelLingkaranPanduan',   pPanduan,   '%');

  // Refleksi — tampilkan jumlah (bukan persen)
  const elRefLing = document.getElementById('lingkaranRefleksi');
  const elRefLbl  = document.getElementById('labelLingkaranRefleksi');
  const pRefleksi = Math.min(100, dataRefleksi.length * 10); // 10 refleksi = 100%
  if (elRefLing) elRefLing.style.strokeDasharray = `${pRefleksi} ${100 - pRefleksi}`;
  if (elRefLbl)  elRefLbl.textContent = String(dataRefleksi.length);

  // Grafik mingguan
  renderGrafikMingguan();
  renderProgresKategori();
}

/**
 * Update lingkaran SVG radial.
 * @param {string} idLingkaran
 * @param {string} idLabel
 * @param {number} nilai
 * @param {string} satuan
 */
function updateLingkaran(idLingkaran, idLabel, nilai, satuan) {
  const el    = document.getElementById(idLingkaran);
  const label = document.getElementById(idLabel);
  if (el)    el.style.strokeDasharray    = `${nilai} ${100 - nilai}`;
  if (label) label.textContent           = nilai + satuan;
}

/**
 * Render grafik batang mingguan.
 * ⚠️ Catatan: Visualisasi ini bersifat SIMULATIF dan INDIKATIF — bukan data aktivitas
 * aktual berbasis timestamp. Grafik merepresentasikan estimasi distribusi berdasarkan
 * jumlah tugas yang sudah selesai, bukan kapan tepatnya tugas diselesaikan.
 */
function renderGrafikMingguan() {
  const kontainer = document.getElementById('grafikMingguan');
  if (!kontainer) return;

  // Estimasi distribusi simulatif berdasarkan jumlah tugas selesai saat ini.
  // Tidak merepresentasikan waktu penyelesaian yang sesungguhnya.
  const selesai = dataChecklist.filter(i => i.selesai).length;
  const mingguData = [
    { label: 'M1', persen: Math.min(100, selesai > 0 ? 40 : 0) },
    { label: 'M2', persen: Math.min(100, selesai > 3 ? 65 : selesai > 0 ? 30 : 0) },
    { label: 'M3', persen: 0 }, { label: 'M4', persen: 0 },
    { label: 'M5', persen: 0 }, { label: 'M6', persen: 0 },
  ];

  // Render batang grafik
  kontainer.innerHTML = mingguData.map(m => `
    <div class="kolom-batang">
      <div class="batang-chart ${m.persen > 0 ? 'bg-primer' : 'bg-slate-200'}" style="height:${m.persen || 4}%"
           role="img" aria-label="${m.label}: ${m.persen}%"></div>
      <span class="label-batang">${m.label}</span>
    </div>`).join('');

  // Tambahkan label keterangan simulatif di bawah grafik (jika belum ada)
  const kontainerInduk = kontainer.closest('.kartu');
  if (kontainerInduk && !kontainerInduk.querySelector('.ket-simulatif')) {
    const ket = document.createElement('p');
    ket.className = 'ket-simulatif';
    ket.textContent = '⚠️ Visualisasi bersifat simulatif — bukan data aktivitas aktual.';
    kontainerInduk.appendChild(ket);
  }
}

/** Render bar progres per kategori */
function renderProgresKategori() {
  const kontainer = document.getElementById('progresKategori');
  if (!kontainer) return;

  const warnaKat = {
    'Persiapan': '#2563EB', 'Setup': '#7C3AED',
    'Hari Pertama': '#059669', 'Minggu Pertama': '#F97316', 'Berkelanjutan': '#EF4444'
  };

  const kategori = [...new Set(dataChecklist.map(i => i.kategori))];

  kontainer.innerHTML = kategori.map(kat => {
    const items   = dataChecklist.filter(i => i.kategori === kat);
    const selesai = items.filter(i => i.selesai).length;
    const persen  = items.length ? Math.round((selesai / items.length) * 100) : 0;
    const warna   = warnaKat[kat] || '#2563EB';

    return `
      <div>
        <div class="header-kategori">
          <span class="nama-kategori">${escapeHtml(kat)}</span>
          <span class="persen-kategori">${persen}%</span>
        </div>
        <div class="trek-kategori">
          <div class="isi-kategori" style="background:${warna};width:${persen}%"></div>
        </div>
      </div>`;
  }).join('');
}

/* ================================================================
   INISIALISASI APLIKASI
   ================================================================ */

/**
 * Titik masuk aplikasi — cek sesi, tampilkan layar yang sesuai.
 */
function inisiasiAplikasi() {
  // Buat akun demo jika belum ada
  inisiasiAkunDemo();

  if (cekSesiAktif()) {
    // Ada sesi aktif
    if (!profilSaatIni || !profilSaatIni.sudahLengkap) {
      tampilkanLayarProfil();
    } else {
      masukKeAplikasi();
    }
  } else {
    // Belum login — tampilkan halaman login
    tampilkanLayar('layar-login');
  }
}

// Mulai!
inisiasiAplikasi();
