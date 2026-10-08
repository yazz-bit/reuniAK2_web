import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Heart, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  Users, 
  Share2, 
  ExternalLink, 
  MessageSquare, 
  Wand2, 
  RefreshCw, 
  ChevronDown, 
  Volume2, 
  VolumeX,
  Award,
  Shirt,
  Copy,
  Check
} from 'lucide-react';

const EVENT_DATE = new Date('2026-10-11T10:30:00').getTime();

const INITIAL_WISHLIST = [
  {
    id: 1,
    name: "Ana Novita Dewi",
    attendance: "Hadir",
    message: "Tak terasa sudah 7 tahun berlalu. Rindu bercengkerama dan mengingat kembali tawa manis di sudut sekolah. Sampai jumpa kawan semua!",
    timestamp: "10 menit yang lalu",
    likes: 12,
    isAiEnhanced: true,
    avatarColor: "bg-amber-100 text-amber-800 border-amber-300"
  },
  {
    id: 2,
    name: "Nadia Putri",
    attendance: "Hadir",
    message: "Semoga acara reuni ini membawa keberkahan dan mempererat tali silaturahmi kita yang sempat renggang oleh waktu.",
    timestamp: "1 jam yang lalu",
    likes: 8,
    isAiEnhanced: false,
    avatarColor: "bg-emerald-100 text-emerald-800 border-emerald-300"
  },
  {
    id: 3,
    name: "Dito & Keluarga",
    attendance: "Hadir",
    message: "Jarak bukan alasan untuk tidak bersua. Bersiap melangkah kembali menyusuri kenangan masa putih abu-abu!",
    timestamp: "3 jam yang lalu",
    likes: 15,
    isAiEnhanced: true,
    avatarColor: "bg-stone-200 text-stone-800 border-stone-300"
  }
];

const RUNDOWN = [
  { time: "09.00 - 09.30", title: "Registrasi & Welcoming Drink", desc: "Penyambutan tamu, pembagian souvenir & ramah tamah awal." },
  { time: "09.30 - 10.30", title: "Pembukaan & Nostalgia Slidedeck", desc: "Mengenang perjalanan 15 tahun melalui kilas balik sinematik." },
  { time: "10.30 - 12.00", title: "Gala Lunch & Acoustic Session", desc: "Santap siang bersama diiringi alunan musik favorit masa sekolah." },
  { time: "12.00 - 14.00", title: "Sesi Foto Bersama & Tukar Kado", desc: "Merekam kebersamaan abadi dan pembagian doorprize menarik." }
];

async function enhanceGreetingWithGemini(originalText) {
  const apiKey = "";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

  const systemPrompt = "Anda adalah seorang sastrawan ahli bahasa Indonesia yang hangat, puitis, dan penuh nostalgia. Tugas Anda adalah memperindah dan memparafrase ucapan selamat/doa untuk reuni sekolah dari seorang alumni. Buat kalimatnya terdengar sangat hangat, elegan, santun, puitis, dan berkesan, tanpa mengubah makna asli. Hanya berikan hasil teks ucapannya langsung tanpa tanda kutip, tanpa kalimat pembuka atau penutup.";
  
  const userQuery = `Perindah ucapan reuni berikut agar lebih hangat dan puitis:\n"${originalText}"`;

  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] }
  };

  let delay = 1000;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const candidateText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (candidateText) {
        return candidateText.trim();
      }
      throw new Error("Format respons tidak sesuai.");
    } catch (err) {
      if (attempt === 2) throw err;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
}

export default function App() {
  // Navigation & UI States
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  
  // Countdown State
  const [timeLeft, setTimeLeft] = useState({ days: 3, hours: 10, minutes: 55, seconds: 54 });

  // RSVP Form States
  const [rsvpName, setRsvpName] = useState("");
  const [rsvpAttendance, setRsvpAttendance] = useState("Hadir");
  const [rsvpCount, setRsvpCount] = useState("1");
  const [rsvpMessage, setRsvpMessage] = useState("");

  // Wishlist States
  const [wishlist, setWishlist] = useState(INITIAL_WISHLIST);
  const [isAiPolishing, setIsAiPolishing] = useState(false);
  const [aiEnhancedPreview, setAiEnhancedPreview] = useState("");
  const [isAiApplied, setIsAiApplied] = useState(false);
  const [stats, setStats] = useState({ hadir: 0, ragu: 0, tidakHadir: 0 });

  // Countdown Interval logic
  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const difference = EVENT_DATE - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleAiPolish = async () => {
    if (!rsvpMessage.trim()) {
      showToast("Ketikkan ucapan dasar Anda terlebih dahulu.");
      return;
    }

    setIsAiPolishing(true);
    try {
      const enhancedText = await enhanceGreetingWithGemini(rsvpMessage);
      setAiEnhancedPreview(enhancedText);
      setIsAiApplied(true);
      showToast("✨ Teks ucapan berhasil diperindah oleh AI!");
    } catch (error) {
      console.error(error);
      showToast("Gagal terhubung dengan layanan AI. Silakan coba lagi.");
    } finally {
      setIsAiPolishing(false);
    }
  };

  const handleSubmitRsvp = (e) => {
    e.preventDefault();
    if (!rsvpName.trim()) {
      showToast("Silakan isi nama Anda.");
      return;
    }

    const finalMessage = isAiApplied && aiEnhancedPreview ? aiEnhancedPreview : rsvpMessage;

    // Update Attendance Stats
    if (rsvpAttendance === "Hadir") {
      setStats(prev => ({ ...prev, hadir: prev.hadir + parseInt(rsvpCount || "1", 10) }));
    } else if (rsvpAttendance === "Ragu-ragu") {
      setStats(prev => ({ ...prev, ragu: prev.ragu + 1 }));
    } else {
      setStats(prev => ({ ...prev, tidakHadir: prev.tidakHadir + 1 }));
    }

    // Add to Wishlist if there's a message
    if (finalMessage.trim()) {
      const colors = [
        "bg-amber-100 text-amber-800 border-amber-300",
        "bg-emerald-100 text-emerald-800 border-emerald-300",
        "bg-stone-200 text-stone-800 border-stone-300",
        "bg-rose-100 text-rose-800 border-rose-300"
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const newWish = {
        id: Date.now(),
        name: rsvpName,
        attendance: rsvpAttendance,
        message: finalMessage,
        timestamp: "Baru saja",
        likes: 0,
        isAiEnhanced: isAiApplied,
        avatarColor: randomColor
      };

      setWishlist([newWish, ...wishlist]);
    }

    showToast("Terima kasih! Konfirmasi kehadiran Anda telah tersimpan.");
    
    // Reset inputs
    setRsvpName("");
    setRsvpMessage("");
    setAiEnhancedPreview("");
    setIsAiApplied(false);
  };

  const handleLikeWish = (id) => {
    setWishlist(wishlist.map(item => {
      if (item.id === id) {
        return { ...item, likes: item.likes + 1 };
      }
      return item;
    }));
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    showToast("Tautan undangan berhasil disalin!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans antialiased selection:bg-amber-200 selection:text-amber-900">
      
      {}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-stone-900 text-stone-100 px-5 py-3.5 rounded-full shadow-2xl border border-amber-500/30 text-sm animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        <button 
          onClick={handleShare}
          title="Bagikan Undangan"
          className="p-3.5 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-stone-200 text-stone-700 hover:text-amber-700 hover:border-amber-400 transition-all active:scale-95"
        >
          {copiedLink ? <Check className="w-5 h-5 text-emerald-600" /> : <Share2 className="w-5 h-5" />}
        </button>
      </div>

      {}
      <section className="relative min-h-screen flex flex-col justify-between items-center text-center px-4 py-16 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-50 via-stone-50 to-stone-100">
        
        {/* Subtle Decorative Background Rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-stone-300/20 rounded-full blur-2xl pointer-events-none" />

        <div className="z-10 max-w-3xl mx-auto space-y-6 pt-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/80 border border-amber-300/60 text-amber-900 text-xs tracking-widest uppercase font-medium shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" /> Undangan Reuni Akuntansi 2
          </div>

          <h1 className="text-4xl md:text-6xl font-serif font-light text-stone-900 tracking-tight leading-tight">
            Kembali Menyapa, <br />
            <span className="italic font-normal text-amber-800">Merajut Kenangan Indah</span>
          </h1>

          <p className="text-base md:text-lg text-stone-600 max-w-xl mx-auto font-light leading-relaxed">
            Waktu berlalu, perjalanan telah membawa kita melangkah jauh. Mari sejenak berhenti, kembali bersua, dan mengukir kisah hangat bersama para sahabat tercinta.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-stone-700">
            <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-lg border border-stone-200 shadow-sm">
              <Calendar className="w-4 h-4 text-amber-700" />
              <span>Minggu, 11 Oktober 2026</span>
            </div>
            <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-lg border border-stone-200 shadow-sm">
              <MapPin className="w-4 h-4 text-amber-700" />
              <span>Landscape Lopi, Cepoko</span>
            </div>
          </div>

          <div className="pt-6 flex flex-wrap justify-center gap-4">
            <a 
              href="#rsvp-section"
              className="px-8 py-3.5 bg-amber-800 hover:bg-amber-900 text-amber-50 rounded-full font-medium shadow-lg shadow-amber-900/10 transition-all hover:shadow-amber-900/20 active:scale-95"
            >
              Konfirmasi Kehadiran
            </a>
            <a 
              href="#detail-section"
              className="px-8 py-3.5 bg-white/80 hover:bg-white text-stone-800 rounded-full font-medium border border-stone-300 transition-all shadow-sm hover:border-amber-400 active:scale-95"
            >
              Lihat Detail Acara
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="z-10 pt-12 animate-bounce">
          <a href="#countdown-section" aria-label="Scroll Down" className="p-2 text-stone-400 hover:text-amber-800 transition-colors">
            <ChevronDown className="w-6 h-6" />
          </a>
        </div>
      </section>

      {}
      <section id="countdown-section" className="py-20 px-4 bg-stone-900 text-stone-100 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-10 relative z-10">
          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-serif font-light tracking-wide text-amber-200">
              Menghitung Hari Menuju Hari Bahagia
            </h2>
            <p className="text-stone-400 text-sm max-w-md mx-auto">
              Setiap detik semakin mendekatkan kita pada momen nostalgia penuh tawa dan kehangatan.
            </p>
          </div>

          {/* Countdown Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-3xl mx-auto">
            {[
              { label: "HARI", value: timeLeft.days },
              { label: "JAM", value: timeLeft.hours },
              { label: "MENIT", value: timeLeft.minutes },
              { label: "DETIK", value: timeLeft.seconds }
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="bg-stone-800/80 border border-stone-700/60 rounded-2xl p-6 flex flex-col items-center justify-center shadow-inner backdrop-blur-md"
              >
                <span className="text-4xl md:text-5xl font-serif font-semibold text-amber-400 tracking-tight">
                  {String(item.value).padStart(2, '0')}
                </span>
                <span className="text-xs tracking-widest text-stone-400 mt-2 font-medium">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 flex items-center justify-center gap-6 text-xs text-stone-400">
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-amber-400" /> {stats.hadir} Alumni Akan Hadir</span>
            <span>•</span>
            <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-rose-400" /> Ramah Tamah & Galang Kenangan</span>
          </div>
        </div>
      </section>

      {}
      <section id="detail-section" className="py-24 px-4 bg-stone-50 max-w-5xl mx-auto space-y-16">
        
        {/* Section Title */}
        <div className="text-center space-y-3">
          <span className="text-amber-800 text-xs tracking-widest uppercase font-semibold">Informasi Pelaksanaan</span>
          <h2 className="text-3xl md:text-4xl font-serif text-stone-900">Waktu & Lokasi Acara</h2>
          <div className="w-12 h-0.5 bg-amber-600 mx-auto rounded-full" />
        </div>

        {/* Location & Time Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Card 1: Time & Venue */}
          <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-800">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-serif text-stone-900 font-medium">Hari & Tanggal</h3>
              <p className="text-stone-600 mt-1">Minggu, 11 Oktober 2026</p>
              <p className="text-sm text-stone-500 mt-0.5">Pukul 10.00 WIB - Selesai</p>
            </div>
            <div className="border-t border-stone-100 pt-4">
              <h4 className="text-sm font-semibold text-stone-800">Lokasi Acara</h4>
              <p className="text-stone-600 text-sm mt-1 font-medium">Landscape Kopi</p>
              <p className="text-stone-500 text-sm">Cepoko</p>
            </div>
            <div className="pt-2 flex gap-3">
              <a 
                href="https://maps.google.com" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-stone-100 rounded-xl text-sm font-medium hover:bg-amber-800 transition-colors"
              >
                <MapPin className="w-4 h-4" /> Buka Google Maps
              </a>
            </div>
          </div>

          {/* Card 2: Dresscode & Info */}
          <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-800">
              <Shirt className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-serif text-stone-900 font-medium">Dress Code</h3>
              <p className="text-stone-600 mt-1 font-medium">Smart Casual with Touch of Gold / Earthy Tone</p>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Silakan kenakan pakaian bebas rapi dan nyaman.
              </p>
            </div>
            <div className="border-t border-stone-100 pt-4 space-y-2">
              <h4 className="text-sm font-semibold text-stone-800">Catatan Khusus</h4>
              <ul className="text-xs text-stone-500 space-y-1.5 list-disc list-inside">
                <li>Harap mengonfirmasi kehadiran melalui formulir RSVP di bawah.</li>
                <li>Disediakan photo booth kenangan khusus alumni.</li>
                <li>Membawa kado silang  (Opsional).</li>
              </ul>
            </div>
          </div>

        </div>

      </section>

      {/* RSVP Section */}
      <section id="rsvp-section" className="py-20 px-4 bg-stone-100/70 border-t border-b border-stone-200">
        <div className="max-w-3xl mx-auto space-y-10">
          
          <div className="text-center space-y-3">
            <span className="text-amber-800 text-xs tracking-widest uppercase font-semibold">Konfirmasi & Ucapan</span>
            <h2 className="text-3xl md:text-4xl font-serif text-stone-900">Formulir Kehadiran Alumni</h2>
            <p className="text-stone-600 text-sm max-w-lg mx-auto">
              Bantu panitia mempersiapkan tempat & konsumsi terbaik dengan mengisi kepastian kehadiran Anda.
            </p>
          </div>

          <form onSubmit={handleSubmitRsvp} className="bg-white p-8 md:p-10 rounded-3xl border border-stone-200 shadow-md space-y-6">
            
            {/* Input Nama */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Nama Lengkap & Angkatan</label>
              <input 
                type="text"
                required
                placeholder="Contoh: Dewi lestari (AK 2)"
                value={rsvpName}
                onChange={(e) => setRsvpName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600 transition-all text-sm"
              />
            </div>

            {/* Attendance Radio Selection */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "Hadir", label: "Ya, Hadir", color: "peer-checked:bg-emerald-50 peer-checked:border-emerald-600 peer-checked:text-emerald-900" },
                { id: "Ragu-ragu", label: "Masih Ragu", color: "peer-checked:bg-amber-50 peer-checked:border-amber-600 peer-checked:text-amber-900" },
                { id: "Tidak Hadir", label: "Maaf, Berhalangan", color: "peer-checked:bg-stone-100 peer-checked:border-stone-500 peer-checked:text-stone-800" }
              ].map((option) => (
                <label key={option.id} className="cursor-pointer">
                  <input 
                    type="radio" 
                    name="attendance" 
                    value={option.id}
                    checked={rsvpAttendance === option.id}
                    onChange={(e) => setRsvpAttendance(e.target.value)}
                    className="peer hidden"
                  />
                  <div className={`p-3 text-center border border-stone-200 rounded-xl text-xs font-medium text-stone-600 transition-all hover:bg-stone-50 ${option.color}`}>
                    {option.label}
                  </div>
                </label>
              ))}
            </div>

            {/* Number of Guests */}
            {rsvpAttendance === "Hadir" && (
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Jumlah Tamu yang Ikut (+Pasangan/Anak)</label>
                <select 
                  value={rsvpCount}
                  onChange={(e) => setRsvpCount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600 transition-all text-sm"
                >
                  <option value="1">1 Orang (Sendiri)</option>
                  <option value="2">2 Orang (+1 Pasangan)</option>
                  <option value="3">3 Orang (+Keluarga)</option>
                  <option value="4">4 Orang atau lebih</option>
                </select>
              </div>
            )}

            {/* Message / Wish Area with AI Assistant */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-stone-700">Pesan, Doa & Kenangan (Wishlist)</label>
                
                {/* AI Feature Action Button */}
                <button
                  type="button"
                  onClick={handleAiPolish}
                  disabled={isAiPolishing || !rsvpMessage.trim()}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isAiPolishing || !rsvpMessage.trim()
                      ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-amber-700 to-amber-900 text-amber-50 hover:opacity-90 shadow-sm active:scale-95"
                  }`}
                >
                  {isAiPolishing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Memperindah Bahasa...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5" /> Perindah Bahasa (AI)
                    </>
                  )}
                </button>
              </div>

              <textarea 
                rows="3"
                placeholder="Tuliskan ucapan atau kenangan singkat yang ingin disampaikan..."
                value={isAiApplied && aiEnhancedPreview ? aiEnhancedPreview : rsvpMessage}
                onChange={(e) => {
                  setRsvpMessage(e.target.value);
                  if (isAiApplied) setIsAiApplied(false);
                }}
                className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600 transition-all text-sm leading-relaxed"
              />

              {/* AI Refined Preview Box */}
              {isAiApplied && aiEnhancedPreview && (
                <div className="p-4 bg-amber-50/90 border border-amber-300/80 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between text-amber-900 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-700" /> Hasil Bahasa Puitis AI:
                    </span>
                    <button 
                      type="button"
                      onClick={() => {
                        setIsAiApplied(false);
                        setAiEnhancedPreview("");
                      }}
                      className="text-stone-500 hover:text-stone-800 underline text-[11px]"
                    >
                      Kembalikan Teks Asli
                    </button>
                  </div>
                  <p className="italic text-stone-800 leading-relaxed font-serif text-sm">
                    "{aiEnhancedPreview}"
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-medium shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Kirim Konfirmasi & Ucapan
            </button>

          </form>

        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-stone-900 text-stone-400 text-center text-xs space-y-4 border-t border-stone-800">
        <p className="font-serif text-amber-200/80 text-sm">SMKN 1 BLADO — Angkatan 2019</p>
        <p className="max-w-md mx-auto text-stone-500 leading-relaxed">
          Sampai jumpa di hari bahagia. Mari kenang masa lalu, nikmati masa kini, dan sambut masa depan bersama.
        </p>
        <div className="pt-4 text-stone-600 text-[11px]">
          © 2026 Fayy Design
        </div>
      </footer>

    </div>
  );
}