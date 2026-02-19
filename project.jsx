import { useState, useEffect, useCallback, useRef } from "react";

// ─── COLOR TOKENS ──────────────────────────────────────────────────────────────
// Off-white parchment + rich gold palette
const C = {
  bg: "#FAF6EE",   // warm parchment page
  surface: "#FFFDF7",   // card white
  header: "#FDF9F0",   // header strip
  border: "rgba(180,140,60,0.18)",  // gold-tinted borders
  borderStrong: "rgba(180,140,60,0.38)",
  gold: "#B8860B",   // primary gold — readable on light
  goldLight: "#C9A84C",   // accent gold
  goldPale: "rgba(201,168,76,0.12)",  // tinted fill
  goldPalest: "rgba(201,168,76,0.06)",
  ink: "#2C1F0E",   // deep warm brown — headings
  body: "#4A3520",   // body text
  muted: "#8A6E50",   // secondary text
  faint: "#C4AB90",   // placeholder/subtle
  ghost: "#E8DFD0",   // decorative dividers
  green: "#2D7A52",   // completed / success
  greenBg: "rgba(45,122,82,0.07)",
  greenBorder: "rgba(45,122,82,0.22)",
  red: "#C0392B",
  shadow: "0 2px 12px rgba(140,100,40,0.08)",
  shadowMd: "0 4px 24px rgba(140,100,40,0.12)",
};

// ─── DATA ─────────────────────────────────────────────────────────────────────
const VERSES = [
  { arabic: "شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ", translation: "The month of Ramadan in which was revealed the Quran", ref: "Al-Baqarah 2:185" },
  { arabic: "وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ", translation: "When My servants ask about Me, I am near", ref: "Al-Baqarah 2:186" },
  { arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", translation: "Indeed, with hardship comes ease", ref: "Ash-Sharh 94:6" },
  { arabic: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا", translation: "Whoever fears Allah, He will make a way out for them", ref: "At-Talaq 65:2" },
  { arabic: "فَاذْكُرُونِي أَذْكُرْكُمْ", translation: "Remember Me, and I will remember you", ref: "Al-Baqarah 2:152" },
  { arabic: "رَبِّ زِدْنِي عِلْمًا", translation: "My Lord, increase me in knowledge", ref: "Ta-Ha 20:114" },
  { arabic: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", translation: "Indeed, Allah is with the patient", ref: "Al-Baqarah 2:153" },
];

const IBADAH_TASKS = [
  { id: "fajr", label: "Fajr Namaaz", rakah: "2 Sunnah · 2 Fardh", points: 15, category: "namaaz", icon: "dawn" },
  { id: "zuhr", label: "Zuhr Namaaz", rakah: "4 Sunnah · 4 Fardh · 2 Sunnah", points: 15, category: "namaaz", icon: "sun" },
  { id: "asr", label: "Asr Namaaz", rakah: "4 Sunnah · 4 Fardh", points: 15, category: "namaaz", icon: "cloud" },
  { id: "maghrib", label: "Maghrib Namaaz", rakah: "3 Fardh · 2 Sunnah", points: 15, category: "namaaz", icon: "sunset" },
  { id: "isha", label: "Isha Namaaz", rakah: "4 Sunnah · 4 Fardh · 2 Sunnah · Witr", points: 15, category: "namaaz", icon: "moon" },
  { id: "tahajjud", label: "Tahajjud", rakah: "min 2 · max 8 Rakah", points: 25, category: "namaaz", icon: "star" },
  { id: "taraweeh", label: "Taraweeh", rakah: "min 8 · max 20 Rakah after Isha", points: 20, category: "namaaz", icon: "mosque" },
  { id: "sehri", label: "Sehri", points: 10, category: "sunnah", icon: "bowl" },
  { id: "quran_para", label: "One Para Quran", points: 30, category: "quran", icon: "book" },
  { id: "quran_verse", label: "Learn One Verse", points: 20, category: "quran", icon: "quill" },
  { id: "hadith", label: "Read a Hadith", points: 15, category: "knowledge", icon: "scroll" },
  { id: "dua", label: "Morning & Evening Dua", points: 10, category: "dua", icon: "hands" },
];

const DEFAULT_ROLE_TASKS = {
  student: [
    { id: "study_2h", label: "Study 2 Hours", points: 20, icon: "study", category: "role" },
    { id: "revision", label: "Revise Yesterday's Notes", points: 15, icon: "refresh", category: "role" },
    { id: "no_social", label: "Screen-free Study Block", points: 10, icon: "phone", category: "role" },
    { id: "notes", label: "Organized Notes", points: 10, icon: "notes", category: "role" },
  ],
  professional: [
    { id: "deep_work", label: "3h Deep Work Session", points: 20, icon: "target", category: "role" },
    { id: "inbox", label: "Clear Priority Emails", points: 10, icon: "mail", category: "role" },
    { id: "no_overtime", label: "Leave on Time", points: 15, icon: "clock", category: "role" },
    { id: "gratitude", label: "Write 3 Gratitudes", points: 10, icon: "heart", category: "role" },
  ],
  general: [],
};

const ICON_COLORS = {
  namaaz: "#B8860B", quran: "#2D7A52", sunnah: "#C07020",
  knowledge: "#3A6EA8", dua: "#8B4DAB", role: "#2A6FAB",
};

const BADGES = [
  { id: "first_step", icon: "footprint", label: "First Step", desc: "Complete a perfect day", color: "#B8860B", condition: s => s.perfectDays >= 1 },
  { id: "blessed_3", icon: "flame", label: "Blessed Three", desc: "3-day perfect streak", color: "#C04A20", condition: s => s.maxStreak >= 3 },
  { id: "week_noor", icon: "sun_b", label: "Week of Noor", desc: "7-day perfect streak", color: "#B89020", condition: s => s.maxStreak >= 7 },
  { id: "first_ashra", icon: "crescent", label: "First Ashra", desc: "10 perfect days", color: "#2A6FAB", condition: s => s.perfectDays >= 10 },
  { id: "night_war", icon: "star_b", label: "Night Warrior", desc: "Tahajjud 7 days straight", color: "#6B44A8", condition: s => s.tahajjudStreak >= 7 },
  { id: "quran_hero", icon: "book_b", label: "Quran Hero", desc: "Para recitation 10 days straight", color: "#2D7A52", condition: s => s.quranStreak >= 10 },
  { id: "halfway", icon: "mosque_b", label: "Halfway There", desc: "15 days tracked", color: "#2A8080", condition: s => s.daysTracked >= 15 },
  { id: "champion", icon: "trophy", label: "Ramadan Champion", desc: "30 perfect days", color: "#B8860B", condition: s => s.perfectDays >= 30 },
  { id: "pts_500", icon: "gem", label: "500 Blessings", desc: "Earn 500 total points", color: "#2A6FAB", condition: s => s.totalPoints >= 500 },
  { id: "pts_1000", icon: "diamond", label: "1000 Blessings", desc: "Earn 1000 total points", color: "#8B4DAB", condition: s => s.totalPoints >= 1000 },
  { id: "five_pillars", icon: "pillar", label: "Five Pillars", desc: "All 5 prayers for 7 days", color: "#2D7A52", condition: s => s.allPrayersStreak >= 7 },
  { id: "taraweeh_champ", icon: "lamp", label: "Taraweeh Champion", desc: "Taraweeh 7 consecutive nights", color: "#C07020", condition: s => s.taraweehStreak >= 7 },
];

// ─── SVG ICONS ────────────────────────────────────────────────────────────────
function Icon({ name, size = 18, color = C.gold, style = {} }) {
  const s = { width: size, height: size, flexShrink: 0, ...style };
  const icons = {
    dawn: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><path d="M12 2v4M4.93 4.93l2.83 2.83M2 12h4M17.07 7.07l2.83-2.83M22 12h-4" /><path d="M5 19a7 7 0 0114 0" /><line x1="3" y1="19" x2="21" y2="19" /></svg>,
    sun: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>,
    cloud: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" /></svg>,
    sunset: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><path d="M17 18a5 5 0 0 0-10 0" /><line x1="12" y1="2" x2="12" y2="9" /><line x1="4.22" y1="10.22" x2="5.64" y2="11.64" /><line x1="1" y1="18" x2="3" y2="18" /><line x1="21" y1="18" x2="23" y2="18" /><line x1="18.36" y1="11.64" x2="19.78" y2="10.22" /><line x1="23" y1="22" x2="1" y2="22" /><polyline points="8 6 12 2 16 6" /></svg>,
    moon: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>,
    star: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
    mosque: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><path d="M3 21V10l9-7 9 7v11" /><path d="M12 3a2 2 0 0 0 0-2 2 2 0 0 1 0 2z" /><rect x="8" y="14" width="3" height="7" /><rect x="13" y="14" width="3" height="7" /><path d="M3 10h18" /></svg>,
    bowl: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10" /><path d="M2 12h20" /><path d="M12 2v10" /></svg>,
    book: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /><line x1="12" y1="6" x2="16" y2="6" /><line x1="12" y1="10" x2="16" y2="10" /></svg>,
    quill: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" /><line x1="16" y1="8" x2="2" y2="22" /><line x1="17.5" y1="15" x2="9" y2="15" /></svg>,
    scroll: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
    hands: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" /><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" /><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" /><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" /></svg>,
    study: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>,
    refresh: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>,
    phone: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>,
    notes: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
    target: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
    mail: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
    clock: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    heart: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
    footprint: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2 1 2 1" /><path d="M2 20s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2 1 2 1" /><path d="M9 8c0 1.1-.9 2-2 2S5 9.1 5 8s.9-4 2-4 2 2.9 2 4z" /><path d="M15 8c0 1.1-.9 2-2 2s-2-.9-2-2 .9-4 2-4 2 2.9 2 4z" /></svg>,
    flame: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" /></svg>,
    sun_b: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /></svg>,
    crescent: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>,
    star_b: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
    book_b: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>,
    mosque_b: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><path d="M3 21V10l9-7 9 7v11" /><path d="M3 10h18" /></svg>,
    trophy: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-2" /><rect x="6" y="18" width="12" height="4" /></svg>,
    gem: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><polyline points="6 3 2 9 12 22 22 9 18 3" /><polyline points="22 9 12 9 6 3" /><line x1="2" y1="9" x2="12" y2="9" /><line x1="12" y1="9" x2="12" y2="22" /></svg>,
    diamond: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><polygon points="12 2 22 9 18 22 6 22 2 9" /></svg>,
    pillar: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><rect x="4" y="2" width="4" height="20" /><rect x="10" y="2" width="4" height="20" /><rect x="16" y="2" width="4" height="20" /></svg>,
    lamp: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><path d="M12 2v4M6 6l1.5 1.5M18 6l-1.5 1.5M12 22v-2M8 20h8M10 18v-6a2 2 0 0 1 4 0v6" /><circle cx="12" cy="10" r="4" /></svg>,
    check: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...s}><polyline points="20 6 9 17 4 12" /></svg>,
    plus: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" {...s}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
    trash: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" {...s}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>,
    x: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" {...s}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  };
  return icons[name] || icons["star"];
}

// ─── SPLASH SCREEN (stays dark for cinematic contrast) ────────────────────────
function SplashScreen({ onDone }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const ripplesRef = useRef([]);
  const starsRef = useRef([]);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);

    starsRef.current = Array.from({ length: 180 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.2,
      alpha: Math.random() * 0.55 + 0.1,
      speed: Math.random() * 0.009 + 0.003,
      phase: Math.random() * Math.PI * 2,
    }));

    const cx = canvas.width / 2, cy = canvas.height / 2;
    ripplesRef.current = [
      { x: cx, y: cy, r: 0, maxR: Math.max(canvas.width, canvas.height) * 0.9, alpha: 0.65, speed: 1.9, delay: 0 },
      { x: cx, y: cy, r: 0, maxR: Math.max(canvas.width, canvas.height) * 0.7, alpha: 0.45, speed: 1.5, delay: 20 },
      { x: cx, y: cy, r: 0, maxR: Math.max(canvas.width, canvas.height) * 0.5, alpha: 0.3, speed: 1.2, delay: 40 },
    ];

    let frame = 0;
    const draw = () => {
      const { width: W, height: H } = canvas;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, W, H);

      // Rich warm dark bg
      const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.75);
      bg.addColorStop(0, "rgba(22,16,6,1)"); bg.addColorStop(0.5, "rgba(14,10,3,1)"); bg.addColorStop(1, "rgba(6,4,1,1)");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Golden glow centre
      const glow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.min(W, H) * 0.5);
      glow.addColorStop(0, "rgba(201,168,76,0.09)"); glow.addColorStop(0.6, "rgba(201,168,76,0.03)"); glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

      // Twinkling stars
      starsRef.current.forEach(s => {
        const a = s.alpha * (0.5 + 0.5 * Math.sin(frame * s.speed + s.phase));
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,240,195,${a})`; ctx.fill();
      });

      // Ripple rings
      ripplesRef.current.forEach(rip => {
        if (frame < rip.delay) return;
        rip.r += rip.speed;
        const progress = rip.r / rip.maxR;
        const a = rip.alpha * (1 - progress) * (1 - progress);
        if (a > 0.003) { ctx.beginPath(); ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2); ctx.strokeStyle = `rgba(201,168,76,${a})`; ctx.lineWidth = 1.5; ctx.stroke(); }
        if (rip.r >= rip.maxR) rip.r = 0;
      });

      // Rising gold dust
      if (frame % 4 === 0 && starsRef.current.length < 240) {
        starsRef.current.push({
          x: Math.random() * canvas.width, y: canvas.height + 5,
          r: Math.random() * 1.3 + 0.3, alpha: Math.random() * 0.35 + 0.08,
          speed: 0.001, phase: Math.random() * Math.PI * 2,
          vy: -(Math.random() * 0.45 + 0.12), vx: (Math.random() - 0.5) * 0.25, floating: true
        });
      }
      starsRef.current = starsRef.current.filter(s => {
        if (s.floating) { s.y += s.vy; s.x += (s.vx || 0); return s.y > -10; } return true;
      });
      frame++; animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("resize", resize); };
  }, []);

  useEffect(() => {
    const t = [setTimeout(() => setPhase(1), 400), setTimeout(() => setPhase(2), 1600), setTimeout(() => setPhase(3), 2700)];
    return () => t.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setPhase(4); setTimeout(onDone, 650); }, 5500);
    return () => clearTimeout(t);
  }, [onDone]);

  const skip = () => { setPhase(4); setTimeout(onDone, 550); };

  return (
    <div onClick={skip} style={{
      position: "fixed", inset: 0, zIndex: 9999, cursor: "pointer", userSelect: "none",
      opacity: phase === 4 ? 0 : 1, transition: phase === 4 ? "opacity 0.65s ease" : "none"
    }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />

      {/* Concentric decoration rings */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        {[300, 220, 148].map((sz, i) => (
          <div key={sz} style={{
            position: "absolute", width: sz, height: sz, borderRadius: "50%",
            border: "1px solid rgba(201,168,76,0.07)",
            opacity: phase >= 1 ? 1 : 0, transition: `opacity 1.5s ease ${i * 0.15}s`
          }} />
        ))}
      </div>

      {/* Crescent moon */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-62%)",
        opacity: phase >= 1 ? 1 : 0,
        transition: "opacity 1.2s ease 0.2s, transform 1.3s cubic-bezier(0.34,1.56,0.64,1) 0.2s",
        filter: "drop-shadow(0 0 22px rgba(201,168,76,0.4))"
      }}>
        <svg width={58} height={58} viewBox="0 0 24 24" fill="none">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="#C9A84C" strokeWidth="1.1" fill="rgba(201,168,76,0.09)" strokeLinecap="round" />
        </svg>
      </div>

      {/* Text block */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px", textAlign: "center" }}>
        {/* Arabic greeting */}
        <div style={{
          fontFamily: "Georgia,serif", fontSize: 40, color: "#C9A84C", letterSpacing: 3, lineHeight: 1.2, marginTop: 76, marginBottom: 10,
          opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 1s ease 0.1s, transform 1.1s cubic-bezier(0.16,1,0.3,1) 0.1s",
          textShadow: "0 0 50px rgba(201,168,76,0.45)"
        }}>
          السَّلاَمُ عَلَيْكُمْ
        </div>
        <div style={{
          fontFamily: "Georgia,serif", fontSize: 12, color: "rgba(201,168,76,0.5)", letterSpacing: 4.5, textTransform: "uppercase", marginBottom: 30,
          opacity: phase >= 1 ? 1 : 0, transition: "opacity 0.9s ease 0.5s"
        }}>
          Assalamualaikum
        </div>

        {/* Divider sweep */}
        <div style={{ width: phase >= 2 ? 90 : 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(201,168,76,0.6),transparent)", marginBottom: 26, transition: "width 1s cubic-bezier(0.16,1,0.3,1) 0.1s" }} />

        <div style={{
          fontFamily: "Georgia,serif", fontSize: 14, color: "rgba(232,223,208,0.45)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 9,
          opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? "translateY(0)" : "translateY(14px)",
          transition: "opacity 0.9s ease 0.05s, transform 0.9s cubic-bezier(0.16,1,0.3,1) 0.05s"
        }}>
          Welcome to
        </div>
        <div style={{
          fontFamily: "Georgia,serif", fontSize: 28, fontWeight: 700, color: "#F0E8D4", letterSpacing: 0.5, lineHeight: 1.2, marginBottom: 8,
          opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.9s ease 0.15s, transform 0.9s cubic-bezier(0.16,1,0.3,1) 0.15s"
        }}>
          Ramadan Tracker
        </div>

        {/* Year pill */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 18px", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 20, marginBottom: 48,
          opacity: phase >= 2 ? 1 : 0, transition: "opacity 0.9s ease 0.3s"
        }}>
          <span style={{ color: "#C9A84C", fontSize: 12, letterSpacing: 3, fontFamily: "Georgia,serif" }}>2026 · 1447 AH</span>
        </div>

        {/* Tap prompt */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 9,
          opacity: phase >= 3 ? 1 : 0, transition: "opacity 0.8s ease"
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.28)", display: "flex", alignItems: "center", justifyContent: "center",
            animation: phase >= 3 ? "splashPulse 2.2s ease infinite" : "none"
          }}>
            <div style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(201,168,76,0.75)" }} />
          </div>
          <span style={{ color: "rgba(201,168,76,0.3)", fontSize: 9, letterSpacing: 3, textTransform: "uppercase", fontFamily: "Georgia,serif" }}>Tap to begin</span>
        </div>
      </div>

      {/* Verse at foot */}
      <div style={{
        position: "absolute", bottom: 32, left: 0, right: 0, textAlign: "center", padding: "0 44px",
        opacity: phase >= 3 ? 1 : 0, transition: "opacity 1s ease 0.2s"
      }}>
        <div style={{ color: "rgba(201,168,76,0.32)", fontSize: 14, fontFamily: "Georgia,serif", letterSpacing: 1, marginBottom: 5 }}>{VERSES[0].arabic}</div>
        <div style={{ color: "rgba(240,232,212,0.18)", fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase" }}>{VERSES[0].translation} — {VERSES[0].ref}</div>
      </div>
    </div>
  );
}

// ─── CONFETTI ─────────────────────────────────────────────────────────────────
function useConfetti() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const fire = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const COLORS = ["#B8860B", "#C9A84C", "#E8C060", "#2D7A52", "#3A6EA8", "#8B4DAB", "#C07020", "#F0E8D4"];
    const particles = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width, y: -10,
      w: Math.random() * 11 + 4, h: Math.random() * 6 + 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * 4.5, vy: Math.random() * 5 + 2,
      vr: (Math.random() - 0.5) * 0.18, alpha: 1,
    }));
    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.rotation += p.vr; p.vy += 0.1;
        if (frame > 75) p.alpha -= 0.015;
        ctx.save(); ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
        ctx.fillStyle = p.color; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      frame++;
      if (frame < 150) animRef.current = requestAnimationFrame(animate);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(animate);
  }, []);
  return { canvasRef, fire };
}

// ─── ADD TASK MODAL ───────────────────────────────────────────────────────────
const PICKABLE_ICONS = ["star", "heart", "target", "clock", "book", "study", "notes", "refresh", "phone", "mail", "moon", "sun", "scroll", "hands", "quill", "flame", "lamp"];

function AddTaskModal({ role, onAdd, onClose }) {
  const [label, setLabel] = useState(""); const [icon, setIcon] = useState("star"); const [points, setPoints] = useState(15);
  const accent = role === "student" ? "#2A6FAB" : C.gold;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(44,31,14,0.55)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(8px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.surface, borderRadius: "22px 22px 0 0", padding: "28px 24px 40px", width: "100%", maxWidth: 500, boxShadow: "0 -8px 40px rgba(140,100,40,0.18)", border: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <span style={{ color: C.ink, fontWeight: 700, fontSize: 16, fontFamily: "Georgia,serif" }}>Add Custom Goal</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Icon name="x" size={18} color={C.muted} /></button>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", color: C.muted, fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Goal Name</label>
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Morning walk, 20 push-ups..."
            style={{ width: "100%", padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, color: C.ink, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", color: C.muted, fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
            Points <span style={{ color: accent, fontFamily: "Georgia,serif", fontSize: 17 }}>{points}</span>
          </label>
          <input type="range" min={5} max={30} step={5} value={points} onChange={e => setPoints(+e.target.value)} style={{ width: "100%", accentColor: accent }} />
          <div style={{ display: "flex", justifyContent: "space-between", color: C.faint, fontSize: 10, marginTop: 4 }}>
            {[5, 10, 15, 20, 25, 30].map(v => <span key={v}>{v}</span>)}
          </div>
        </div>
        <div style={{ marginBottom: 26 }}>
          <label style={{ display: "block", color: C.muted, fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Icon</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {PICKABLE_ICONS.map(i => (
              <button key={i} onClick={() => setIcon(i)} style={{ width: 42, height: 42, borderRadius: 11, border: `1.5px solid ${icon === i ? accent : C.border}`, background: icon === i ? `${accent}14` : C.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                <Icon name={i} size={18} color={icon === i ? accent : C.faint} />
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => { if (label.trim()) { onAdd({ id: `custom_${Date.now()}`, label: label.trim(), icon, points, category: "role" }); onClose(); } }}
          style={{ width: "100%", padding: "14px", background: label.trim() ? `linear-gradient(135deg,${accent}18,${accent}0D)` : "rgba(0,0,0,0.02)", border: `1.5px solid ${label.trim() ? accent : C.border}`, borderRadius: 12, color: label.trim() ? accent : C.faint, fontWeight: 700, fontSize: 15, cursor: label.trim() ? "pointer" : "default", transition: "all 0.2s", fontFamily: "Georgia,serif", letterSpacing: 0.5 }}>
          Add Goal
        </button>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function RamadanTracker() {
  const [screen, setScreen] = useState("splash");
  const [role, setRole] = useState(null);
  const [activeDay, setActiveDay] = useState(1);
  const [allData, setAllData] = useState({ student: {}, professional: {}, general: {} });
  const [allCustom, setAllCustom] = useState({ student: [], professional: [], general: [] });
  const [activeTab, setActiveTab] = useState("today");
  const [badgeModal, setBadgeModal] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [justChecked, setJustChecked] = useState(null);
  const [verseIdx, setVerseIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [prevPct, setPrevPct] = useState(0);
  const { canvasRef, fire } = useConfetti();

  useEffect(() => { const t = setInterval(() => setVerseIdx(i => (i + 1) % VERSES.length), 8000); return () => clearInterval(t); }, []);

  useEffect(() => {
    const load = () => {
      try {
        const r = localStorage.getItem("ram4_role"); if (r) setRole(r);
        const d = localStorage.getItem("ram4_all_data"); if (d) setAllData(JSON.parse(d));
        const c = localStorage.getItem("ram4_all_custom"); if (c) setAllCustom(JSON.parse(c));
      } catch (e) { console.error("Load error:", e); }
      setLoaded(true);
    };
    load();
  }, []);

  const persist = useCallback((data, ct) => {
    try {
      localStorage.setItem("ram4_all_data", JSON.stringify(data));
      if (ct !== undefined) localStorage.setItem("ram4_all_custom", JSON.stringify(ct));
    } catch (e) { console.error("Persist error:", e); }
  }, []);

  // Role-scoped accessors
  const currentRoleData = allData[role] || {};
  const currentRoleCustom = allCustom[role] || [];
  const allTasks = [...IBADAH_TASKS, ...(DEFAULT_ROLE_TASKS[role] || []), ...currentRoleCustom];
  const todayData = currentRoleData[activeDay] || {};

  const getDayPts = (d, r = role) => {
    const rData = allData[r] || {};
    const dData = rData[d] || {};
    const rCustom = allCustom[r] || [];
    const rTasks = [...IBADAH_TASKS, ...(DEFAULT_ROLE_TASKS[r] || []), ...rCustom];
    return rTasks.reduce((s, t) => s + (dData[t.id] ? t.points : 0), 0);
  };

  const getDayMaxPts = (r = role) => {
    const rCustom = allCustom[r] || [];
    return [...IBADAH_TASKS, ...(DEFAULT_ROLE_TASKS[r] || []), ...rCustom].reduce((s, t) => s + t.points, 0);
  };
  const maxPts = getDayMaxPts();
  const todayPts = getDayPts(activeDay);
  const pct = maxPts ? Math.round((todayPts / maxPts) * 100) : 0;
  const completedCount = allTasks.filter(t => todayData[t.id]).length;

  useEffect(() => { if (pct === 100 && prevPct < 100) fire(); setPrevPct(pct); }, [pct]);

  const toggleTask = id => {
    const updatedRoleData = { ...currentRoleData, [activeDay]: { ...todayData, [id]: !todayData[id] } };
    const newAllData = { ...allData, [role]: updatedRoleData };
    setAllData(newAllData); persist(newAllData, allCustom);
    if (!todayData[id]) { setJustChecked(id); setTimeout(() => setJustChecked(null), 700); }
  };

  const addCustomTask = task => {
    const newRoleCustom = [...currentRoleCustom, task];
    const newAllCustom = { ...allCustom, [role]: newRoleCustom };
    setAllCustom(newAllCustom); persist(allData, newAllCustom);
  };

  const removeCustomTask = id => {
    const newRoleCustom = currentRoleCustom.filter(t => t.id !== id);
    const newAllCustom = { ...allCustom, [role]: newRoleCustom };
    setAllCustom(newAllCustom); persist(allData, newAllCustom);
  };

  const getStats = () => {
    let totalPoints = 0, perfectDays = 0, maxStreak = 0, streak = 0;
    let tahajjudStreak = 0, quranStreak = 0, allPrayersStreak = 0, taraweehStreak = 0;
    let daysTracked = 0;
    let [ct, cq, cp, ctr] = [0, 0, 0, 0];

    for (let d = 1; d <= 30; d++) {
      const dd = currentRoleData[d] || {};
      const dMax = getDayMaxPts();
      const dPts = getDayPts(d);
      if (Object.values(dd).some(Boolean)) daysTracked++;

      totalPoints += dPts;
      const perfect = allTasks.every(t => dd[t.id]);
      perfect ? (streak++, maxStreak = Math.max(maxStreak, streak), perfectDays++) : (streak = 0);
      dd.tahajjud ? (ct++, tahajjudStreak = Math.max(tahajjudStreak, ct)) : (ct = 0);
      dd.quran_para ? (cq++, quranStreak = Math.max(quranStreak, cq)) : (cq = 0);
      dd.taraweeh ? (ctr++, taraweehStreak = Math.max(taraweehStreak, ctr)) : (ctr = 0);
      ["fajr", "zuhr", "asr", "maghrib", "isha"].every(p => dd[p]) ? (cp++, allPrayersStreak = Math.max(allPrayersStreak, cp)) : (cp = 0);
    }
    const avgPct = daysTracked ? (totalPoints / (daysTracked * maxPts)) * 100 : 0;
    return { totalPoints, perfectDays, maxStreak, tahajjudStreak, quranStreak, allPrayersStreak, taraweehStreak, daysTracked, avgPct };
  };

  const stats = getStats();
  const cert = stats.avgPct >= 85 ? { lbl: "Gold Badge Certificate", color: "#FFD700" } : stats.avgPct >= 75 ? { lbl: "Silver Badge Certificate", color: "#C0C0C0" } : stats.avgPct >= 60 ? { lbl: "Bronze Badge Certificate", color: "#CD7F32" } : null;
  const earnedBadges = BADGES.filter(b => b.condition(stats));
  const roleColor = role === "student" ? "#2A6FAB" : role === "professional" ? C.gold : "#2D7A52";

  const taskGroups = [
    { label: "Namaaz", color: ICON_COLORS.namaaz, tasks: IBADAH_TASKS.filter(t => t.category === "namaaz") },
    { label: "Quran", color: ICON_COLORS.quran, tasks: IBADAH_TASKS.filter(t => t.category === "quran") },
    { label: "Sunnah & Dua", color: ICON_COLORS.dua, tasks: IBADAH_TASKS.filter(t => ["sunnah", "dua", "knowledge"].includes(t.category)) },
    ...([...(DEFAULT_ROLE_TASKS[role] || []), ...currentRoleCustom].length ? [{
      label: role === "student" ? "Student Goals" : role === "professional" ? "Work Goals" : "",
      color: roleColor, tasks: [...(DEFAULT_ROLE_TASKS[role] || []), ...currentRoleCustom], isRole: true,
    }] : []),
  ].filter(g => g.tasks.length || g.isRole);

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:${C.bg};overflow-x:hidden}
    ::-webkit-scrollbar{display:none}
    input[type=range]{-webkit-appearance:none;height:4px;border-radius:2px;background:${C.ghost}}
    input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:${C.gold};cursor:pointer}
    @keyframes fadeInUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes checkPop{0%{transform:scale(1)}40%{transform:scale(1.04)}100%{transform:scale(1)}}
    @keyframes splashPulse{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.2);opacity:1}}
    @keyframes onboardIn{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
    @keyframes verseIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  `;

  if (!loaded || screen === "splash") return (
    <><style>{css}</style><SplashScreen onDone={() => setScreen(role ? "app" : "onboard")} /></>
  );

  // ── ONBOARDING ───────────────────────────────────────────────────────────────
  if (screen === "onboard" || !role) return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "DM Sans,sans-serif", position: "relative", overflow: "hidden" }}>
        {/* Ghost Arabic watermarks */}
        {VERSES.slice(0, 3).map((v, i) => (
          <div key={i} style={{ position: "absolute", color: "rgba(180,140,60,0.07)", fontSize: 20, fontFamily: "Georgia,serif", pointerEvents: "none", userSelect: "none", left: `${5 + i * 32}%`, top: `${10 + i * 30}%`, maxWidth: 280, textAlign: "center", lineHeight: 2 }}>{v.arabic}</div>
        ))}
        {/* Subtle warm glow */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(201,168,76,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 420, width: "100%", textAlign: "center", animation: "onboardIn 0.7s cubic-bezier(0.16,1,0.3,1)" }}>
          <div style={{ fontFamily: "Georgia,serif", color: C.gold, fontSize: 44, marginBottom: 6, letterSpacing: 3, textShadow: `0 2px 20px rgba(184,134,11,0.2)` }}>رمضان</div>
          <h1 style={{ fontFamily: "Georgia,serif", color: C.ink, fontSize: 26, fontWeight: 600, marginBottom: 6 }}>Ramadan Tracker</h1>
          <p style={{ color: C.faint, fontSize: 11, fontWeight: 300, marginBottom: 38, letterSpacing: 1.5, textTransform: "uppercase" }}>2026 · Choose your path</p>

          <div style={{ background: C.surface, borderRadius: 22, padding: "26px 20px", border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
            <p style={{ color: C.faint, fontSize: 9, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", marginBottom: 20 }}>I am a…</p>
            {[["student", "study", "Student", "Ibadah + academic goals"], ["professional", "target", "Professional", "Ibadah + career goals"], ["general", "hands", "General", "Pure Ibadah focus"]].map(([r, ico, lbl, desc]) => (
              <button key={r} onClick={() => { setRole(r); setScreen("app"); try { localStorage.setItem("ram4_role", r); } catch (e) { console.error("Role save error:", e); } }}
                style={{ display: "flex", alignItems: "center", gap: 16, width: "100%", padding: "14px 16px", marginBottom: 10, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = C.goldPale; e.currentTarget.style.borderColor = C.borderStrong; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.bg; e.currentTarget.style.borderColor = C.border; }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: C.goldPale, border: `1px solid ${C.borderStrong}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={ico} size={20} color={C.gold} />
                </div>
                <div>
                  <div style={{ color: C.ink, fontWeight: 600, fontSize: 15, fontFamily: "Georgia,serif", marginBottom: 2 }}>{lbl}</div>
                  <div style={{ color: C.faint, fontSize: 12, fontWeight: 300 }}>{desc}</div>
                </div>
                <div style={{ marginLeft: "auto" }}><Icon name="x" size={14} color={C.ghost} style={{ transform: "rotate(45deg)" }} /></div>
              </button>
            ))}
          </div>
          <p style={{ color: C.faint, fontSize: 10, marginTop: 18, letterSpacing: 0.5, fontStyle: "italic", fontFamily: "Georgia,serif" }}>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
        </div>
      </div>
    </>
  );

  // ── MAIN APP ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1000 }} />

      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "DM Sans,sans-serif", color: C.body, paddingBottom: 80 }}>

        {/* Verse strip — bottom */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "10px 24px 16px", background: `linear-gradient(0deg,${C.bg} 55%,transparent)`, textAlign: "center", pointerEvents: "none", zIndex: 10 }}>
          <div key={verseIdx} style={{ animation: "verseIn 1s ease", fontFamily: "Georgia,serif" }}>
            <div style={{ color: C.goldLight, fontSize: 13, letterSpacing: 1, marginBottom: 3, opacity: 0.8 }}>{VERSES[verseIdx].arabic}</div>
            <div style={{ color: C.muted, fontSize: 9, fontWeight: 300, letterSpacing: 0.5, opacity: 0.7 }}>{VERSES[verseIdx].translation} — {VERSES[verseIdx].ref}</div>
          </div>
        </div>

        {/* ── HEADER ── */}
        <div style={{ background: C.header, borderBottom: `1px solid ${C.border}`, padding: "16px 20px 0", boxShadow: "0 1px 8px rgba(140,100,40,0.06)" }}>
          <div style={{ maxWidth: 520, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: "Georgia,serif", color: C.gold, fontSize: 12, letterSpacing: 2 }}>🌙 RAMADAN {new Date().getFullYear()}</div>
                <div style={{ color: C.faint, fontSize: 11, fontWeight: 300, marginTop: 2 }}>
                  {role === "student" ? "Student" : role === "professional" ? "Professional" : "General"} · Day {activeDay} of 30
                </div>
              </div>
              <button onClick={() => setScreen("onboard")} style={{ background: C.goldPalest, border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 11px", color: C.muted, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = C.goldPale}
                onMouseLeave={e => e.currentTarget.style.background = C.goldPalest}>
                <Icon name="refresh" size={11} color={C.muted} /> Switch
              </button>
            </div>

            {/* Day strip */}
            <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 12 }}>
              {Array.from({ length: 30 }, (_, i) => i + 1).map(d => {
                const frac = maxPts ? getDayPts(d) / maxPts : 0; const isActive = d === activeDay; const isDone = frac >= 1;
                return (
                  <button key={d} onClick={() => setActiveDay(d)} style={{
                    flex: "0 0 auto", width: 34, height: 44, borderRadius: 9,
                    border: `1.5px solid ${isActive ? C.gold : C.border}`,
                    background: isDone ? C.goldPale : frac > 0 ? `rgba(45,122,82,${0.05 + frac * 0.15})` : C.surface,
                    cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, transition: "all 0.15s",
                    boxShadow: isActive ? `0 0 0 2px ${C.goldPale}` : C.shadow
                  }}>
                    <span style={{ fontSize: 9, color: isActive ? C.gold : C.faint, fontWeight: isActive ? 700 : 400 }}>{d}</span>
                    {isDone ? <Icon name="check" size={8} color={C.gold} /> : frac > 0 ? <div style={{ width: 14, height: 2, borderRadius: 1, background: C.ghost }}><div style={{ width: `${frac * 100}%`, height: "100%", background: C.green, borderRadius: 1 }} /></div> : null}
                  </button>
                );
              })}
            </div>

            {/* Tabs */}
            <div style={{ display: "flex" }}>
              {[["today", "book", "Today"], ["progress", "target", "Progress"], ["badges", "trophy", "Badges"]].map(([tab, ico, lbl]) => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  flex: 1, padding: "9px 0", background: "none", border: "none",
                  borderBottom: `2.5px solid ${activeTab === tab ? C.gold : "transparent"}`,
                  color: activeTab === tab ? C.gold : C.faint, cursor: "pointer", fontWeight: activeTab === tab ? 600 : 400, fontSize: 12,
                  letterSpacing: 0.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "all 0.15s", fontFamily: "DM Sans,sans-serif"
                }}>
                  <Icon name={ico} size={12} color={activeTab === tab ? C.gold : C.faint} />{lbl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "22px 17px 100px" }}>

          {/* TODAY */}
          {activeTab === "today" && <>
            {/* Hero progress card */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: "18px 20px", marginBottom: 22, display: "flex", alignItems: "center", gap: 18, boxShadow: C.shadowMd, animation: "fadeInUp 0.5s ease" }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <svg width={74} height={74} viewBox="0 0 74 74">
                  <circle cx={37} cy={37} r={31} fill="none" stroke={C.ghost} strokeWidth={5} />
                  <circle cx={37} cy={37} r={31} fill="none" stroke={pct === 100 ? C.gold : pct > 60 ? C.green : C.goldLight} strokeWidth={5}
                    strokeDasharray={`${2 * Math.PI * 31}`} strokeDashoffset={`${2 * Math.PI * 31 * (1 - pct / 100)}`}
                    strokeLinecap="round" transform="rotate(-90 37 37)" style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(.4,0,.2,1)" }} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia,serif", color: pct === 100 ? C.gold : C.ink, fontSize: 17, fontWeight: 700 }}>{pct}%</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "Georgia,serif", color: C.gold, fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{todayPts}<span style={{ fontSize: 13, color: C.faint, fontWeight: 400, fontFamily: "DM Sans" }}> / {maxPts} pts</span></div>
                <div style={{ color: C.muted, fontSize: 12, marginTop: 4, fontWeight: 300 }}>{completedCount} of {allTasks.length} completed · Day {activeDay}</div>
                {stats.maxStreak > 1 && <div style={{ color: "#C04A20", fontSize: 11, marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}><Icon name="flame" size={12} color="#C04A20" /> {stats.maxStreak} day streak</div>}
                {pct === 100 && <div style={{ color: C.gold, fontSize: 12, marginTop: 5, fontFamily: "Georgia,serif", fontStyle: "italic" }}>Perfect Day — Masha'Allah ✦</div>}
              </div>
            </div>

            {/* Task groups */}
            {taskGroups.map(group => (
              <div key={group.label} style={{ marginBottom: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
                  <span style={{ color: group.color, fontSize: 9, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", opacity: 0.8 }}>{group.label}</span>
                  {group.isRole && (
                    <button onClick={() => setShowAddTask(true)} style={{ display: "flex", alignItems: "center", gap: 5, background: C.goldPalest, border: `1px solid ${C.border}`, borderRadius: 7, padding: "4px 10px", cursor: "pointer", color: roleColor, fontSize: 11, fontWeight: 600, transition: "all 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = C.goldPale}
                      onMouseLeave={e => e.currentTarget.style.background = C.goldPalest}>
                      <Icon name="plus" size={11} color={roleColor} /> Add Goal
                    </button>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {group.tasks.map(task => {
                    const done = !!todayData[task.id]; const animating = justChecked === task.id;
                    const isCustom = currentRoleCustom.find(ct => ct.id === task.id);
                    const iconColor = ICON_COLORS[task.category] || group.color;
                    return (
                      <div key={task.id} style={{ display: "flex", alignItems: "stretch", animation: animating ? "checkPop 0.5s ease" : undefined }}>
                        <button onClick={() => toggleTask(task.id)} style={{
                          flex: 1, display: "flex", alignItems: "center", gap: 13, padding: "12px 14px",
                          background: done ? C.greenBg : C.surface,
                          border: `1.5px solid ${done ? C.greenBorder : C.border}`,
                          borderRadius: isCustom ? "13px 0 0 13px" : "13px",
                          cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                          boxShadow: done ? "none" : C.shadow
                        }}>
                          <div style={{ width: 23, height: 23, borderRadius: 7, border: `2px solid ${done ? C.green : C.border}`, background: done ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.25s" }}>
                            {done && <Icon name="check" size={12} color="#FFFDF7" />}
                          </div>
                          <div style={{ width: 33, height: 33, borderRadius: 9, background: `${iconColor}12`, border: `1px solid ${iconColor}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Icon name={task.icon} size={16} color={done ? `${iconColor}55` : iconColor} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: done ? C.green : C.body, fontWeight: 500, fontSize: 13.5, textDecoration: done ? "line-through" : "none", transition: "all 0.2s" }}>{task.label}</div>
                            {task.rakah && <div style={{ color: C.faint, fontSize: 10, marginTop: 2, fontWeight: 300 }}>{task.rakah}</div>}
                          </div>
                          <div style={{ color: done ? C.green : C.faint, fontSize: 11, fontWeight: 700, flexShrink: 0, fontFamily: "Georgia,serif" }}>+{task.points}</div>
                        </button>
                        {isCustom && (
                          <button onClick={() => removeCustomTask(task.id)} style={{ padding: "0 12px", background: C.surface, border: `1.5px solid ${C.border}`, borderLeft: "none", borderRadius: "0 13px 13px 0", cursor: "pointer", display: "flex", alignItems: "center", transition: "all 0.15s", boxShadow: C.shadow }}
                            onMouseEnter={e => e.currentTarget.style.background = "#FEF0EE"}
                            onMouseLeave={e => e.currentTarget.style.background = C.surface}>
                            <Icon name="trash" size={14} color={C.faint} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </>}

          {/* PROGRESS */}
          {activeTab === "progress" && <>
            {/* Certificate Bold Line */}
            <div style={{ background: C.surface, border: `2.5px solid ${C.gold}`, borderRadius: 16, padding: "20px", marginBottom: 22, textAlign: "center", boxShadow: C.shadowMd, animation: "fadeInUp 0.6s ease" }}>
              <div style={{ color: C.ink, fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, opacity: 0.9 }}>Achievement Status</div>
              {cert ? (
                <div style={{ fontSize: 22, fontWeight: 900, color: cert.color, fontFamily: "Georgia,serif", textShadow: "0 2px 10px rgba(0,0,0,0.1)", animation: "checkPop 0.8s ease" }}>
                  🏆 {cert.lbl}
                </div>
              ) : (
                <div style={{ fontSize: 16, fontWeight: 700, color: C.faint, fontStyle: "italic" }}>
                  Reach 60% average completion for Bronze
                </div>
              )}
              <div style={{ width: "100%", height: 6, background: C.ghost, borderRadius: 10, marginTop: 15, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, stats.avgPct)}%`, height: "100%", background: cert ? cert.color : C.gold, transition: "width 1s ease" }} />
              </div>
              <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: C.muted }}>Current Average: {Math.round(stats.avgPct)}%</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
              {[{ label: "Total Points", value: stats.totalPoints, icon: "gem", color: C.gold }, { label: "Perfect Days", value: stats.perfectDays, icon: "star", color: C.green }, { label: "Best Streak", value: `${stats.maxStreak}d`, icon: "flame", color: "#C04A20" }, { label: "Badges", value: `${earnedBadges.length}/${BADGES.length}`, icon: "trophy", color: "#8B4DAB" }].map(s => (
                <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 15px", boxShadow: C.shadow }}>
                  <Icon name={s.icon} size={20} color={s.color} />
                  <div style={{ fontFamily: "Georgia,serif", color: s.color, fontSize: 28, fontWeight: 700, marginTop: 6, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ color: C.muted, fontSize: 11, marginTop: 3, fontWeight: 300 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ color: C.muted, fontSize: 9, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>30-Day Overview</div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "14px", marginBottom: 12, boxShadow: C.shadow }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 5 }}>
                {Array.from({ length: 30 }, (_, i) => i + 1).map(d => {
                  const frac = maxPts ? getDayPts(d) / maxPts : 0; const isActive = d === activeDay;
                  const bg = frac === 0 ? C.bg : frac < 0.4 ? "rgba(45,122,82,0.1)" : frac < 0.7 ? "rgba(45,122,82,0.22)" : frac < 1 ? "rgba(184,134,11,0.22)" : "rgba(184,134,11,0.55)";
                  const textColor = frac > 0.7 ? C.gold : C.faint;
                  return (
                    <div key={d} onClick={() => { setActiveDay(d); setActiveTab("today"); }} style={{ aspectRatio: "1", borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: `1.5px solid ${isActive ? C.gold : C.border}`, fontSize: 10, color: textColor, fontWeight: 600, transition: "all 0.15s" }}>{d}</div>
                  );
                })}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
              {[[C.bg, "No data"], ["rgba(45,122,82,0.1)", "<40%"], ["rgba(45,122,82,0.22)", "40–70%"], ["rgba(184,134,11,0.22)", "70–99%"], ["rgba(184,134,11,0.55)", "Perfect ✓"]].map(([bg, lbl]) => (
                <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 11, height: 11, borderRadius: 3, background: bg, border: `1px solid ${C.border}` }} />
                  <span style={{ color: C.faint, fontSize: 10 }}>{lbl}</span>
                </div>
              ))}
            </div>

            <div style={{ color: C.muted, fontSize: 9, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 14 }}>Habit Streaks</div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 18px", boxShadow: C.shadow }}>
              {[{ label: "All 5 Daily Prayers", val: stats.allPrayersStreak, icon: "mosque", color: C.gold }, { label: "Tahajjud", val: stats.tahajjudStreak, icon: "star", color: "#8B4DAB" }, { label: "Quran Para Daily", val: stats.quranStreak, icon: "book", color: C.green }, { label: "Taraweeh Nightly", val: stats.taraweehStreak, icon: "moon", color: "#2A6FAB" }].map((s, i) => (
                <div key={s.label} style={{ marginBottom: i < 3 ? 16 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}><Icon name={s.icon} size={14} color={s.color} /><span style={{ color: C.body, fontSize: 13, fontWeight: 400 }}>{s.label}</span></div>
                    <span style={{ fontFamily: "Georgia,serif", color: s.color, fontSize: 15, fontWeight: 700 }}>{s.val} days</span>
                  </div>
                  <div style={{ height: 5, background: C.ghost, borderRadius: 3 }}>
                    <div style={{ width: `${(s.val / 30) * 100}%`, height: "100%", borderRadius: 3, background: s.color, opacity: 0.7, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          </>}

          {/* BADGES */}
          {activeTab === "badges" && <>
            <div style={{ color: C.muted, fontSize: 13, marginBottom: 18, fontWeight: 300 }}>
              <span style={{ fontFamily: "Georgia,serif", color: C.gold, fontSize: 19, fontWeight: 700 }}>{earnedBadges.length}</span> of {BADGES.length} badges earned
              {earnedBadges.length === 0 && <span style={{ color: C.faint }}> — complete tasks to begin</span>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {BADGES.map(badge => {
                const earned = badge.condition(stats);
                return (
                  <button key={badge.id} onClick={() => setBadgeModal(badge)} style={{ background: earned ? C.surface : C.bg, border: `1.5px solid ${earned ? badge.color + "40" : C.border}`, borderRadius: 16, padding: "18px 12px", cursor: "pointer", textAlign: "center", filter: earned ? "none" : "grayscale(1) opacity(0.4)", transition: "all 0.2s", position: "relative", boxShadow: earned ? C.shadow : "none" }}>
                    {earned && <div style={{ position: "absolute", top: 9, right: 9, width: 6, height: 6, borderRadius: "50%", background: C.green }} />}
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                      <div style={{ width: 46, height: 46, borderRadius: 14, background: `${badge.color}14`, border: `1.5px solid ${badge.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name={badge.icon} size={22} color={badge.color} />
                      </div>
                    </div>
                    <div style={{ fontFamily: "Georgia,serif", color: earned ? C.ink : C.faint, fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>{badge.label}</div>
                    {earned && <div style={{ color: C.green, fontSize: 9, marginTop: 5, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600 }}>✓ Earned</div>}
                  </button>
                );
              })}
            </div>
          </>}
        </div>
      </div>

      {/* Badge Modal */}
      {badgeModal && (
        <div onClick={() => setBadgeModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(44,31,14,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24, backdropFilter: "blur(10px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.surface, border: `1.5px solid ${badgeModal.color}35`, borderRadius: 24, padding: 34, textAlign: "center", maxWidth: 290, width: "100%", animation: "fadeInUp 0.35s ease", boxShadow: C.shadowMd }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: `${badgeModal.color}14`, border: `1.5px solid ${badgeModal.color}30`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <Icon name={badgeModal.icon} size={34} color={badgeModal.color} />
            </div>
            <div style={{ fontFamily: "Georgia,serif", color: C.ink, fontSize: 21, fontWeight: 700, marginBottom: 7 }}>{badgeModal.label}</div>
            <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 20, fontWeight: 300 }}>{badgeModal.desc}</div>
            {badgeModal.condition(stats) ? <div style={{ color: C.green, fontWeight: 700, fontSize: 14, marginBottom: 22 }}>✦ Earned — Masha'Allah</div> : <div style={{ color: C.faint, fontSize: 12, marginBottom: 22 }}>Keep going to unlock</div>}
            <button onClick={() => setBadgeModal(null)} style={{ background: C.goldPalest, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 28px", color: C.muted, cursor: "pointer", fontWeight: 600, fontSize: 13, transition: "all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = C.goldPale}
              onMouseLeave={e => e.currentTarget.style.background = C.goldPalest}>
              Close
            </button>
          </div>
        </div>
      )}

      {showAddTask && <AddTaskModal role={role} onAdd={addCustomTask} onClose={() => setShowAddTask(false)} />}
    </>
  );
}
